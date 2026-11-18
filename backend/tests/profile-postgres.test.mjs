import { mockAvatarStorage } from "./helpers/avatar-storage.mjs";
import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import test from "node:test";

if (process.env.FOCUSLIST_AUTH_TESTS !== "LOCAL_CONTROLLED") throw new Error("Autorize os testes locais com FOCUSLIST_AUTH_TESTS=LOCAL_CONTROLLED.");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env.DATABASE_URL).hostname), "Somente PostgreSQL local.");

const { default: app } = await import("../dist/app.js");
const { default: prisma, disconnectDatabase } = await import("../dist/config/prisma.js");
const { cookieName, tokenHash } = await import("../dist/security/session.js");
const { verifyPassword } = await import("../dist/security/password.js");
const { default: avatarRepository } = await import("../dist/repositories/avatar.repository.js");

test("Perfil HTTP/PostgreSQL: persistência, segurança, isolamento, foto e sessões", async (t) => {
  const suffix = randomUUID();
  const emails = ["a", "b", "updated"].map((part) => `profile-${part}-${suffix}@focuslist.invalid`);
  const password = randomBytes(12).toString("hex");
  const newPassword = randomBytes(16).toString("hex");
  const ids = [];
  const photoKeys = [];
  const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    try {
      for (const key of photoKeys) await avatarRepository.remove(key);
      // Apenas fixtures cujos IDs foram capturados nesta execução.
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    } finally {
      await new Promise((resolve) => server.close(resolve));
      await disconnectDatabase();
    }
  });
  mockAvatarStorage(t);
  const secrets = [password, newPassword];
  async function request(method, path, status, body, cookie) {
    const response = await fetch(`${base}${path}`, { method, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    assert.equal(response.status, status, `${method} ${path}: ${status} esperado, recebido ${response.status}`);
    if (response.headers.get("content-type")?.startsWith("image/")) return { response, image: Buffer.from(await response.arrayBuffer()) };
    const text = await response.text();
    assert.doesNotMatch(text, /passwordHash|tokenHash|avatarKey|stack|Prisma|SELECT /);
    for (const secret of secrets) assert.ok(!text.includes(secret));
    return { response, data: text ? JSON.parse(text) : null };
  }
  async function login(email, value = password) {
    const { response } = await request("POST", "/auth/login", 200, { email, password: value });
    const cookie = response.headers.get("set-cookie").split(";")[0];
    secrets.push(cookie.split("=")[1]);
    return cookie;
  }
  const cookies = [];
  for (const email of emails.slice(0, 2)) {
    const { data } = await request("POST", "/auth/register", 201, { name: "Perfil teste", email, password, confirmPassword: password });
    ids.push(data.user.id);
    cookies.push(await login(email));
  }
  const otherSession = await login(emails[0]);
  const own = cookies[0];

  await t.test("leitura usa a conta autenticada e createdAt real", async () => {
    const { data, response } = await request("GET", `/profile?userId=${ids[1]}`, 200, undefined, own);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(data.profile.email, emails[0]);
    assert.equal(data.profile.defaultView, "list");
    assert.equal(data.profile.createdAt, (await prisma.user.findUniqueOrThrow({ where: { id: ids[0] } })).createdAt.toISOString());
    assert.ok(!("id" in data.profile));
    await request("GET", "/profile", 401);
    await request("PATCH", "/profile", 400, { name: "Invaded", userId: ids[1] }, own);
  });
  await t.test("nome/e-mail persistem e não alteram outro usuário", async () => {
    await request("PATCH", "/profile", 200, { name: "Nome atualizado" }, own);
    await request("PATCH", "/profile", 400, { email: "invalid", currentPassword: password }, own);
    await request("PATCH", "/profile", 400, { email: emails[1], currentPassword: password }, own);
    await request("PATCH", "/profile", 400, { email: emails[2], currentPassword: "wrong-pass" }, own);
    await request("PATCH", "/profile", 200, { email: ` ${emails[2].toUpperCase()} `, currentPassword: password }, own);
    const { data } = await request("GET", "/auth/session", 200, undefined, own);
    assert.equal(data.user.name, "Nome atualizado"); assert.equal(data.user.email, emails[2]);
    assert.equal((await request("GET", "/profile", 200, undefined, cookies[1])).data.profile.name, "Perfil teste");
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: ids[1] } })).email, emails[1]);
  });
  await t.test("preferências Lista/Cards persistem no banco e em novo login", async () => {
    for (const defaultView of ["cards", "list"]) {
      await request("PATCH", "/profile/preferences", 200, { defaultView }, own);
      assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: ids[0] } })).defaultView, defaultView);
      const cookie = await login(emails[2]);
      assert.equal((await request("GET", "/auth/session", 200, undefined, cookie)).data.user.defaultView, defaultView);
    }
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: ids[1] } })).defaultView, "list");
    await request("PATCH", "/profile/preferences", 400, { defaultView: "grid" }, own);
  });
  await t.test("foto fica no Storage simulado, referência no banco e acesso isolado", async () => {
    const image = await readFile(new URL("./fixtures/avatar.jpg", import.meta.url));
    await request("PUT", "/profile/avatar", 200, { image: image.toString("base64") }, own);
    const { avatarKey } = await prisma.user.findUniqueOrThrow({ where: { id: ids[0] } });
    photoKeys.push(avatarKey);
    assert.match(avatarKey, /^[a-f0-9-]{36}\.jpg$/);
    assert.deepEqual((await request("GET", `/profile/avatar?userId=${ids[1]}`, 200, undefined, own)).image, image);
    await request("GET", "/profile/avatar", 404, undefined, cookies[1]);
    await request("PUT", "/profile/avatar", 400, { image: Buffer.from("<svg/>").toString("base64") }, own);
    await request("DELETE", "/profile/avatar", 200, undefined, own);
    await assert.rejects(avatarRepository.read(avatarKey), { status: 404 });
  });
  await t.test("senha inválida é rejeitada; scrypt preserva atual e revoga todas as outras", async () => {
    const body = { currentPassword: password, newPassword, confirmPassword: newPassword };
    await request("POST", "/profile/password", 400, { ...body, currentPassword: "wrong-pass" }, own);
    for (const value of ["1234567", "x".repeat(33)]) await request("POST", "/profile/password", 400, { ...body, newPassword: value, confirmPassword: value }, own);
    await request("POST", "/profile/password", 400, { ...body, confirmPassword: "different" }, own);
    await request("POST", "/profile/password", 200, body, own);
    await request("GET", "/profile", 200, undefined, own);
    await request("GET", "/profile", 401, undefined, otherSession);
    await request("GET", "/profile", 200, undefined, cookies[1]);
    const sessions = await prisma.session.findMany({ where: { userId: ids[0] } });
    const currentHash = tokenHash(own.split("=")[1]);
    assert.ok(sessions.filter((s) => s.tokenHash !== currentHash).every((s) => s.revokedAt));
    assert.equal(sessions.find((s) => s.tokenHash === currentHash).revokedAt, null);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: ids[0] } });
    assert.match(user.passwordHash, /^scrypt\$131072\$8\$1\$/);
    assert.equal(await verifyPassword(newPassword, user.passwordHash), true);
    assert.equal(await verifyPassword(password, user.passwordHash), false);
    await login(emails[2], newPassword);
  });
  await t.test("DEMO é bloqueada em todos os endpoints exclusivos", async () => {
    const createdAt = new Date();
    const demo = await prisma.user.create({ data: { type: "DEMO", createdAt, expiresAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000) } }); ids.push(demo.id);
    const token = randomBytes(32).toString("hex"); secrets.push(token);
    await prisma.session.create({ data: { userId: demo.id, tokenHash: tokenHash(token), expiresAt: demo.expiresAt } });
    const cookie = `${cookieName}=${token}`;
    for (const [method, path, body] of [["GET", "/profile"], ["PATCH", "/profile", { name: "Demo" }], ["POST", "/profile/password", {}], ["PATCH", "/profile/preferences", { defaultView: "cards" }], ["GET", "/profile/avatar"], ["PUT", "/profile/avatar", {}], ["DELETE", "/profile/avatar"]]) await request(method, path, 403, body, cookie);
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: demo.id } })).defaultView, "list");
  });
});
