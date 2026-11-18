import assert from "node:assert/strict";
import { once } from "node:events";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import test from "node:test";
import express from "express";

const root = new URL("../../", import.meta.url);
const config = JSON.parse(await readFile(new URL("vercel.json", root), "utf8"));

test("produção Vercel separa Function, SPA e arquivos da PWA", async (t) => {
  const previous = { ...process.env };
  Object.assign(process.env, { NODE_ENV: "production", VERCEL: "1", FRONTEND_ORIGIN: "https://focuslist.invalid" });
  t.after(() => { process.env = previous; });
  const { default: handler } = await import("../../api/focuslist.mjs");
  const dist = fileURLToPath(new URL(config.outputDirectory + "/", root));
  const platform = express();

  // Emula as regras relevantes do vercel.json; a plataforma continua responsável
  // pelo roteamento e empacotamento reais do deployment de produção.
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
    assert.equal(response.headers.get("vercel-cdn-cache-control"), "no-store");
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

  const post = (path, body, headers = {}) => get(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: process.env.FRONTEND_ORIGIN, ...headers },
    body: JSON.stringify(body),
  });
  const loginFrom = (ip, forwarded) => post("/auth/login", {}, {
    "x-vercel-forwarded-for": ip,
    "x-forwarded-for": forwarded,
  });
  for (let i = 0; i < 30; i++) {
    assert.equal((await loginFrom("192.0.2.1", "198.51.100.1")).status, 400);
  }
  assert.equal((await loginFrom("192.0.2.1", "198.51.100.2")).status, 429);
  assert.equal((await loginFrom("192.0.2.2", "198.51.100.2")).status, 400);

  await t.test("recuperação responde 202 enquanto a Vercel mantém o envio em execução", async (t) => {
    const { default: authRepository } = await import("../dist/repositories/auth.repository.js");
    const { default: emailService } = await import("../dist/services/email.service.js");
    const email = "recovery@focuslist.invalid";
    const delivery = Promise.withResolvers();
    const tasks = [];
    // Emula o contexto disponibilizado pelo runtime ao SDK, sem chamar o Resend.
    const context = Symbol.for("@vercel/request-context");
    const previousContext = Object.getOwnPropertyDescriptor(globalThis, context);
    Object.defineProperty(globalThis, context, {
      configurable: true,
      value: { get: () => ({ waitUntil: (task) => tasks.push(task) }) },
    });
    t.after(() => {
      if (previousContext) Object.defineProperty(globalThis, context, previousContext);
      else delete globalThis[context];
    });
    t.mock.method(authRepository, "findAccount", async (address) => address === email ? { id: 1, type: "REAL" } : null);
    t.mock.method(authRepository, "createPasswordReset", async () => true);
    const send = t.mock.method(emailService, "sendPasswordReset", () => delivery.promise);
    try {
      const response = await get("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: process.env.FRONTEND_ORIGIN },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(3000),
      });
      assert.equal(response.status, 202);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(send.mock.callCount(), 1);
      assert.equal(tasks.length, 1);
      const absent = await post("/auth/forgot-password", { email: "absent@focuslist.invalid" });
      assert.equal(absent.status, 202);
      assert.deepEqual(await response.json(), await absent.json());
      assert.equal(tasks.length, 1);
    } finally {
      delivery.resolve();
      await Promise.all(tasks);
    }
  });

  if (process.env.FOCUSLIST_AUTH_TESTS === "LOCAL_CONTROLLED") {
    assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(new URL(process.env.DATABASE_URL).hostname));
    const { default: prisma, disconnectDatabase } = await import("../dist/config/prisma.js");
    const email = "vercel-" + randomUUID() + "@focuslist.invalid";
    const password = randomBytes(16).toString("hex");
    t.after(async () => {
      try {
        await prisma.area.deleteMany({ where: { user: { email } } });
        await prisma.user.deleteMany({ where: { email } });
      }
      finally { await disconnectDatabase(); }
    });
    const registered = await post("/auth/register", { name: "Produção", email, password, confirmPassword: password });
    assert.equal(registered.status, 201);
    const login = await post("/auth/login", { email, password });
    assert.equal(login.status, 200);
    const setCookie = login.headers.get("set-cookie") ?? "";
    assert.ok(setCookie.startsWith("__Host-focuslist_session="));
    for (const flag of ["HttpOnly", "Secure", "SameSite=Lax", "Path=/"]) assert.ok(setCookie.includes(flag), flag);
    const cookie = setCookie.split(";")[0];
    const created = await post("/areas", { title: "Área de validação" }, { Cookie: cookie });
    assert.equal(created.status, 201);
    const { id } = await created.json();
    for (const path of ["/auth/session", "/dashboard?today=2026-10-26", "/areas", "/auth/session"]) {
      const response = await get(path, { headers: { Cookie: cookie } });
      assert.equal(response.status, 200, path);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(response.headers.get("vercel-cdn-cache-control"), "no-store");
      if (path === "/areas") assert.ok((await response.json()).some((area) => area.id === id));
    }
    assert.equal((await post("/auth/logout", {}, { Cookie: cookie })).status, 204);
    assert.equal((await get("/auth/session", { headers: { Cookie: cookie } })).status, 401);
  }
});
