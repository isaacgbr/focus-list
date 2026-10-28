import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import test from "node:test";

if (process.env.FOCUSLIST_AUTH_TESTS !== "LOCAL_CONTROLLED") {
  throw new Error("Defina FOCUSLIST_AUTH_TESTS=LOCAL_CONTROLLED para autorizar os testes locais.");
}
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env.DATABASE_URL).hostname));

const { default: app } = await import("../dist/app.js");
const { default: prisma, disconnectDatabase } = await import("../dist/config/prisma.js");
const { default: repository } = await import("../dist/repositories/auth.repository.js");
const { tokenHash } = await import("../dist/security/session.js");

// Integração de segurança HTTP/PostgreSQL, complementar ao teste de entrega real.
// Tokens de fixture são emitidos pelo repositório; este teste não envia e-mail.
test("recuperação no PostgreSQL real: validade, consumo atômico, sessões e login", async (t) => {
  const email = `recovery-${randomUUID()}@focuslist.invalid`;
  const oldPassword = randomBytes(12).toString("hex");
  const newPassword = randomBytes(16).toString("hex");
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}/auth`;
  t.after(async () => {
    try { await prisma.user.deleteMany({ where: { email } }); }
    finally {
      await new Promise((resolve) => server.close(resolve));
      await disconnectDatabase();
    }
  });
  const secrets = [oldPassword, newPassword];
  async function request(path, body, cookie) {
    const response = await fetch(`${base}/${path}`, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    assert.doesNotMatch(text, /passwordHash|tokenHash|"password"|"token"|stack|Prisma/);
    for (const secret of secrets) assert.ok(!text.includes(secret), "Resposta não expõe segredos.");
    return { response, data: text ? JSON.parse(text) : null };
  }
  const created = await request("register", { name: "Teste recuperação", email, password: oldPassword, confirmPassword: oldPassword });
  assert.equal(created.response.status, 201);
  const userId = created.data.user.id;
  const cookies = [];
  for (let i = 0; i < 2; i++) {
    const login = await request("login", { email, password: oldPassword });
    assert.equal(login.response.status, 200);
    cookies.push(login.response.headers.get("set-cookie").split(";")[0]);
  }
  const token = randomBytes(32).toString("hex");
  secrets.push(token);
  const before = Date.now();
  assert.equal(await repository.createPasswordReset(userId, tokenHash(token)), true);
  const reset = await prisma.passwordReset.findUniqueOrThrow({ where: { userId } });
  assert.equal(reset.expiresAt.getTime() - reset.createdAt.getTime(), 30 * 60_000);
  assert.ok(reset.createdAt.getTime() >= before);
  assert.equal(reset.tokenHash, tokenHash(token));
  assert.ok(!JSON.stringify(reset).includes(token));
  const payload = { token, password: newPassword, confirmPassword: newPassword };
  for (const length of [7, 33]) {
    const password = "x".repeat(length);
    assert.equal((await request("reset-password", { ...payload, password, confirmPassword: password })).response.status, 400);
  }
  await prisma.passwordReset.update({ where: { userId }, data: { expiresAt: new Date(Date.now() - 1) } });
  assert.equal((await request("reset-password", payload)).response.status, 400);
  for (const cookie of cookies) assert.equal((await request("session", undefined, cookie)).response.status, 200);
  await prisma.passwordReset.update({ where: { userId }, data: { expiresAt: new Date(Date.now() + 60_000) } });
  const concurrent = await Promise.all([request("reset-password", payload), request("reset-password", payload)]);
  assert.deepEqual(concurrent.map(({ response }) => response.status).sort(), [200, 400]);
  assert.ok(concurrent.find(({ response }) => response.status === 200).response.headers.get("set-cookie").includes("Expires=Thu, 01 Jan 1970"));
  assert.ok((await prisma.passwordReset.findUniqueOrThrow({ where: { userId } })).usedAt);
  assert.equal(await prisma.session.count({ where: { userId, revokedAt: null } }), 0);
  for (const cookie of cookies) assert.equal((await request("session", undefined, cookie)).response.status, 401);
  assert.equal((await request("reset-password", payload)).response.status, 400);
  assert.equal((await request("login", { email, password: oldPassword })).response.status, 401);
  const login = await request("login", { email, password: newPassword });
  assert.equal(login.response.status, 200);
  assert.equal((await request("session", undefined, login.response.headers.get("set-cookie").split(";")[0])).response.status, 200);
});
