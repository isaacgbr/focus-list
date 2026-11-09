import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";

test("produção unificada preserva API e serve SPA/PWA sem autenticar o shell", async (t) => {
  const previous = { ...process.env };
  Object.assign(process.env, { NODE_ENV: "production", RENDER: "true", FRONTEND_ORIGIN: "https://focuslist.invalid" });
  t.after(() => { process.env = previous; });
  const { default: app } = await import("../dist/app.js");
  const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const path of ["/", "/app", "/app/perfil", "/app/areas/1", "/app/areas/1/listas/2", "/areas/1", "/areas/1/listas/2", "/login", "/cadastro", "/demo", "/demo/dados", "/recuperar-senha", "/redefinir-senha"]) {
    const response = await fetch(base + path, { headers: { Accept: "text/html" } });
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.match(await response.text(), /id="root"/);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
  for (const [path, type] of [["/sw.js", /javascript/], ["/manifest.webmanifest", /manifest\+json/], ["/offline.html", /text\/html/], ["/offline.js", /javascript/], ["/offline.css", /text\/css/], ["/icons/icon-192.png", /image\/png/]]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type"), type);
    assert.equal(response.headers.get("cache-control"), "no-cache");
    assert.ok(!(await response.text()).includes('id="root"'));
  }
  const probe = await fetch(base + "/offline.html?connection-check", { method: "HEAD" });
  assert.equal(probe.status, 200);
  const health = await fetch(base + "/health");
  assert.equal(health.status, 200); assert.equal((await health.json()).status, "OK");
  for (const path of ["/api", "/api/missing", "/health/missing", "/auth/session", "/tasks", "/areas", "/profile/avatar"]) {
    const response = await fetch(base + path);
    assert.match(response.headers.get("content-type"), /application\/json/);
    assert.ok([401, 404].includes(response.status));
  }
  for (const accept of ["application/json", "*/*"]) {
    const response = await fetch(base + "/areas/1", { headers: { Accept: accept } });
    assert.equal(response.status, 401);
    assert.match(response.headers.get("content-type"), /application\/json/);
    assert.match(response.headers.get("vary"), /\bAccept\b/i);
  }
  for (const path of ["/assets/missing.js", "/missing.webmanifest", "/app/missing.js", "/missing", "/.env"]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 404, path);
    assert.match(response.headers.get("content-type"), /application\/json/);
  }
  assert.equal((await fetch(base + "/login", { method: "POST" })).status, 404);
  assert.equal((await fetch(base + "/app", { headers: { "Sec-Fetch-Site": "cross-site" } })).status, 200);
  assert.equal((await fetch(base + "/health", { headers: { Origin: "https://external.invalid" } })).status, 403);
});
