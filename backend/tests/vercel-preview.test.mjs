import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import test from "node:test";
import express from "express";

const root = new URL("../../", import.meta.url);
const config = JSON.parse(await readFile(new URL("vercel.json", root), "utf8"));

test("piloto Vercel separa Function, SPA e arquivos da PWA", async (t) => {
  const previous = { ...process.env };
  Object.assign(process.env, { NODE_ENV: "production", VERCEL: "1", FRONTEND_ORIGIN: "https://preview.focuslist.invalid" });
  delete process.env.RENDER;
  t.after(() => { process.env = previous; });
  const { default: handler } = await import("../../api/focuslist.mjs");
  const dist = fileURLToPath(new URL(config.outputDirectory + "/", root));
  const platform = express();

  // Emula somente as regras usadas no vercel.json. O roteador da plataforma
  // e o empacotamento da Function precisam de verificação no Preview.
  for (const route of config.routes) {
    if (route.handle === "filesystem") {
      platform.use(express.static(dist));
      continue;
    }
    const pattern = new RegExp(route.src);
    platform.use((req, res, next) => {
      const match = pattern.exec(req.path);
      if (!match || (route.methods && !route.methods.includes(req.method))) return next();
      if (route.has?.some(({ key, value }) => !new RegExp("^(?:" + value + ")$").test(req.get(key) ?? ""))) return next();
      res.set(route.headers);
      if (route.continue) return next();
      if (route.dest === "/index.html") return res.sendFile("index.html", { root: dist });
      assert.equal(route.dest, "/api/focuslist");
      const path = route.transforms.find(({ type }) => type === "request.path").args.replace("$1", match[1]);
      req.url = path + new URL(req.originalUrl, "http://localhost").search;
      handler(req, res);
    });
  }
  platform.use((_req, res) => res.sendStatus(404));
  const server = createServer(platform).listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = "http://127.0.0.1:" + server.address().port;
  const get = (path, options) => fetch(base + path, options);
  const navigation = { headers: { Accept: "text/html,application/xhtml+xml,*/*;q=0.8" } };

  for (const path of ["/", "/app/perfil", "/app/areas/1/listas/2", "/redefinir-senha", "/areas/1", "/areas/1/listas/2"]) {
    const response = await get(path, navigation);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), /id="root"/, path);
  }
  const health = await get("/health?probe=1", navigation);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, "OK");
  for (const path of ["/api", "/api/focuslist", "/api/missing"]) {
    const response = await get(path, navigation);
    assert.equal(response.status, 404, path);
    assert.equal(typeof (await response.json()).message, "string");
  }
  for (const path of ["/auth/session", "/areas/1", "/areas/1/listas/2", "/profile/avatar"]) {
    const response = await get(path, { headers: { Accept: "application/json, text/plain, */*" } });
    assert.equal(response.status, 401, path);
    assert.equal(response.headers.get("cache-control"), "no-store");
    await response.json();
  }
  const malformed = await get("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: process.env.FRONTEND_ORIGIN },
    body: "{",
  });
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).message, "JSON inválido.");
  for (const [path, type] of [["/sw.js", /javascript/], ["/manifest.webmanifest", /manifest\+json/], ["/offline.html", /text\/html/]]) {
    const response = await get(path, navigation);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type"), type);
    assert.ok(!(await response.text()).includes('id="root"'));
  }
  assert.equal((await get("/offline.html?connection-check", { method: "HEAD" })).status, 200);
  for (const path of ["/assets/missing.js", "/app/missing.js", "/missing.webmanifest"]) {
    assert.equal((await get(path, navigation)).status, 404, path);
  }
});
