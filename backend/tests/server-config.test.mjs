import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import { serverAddress } from "../dist/config/server.js";

test("porta do ambiente e bind de produção preservam execução local", () => {
  assert.deepEqual(serverAddress({}), { port: 3000, host: "127.0.0.1" });
  assert.deepEqual(serverAddress({ PORT: "4321", HOST: "localhost" }), { port: 4321, host: "localhost" });
  assert.deepEqual(serverAddress({ NODE_ENV: "production", PORT: "4321", HOST: "localhost" }), { port: 4321, host: "0.0.0.0" });
  for (const PORT of [undefined, "", "bad", "0", "-1", "65536", "1.5"]) assert.throws(() => serverAddress({ NODE_ENV: "production", PORT }), /PORT/);
});

test("produção aceita origem HTTPS exata, rejeita cross-site e preserva cookies seguros", async (t) => {
  const original = { ...process.env };
  Object.assign(process.env, { NODE_ENV: "production", VERCEL: "1", FRONTEND_ORIGIN: "https://app.focuslist.invalid" });
  t.after(() => { process.env = original; });
  const { default: app } = await import("../dist/app.js");
  const { cookieName, cookieOptions } = await import("../dist/security/session.js");
  assert.equal(app.get("trust proxy"), false);
  assert.equal(cookieName, "__Host-focuslist_session");
  assert.equal(cookieOptions.secure, true);
  assert.equal(cookieOptions.httpOnly, true);
  assert.equal(cookieOptions.sameSite, "lax");
  assert.equal(cookieOptions.domain, undefined);
  const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/health`;
  const allowed = await fetch(url, { headers: { Origin: process.env.FRONTEND_ORIGIN, "Sec-Fetch-Site": "same-site" } });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get("access-control-allow-origin"), process.env.FRONTEND_ORIGIN);
  assert.equal(allowed.headers.get("access-control-allow-credentials"), "true");
  assert.equal((await fetch(url, { headers: { Origin: "https://external.invalid" } })).status, 403);
  assert.equal((await fetch(url, { headers: { Origin: process.env.FRONTEND_ORIGIN, "Sec-Fetch-Site": "cross-site" } })).status, 403);
});
