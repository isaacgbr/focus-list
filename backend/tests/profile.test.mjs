import { mockAvatarStorage } from "./helpers/avatar-storage.mjs";
import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Prisma } from "@prisma/client";
import prisma from "../dist/config/prisma.js";
import app from "../dist/app.js";
import profileService from "../dist/services/profile.service.js";
import profileRepository from "../dist/repositories/profile.repository.js";
import avatarRepository from "../dist/repositories/avatar.repository.js";
import authRepository from "../dist/repositories/auth.repository.js";
import authService from "../dist/services/auth.service.js";
import { hashPassword, verifyPassword } from "../dist/security/password.js";
import { avatarImage } from "../dist/security/avatar.js";
import { cookieName, tokenHash } from "../dist/security/session.js";

const oldPassword = "Old-pass-123";
const oldHash = await hashPassword(oldPassword);
const photo = await readFile(new URL("./fixtures/avatar.jpg", import.meta.url));
const passwordBody = (password = "New-pass-123") => ({ currentPassword: oldPassword, newPassword: password, confirmPassword: password });

// Serviço/repositório/HTTP reais; substitui apenas o transporte Prisma.
// Não conecta ao PostgreSQL nem aplica migrations. Arquivos de foto são exclusivos do teste.
function fixture(t) {
  const storage = mockAvatarStorage(t);
  function replace(object, key, implementation) {
    const original = object[key]; object[key] = implementation;
    t.after(() => { object[key] = original; });
  }
  const now = new Date();
  let state = {
    users: [1, 2, 3].map((id) => ({ id, type: id === 3 ? "DEMO" : "REAL", name: `Pessoa ${id}`, email: id === 3 ? null : `person${id}@focuslist.invalid`, passwordHash: id === 3 ? null : oldHash, createdAt: now, expiresAt: id === 3 ? new Date(Date.now() + 60000) : null, avatarKey: null, defaultView: "list" })),
    sessions: [1, 1, 2, 3].map((userId, i) => ({ id: i + 11, userId, tokenHash: tokenHash(String(i + 1).repeat(64)), revokedAt: null, expiresAt: new Date(Date.now() + 60000) })),
    reset: { userId: 1, usedAt: null, tokenHash: tokenHash("a".repeat(64)), expiresAt: new Date(Date.now() + 60000) },
  };
  const operations = [];
  function select(value, fields) {
    if (!value) return null;
    return fields ? Object.fromEntries(Object.entries(fields).filter(([, enabled]) => enabled === true).map(([key]) => [key, value[key]])) : { ...value };
  }
  function account(where) { return state.users.find((user) => (where.id === undefined || user.id === where.id) && (where.email === undefined || user.email === where.email) && (where.type === undefined || user.type === where.type)); }
  async function findUser({ where, select: fields }) { return select(account(where), fields); }
  async function findSession({ where, select: fields }) {
    const session = state.sessions.find((s) => (where.id === undefined || s.id === where.id) && (where.userId === undefined || s.userId === where.userId) && (where.tokenHash === undefined || s.tokenHash === where.tokenHash) && s.revokedAt === null && s.expiresAt > where.expiresAt.gt);
    if (!session) return null;
    const result = select(session, fields);
    if (fields?.user) result.user = { type: account({ id: session.userId }).type };
    return result;
  }
  const tx = {
    $queryRaw: async (_query, id) => { operations.push(["lock", id]); return [{ id }]; },
    user: {
      findUnique: findUser,
      update: async ({ where, data, select: fields }) => {
        const user = account(where);
        if (data.email && state.users.some((u) => u.id !== user.id && u.email === data.email)) throw new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "test" });
        Object.assign(user, data);
        operations.push(["update", user.id]);
        return select(user, fields);
      },
    },
    session: {
      findFirst: findSession,
      create: async ({ data }) => state.sessions.push({ ...data, id: 99, revokedAt: null }),
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const s of state.sessions) if (s.userId === where.userId && s.revokedAt === null && (where.id?.not === undefined || s.id !== where.id.not)) { Object.assign(s, data); count++; }
        return { count };
      },
    },
    passwordReset: { updateMany: async ({ where, data }) => { assert.equal(where.userId, 1); Object.assign(state.reset, data); return { count: 1 }; } },
  };
  let tail = Promise.resolve();
  replace(prisma, "$transaction", (callback) => {
    const result = tail.then(async () => {
      const snapshot = structuredClone(state);
      try { return await callback(tx); } catch (error) { state = snapshot; throw error; }
    });
    tail = result.catch(() => {}); return result;
  });
  replace(prisma.user, "findFirst", findUser);
  replace(prisma.user, "findUnique", findUser);
  replace(prisma.user, "findFirstOrThrow", async (query) => { const user = await findUser(query); assert.ok(user); return user; });
  replace(prisma.user, "findUniqueOrThrow", async (query) => { const user = await findUser(query); assert.ok(user); return user; });
  replace(prisma.session, "findFirst", findSession);
  replace(prisma.demoTransfer, "findUnique", async () => null);
  replace(prisma.passwordReset, "findFirst", async ({ where }) => {
    const reset = state.reset;
    return reset.userId === 1 && reset.tokenHash === where.tokenHash && reset.usedAt === null && reset.expiresAt > where.expiresAt.gt
      ? { userId: reset.userId } : null;
  });
  return { get state() { return state; }, tx, operations, storage };
}

test("leitura do próprio perfil não expõe ID, referência interna, hash ou credenciais", async (t) => {
  const f = fixture(t);
  const profile = await profileService.get(1);
  assert.deepEqual(profile, { name: "Pessoa 1", email: "person1@focuslist.invalid", createdAt: f.state.users[0].createdAt, defaultView: "list", avatarUrl: null });
  assert.doesNotMatch(JSON.stringify(profile), /passwordHash|avatarKey|tokenHash|"id"/);
  assert.equal((await profileService.get(2)).email, "person2@focuslist.invalid");
});

test("nome é validado, normalizado e isolado; campos de propriedade são rejeitados", async (t) => {
  const f = fixture(t);
  assert.equal((await profileService.update(1, 11, { name: " Novo nome " })).name, "Novo nome");
  assert.equal(f.state.users[1].name, "Pessoa 2");
  for (const name of ["", " ", 12, null, "x".repeat(101), "bad\nname"]) await assert.rejects(profileService.update(1, 11, { name }), { status: 400 });
  for (const body of [{ userId: 2, name: "Invadido" }, { type: "REAL" }, { passwordHash: "fake" }, {}, []]) await assert.rejects(profileService.update(1, 11, body), { status: 400 });
});

test("e-mail exige senha atual, valida formato, normaliza e rejeita duplicidade", async (t) => {
  const f = fixture(t);
  for (const email of ["invalid", "", null, "x@invalid", 42]) await assert.rejects(profileService.update(1, 11, { email, currentPassword: oldPassword }), { status: 400 });
  await assert.rejects(profileService.update(1, 11, { email: "new@focuslist.invalid", currentPassword: "wrong-pass" }), { status: 400, message: "Senha atual incorreta." });
  await assert.rejects(profileService.update(1, 11, { email: "new@focuslist.invalid" }), { status: 400 });
  await assert.rejects(profileService.update(1, 11, { email: "PERSON2@focuslist.invalid", currentPassword: oldPassword }), { status: 400 });
  assert.equal(f.state.users[0].email, "person1@focuslist.invalid");
  const result = await profileService.update(1, 11, { email: " NEW@FOCUSLIST.INVALID ", currentPassword: oldPassword });
  assert.equal(result.email, "new@focuslist.invalid");
  assert.equal((await authService.session(1, 11)).email, result.email);
  assert.equal(f.state.users[1].email, "person2@focuslist.invalid");
});

test("troca de e-mail invalida recuperação anterior sem encerrar sessões", async (t) => {
  const f = fixture(t);
  const hash = f.state.reset.tokenHash;
  const sessions = structuredClone(f.state.sessions);
  assert.deepEqual(await authRepository.findPasswordReset(hash), { userId: 1 });
  await profileService.update(1, 11, { email: "person1@focuslist.invalid", currentPassword: oldPassword });
  assert.equal(f.state.reset.usedAt, null, "Mesmo e-mail não invalida o token.");
  await profileService.update(1, 11, { name: "Novo nome" });
  assert.equal(f.state.reset.usedAt, null, "Editar nome não invalida o token.");
  await profileService.update(1, 11, { email: "new@focuslist.invalid", currentPassword: oldPassword });
  assert.ok(f.state.reset.usedAt instanceof Date);
  assert.equal(await authRepository.findPasswordReset(hash), null);
  await assert.rejects(authService.resetPassword({ token: "a".repeat(64), password: "New-pass-123", confirmPassword: "New-pass-123" }), { status: 400 });
  assert.equal(f.state.users[0].passwordHash, oldHash);
  assert.deepEqual(f.state.sessions, sessions);
  assert.equal(f.state.users[1].email, "person2@focuslist.invalid");
});

test("falha ao invalidar recuperação desfaz também a troca de e-mail", async (t) => {
  const f = fixture(t);
  f.tx.passwordReset.updateMany = async () => { throw new Error("simulated failure"); };
  await assert.rejects(profileService.update(1, 11, { email: "new@focuslist.invalid", currentPassword: oldPassword }));
  assert.equal(f.state.users[0].email, "person1@focuslist.invalid");
  assert.equal(f.state.reset.usedAt, null);
  assert.ok(f.state.sessions.every((session) => session.revokedAt === null));
});

test("senha incorreta e nova senha inválida não alteram senha ou sessões", async (t) => {
  const f = fixture(t);
  await assert.rejects(profileService.changePassword(1, 11, { ...passwordBody(), currentPassword: "wrong-pass" }), { status: 400, message: "Senha atual incorreta." });
  for (const password of ["", "1234567", "x".repeat(33), "🔒".repeat(33)]) await assert.rejects(profileService.changePassword(1, 11, passwordBody(password)), { status: 400 });
  await assert.rejects(profileService.changePassword(1, 11, { ...passwordBody(), confirmPassword: "other-pass" }), { status: 400 });
  assert.equal(f.state.users[0].passwordHash, oldHash);
  assert.ok(f.state.sessions.every((s) => s.revokedAt === null));
});

test("troca com scrypt revoga somente outras sessões, preserva atual e invalida reset pendente", async (t) => {
  const f = fixture(t);
  const result = await profileService.changePassword(1, 11, passwordBody());
  assert.equal(await verifyPassword("New-pass-123", f.state.users[0].passwordHash), true);
  assert.equal(await verifyPassword(oldPassword, f.state.users[0].passwordHash), false);
  assert.match(f.state.users[0].passwordHash, /^scrypt\$131072\$8\$1\$/);
  assert.equal(f.state.sessions.find((s) => s.id === 11).revokedAt, null);
  assert.ok(f.state.sessions.find((s) => s.id === 12).revokedAt instanceof Date);
  assert.equal(f.state.sessions.find((s) => s.id === 13).revokedAt, null);
  assert.ok(f.state.reset.usedAt instanceof Date);
  assert.ok(await authRepository.findValidSession(f.state.sessions[0].tokenHash));
  assert.equal(await authRepository.findValidSession(f.state.sessions[1].tokenHash), null);
  assert.doesNotMatch(JSON.stringify(result), /passwordHash|tokenHash/);
  await assert.rejects(authRepository.createSession(1, "unused", new Date(Date.now() + 1000), undefined, oldHash), { status: 401 });
});

test("limites de senha 8/32 e Unicode são aceitos pelo fluxo de alteração", async (t) => {
  const f = fixture(t);
  let currentPassword = oldPassword;
  for (const password of ["12345678", "x".repeat(32), "🔒".repeat(32)]) {
    await profileService.changePassword(1, 11, { ...passwordBody(password), currentPassword });
    assert.equal(await verifyPassword(password, f.state.users[0].passwordHash), true);
    currentPassword = password;
  }
});

test("falha ao revogar causa rollback; concorrência rejeita senha verificada antes da troca", async (t) => {
  const f = fixture(t);
  const update = f.tx.session.updateMany;
  f.tx.session.updateMany = async () => { throw new Error("simulated failure"); };
  await assert.rejects(profileService.changePassword(1, 11, passwordBody()));
  assert.equal(f.state.users[0].passwordHash, oldHash);
  assert.ok(f.state.sessions.every((s) => !s.revokedAt));
  f.tx.session.updateMany = update;
  await profileService.changePassword(1, 11, passwordBody());
  await assert.rejects(profileRepository.update(1, 11, { email: "race@focuslist.invalid" }, oldHash), { status: 409 });
  await assert.rejects(profileRepository.changePassword(1, 11, oldHash, "unused"), { status: 409 });
  await assert.rejects(profileRepository.update(1, 12, { name: "stale session" }), { status: 401 });
  await assert.rejects(profileRepository.update(3, 14, { name: "Demo" }), { status: 403 });
});

test("preferências Lista/Cards persistem nas leituras, sessão e novo login sem atingir outro usuário", async (t) => {
  const f = fixture(t);
  for (const defaultView of ["cards", "list"]) {
    assert.equal((await profileService.preferences(1, 11, { defaultView })).defaultView, defaultView);
    assert.equal((await profileService.get(1)).defaultView, defaultView);
    assert.equal((await authService.session(1, 11)).defaultView, defaultView);
    assert.equal((await authService.login({ email: "person1@focuslist.invalid", password: oldPassword })).user.defaultView, defaultView);
  }
  assert.equal(f.state.users[1].defaultView, "list");
  for (const defaultView of ["grid", "CARDS", null, 1]) await assert.rejects(profileService.preferences(1, 11, { defaultView }), { status: 400 });
  await assert.rejects(profileService.preferences(1, 11, { defaultView: "cards", userId: 2 }), { status: 400 });
});

test("avatar persiste no Storage, é substituído/removido, sem imagem no banco ou acesso a caminhos", async (t) => {
  const f = fixture(t);
  const result = await profileService.setAvatar(1, 11, { image: photo.toString("base64") });
  assert.match(result.avatarUrl, /^\/profile\/avatar\?v=[a-f0-9-]+\.jpg$/);
  assert.ok(!JSON.stringify(f.state.users[0]).includes(photo.toString("base64")));
  assert.deepEqual(await profileService.avatar(1), photo);
  const oldKey = f.state.users[0].avatarKey;
  await profileService.setAvatar(1, 11, { image: photo.toString("base64") });
  assert.notEqual(f.state.users[0].avatarKey, oldKey);
  await assert.rejects(avatarRepository.read(oldKey), { status: 404 });
  await assert.rejects(profileService.avatar(2), { status: 404 });
  assert.equal((await profileService.removeAvatar(1, 11)).avatarUrl, null);
  await assert.rejects(profileService.avatar(1), { status: 404 });
  await assert.rejects(avatarRepository.read("../outside.jpg"), { status: 404 });
});

test("avatar inválido é rejeitado e arquivo novo é removido se a transação falhar", async (t) => {
  fixture(t);
  for (const image of ["", "not an image", Buffer.from('<svg onload="alert(1)"/>').toString("base64"), photo.subarray(0, 50).toString("base64"), Buffer.alloc(131073).toString("base64")]) assert.throws(() => avatarImage(image), { status: 400 });
  const wrongSize = Buffer.from(photo);
  const start = wrongSize.indexOf(Buffer.from([0xff, 0xc0]));
  assert.ok(start > 0); wrongSize.writeUInt16BE(512, start + 5);
  assert.throws(() => avatarImage(wrongSize.toString("base64")), { status: 400 });
  let saved;
  const save = avatarRepository.save.bind(avatarRepository);
  t.mock.method(avatarRepository, "save", async (image) => { saved = await save(image); return saved; });
  t.mock.method(profileRepository, "update", async () => { throw new Error("database failure"); });
  await assert.rejects(profileService.setAvatar(1, 11, { image: photo.toString("base64") }));
  await assert.rejects(avatarRepository.read(saved), { status: 404 });
});

test("HTTP: autenticação, isolamento, DEMO bloqueada, origem, no-store e tipo da foto", async (t) => {
  fixture(t);
  const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(method, path, status, body, session = 1, headers = {}) {
    const response = await fetch(`${base}${path}`, { method, headers: { "Content-Type": "application/json", ...(session ? { Cookie: `${cookieName}=${String(session).repeat(64)}` } : {}), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    assert.equal(response.status, status, `${method} ${path}: ${status} esperado, recebido ${response.status}`);
    return response;
  }
  const routes = [["GET", "/profile"], ["PATCH", "/profile", { name: "Updated" }], ["POST", "/profile/password", passwordBody()], ["PATCH", "/profile/preferences", { defaultView: "cards" }], ["GET", "/profile/avatar"], ["PUT", "/profile/avatar", { image: photo.toString("base64") }], ["DELETE", "/profile/avatar"]];
  for (const [method, path, body] of routes) {
    await request(method, path, 401, body, null);
    await request(method, path, 403, body, 4);
  }
  const response = await request("GET", "/profile?userId=2", 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal((await response.json()).profile.name, "Pessoa 1");
  await request("PATCH", "/profile", 400, { name: "Invaded", userId: 2 });
  await request("PATCH", "/profile", 403, { name: "CSRF" }, 1, { Origin: "https://external.invalid" });
  const own = await request("PATCH", "/profile", 200, { name: "Updated" });
  assert.equal((await own.json()).profile.name, "Updated");
  const other = await request("GET", "/profile", 200, undefined, 3);
  assert.equal((await other.json()).profile.name, "Pessoa 2");
  await request("PUT", "/profile/avatar", 200, { image: photo.toString("base64") });
  const avatar = await request("GET", "/profile/avatar?userId=2", 200);
  assert.equal(avatar.headers.get("content-type"), "image/jpeg");
  assert.equal(avatar.headers.get("x-content-type-options"), "nosniff");
  await request("GET", "/profile/avatar", 404, undefined, 3);
  await request("PUT", "/profile/avatar", 400, { image: "invalid" });
  await request("PUT", "/profile/avatar", 413, { image: "a".repeat(190000) });
  await request("POST", "/profile/password", 200, passwordBody());
  await request("GET", "/profile", 200);
  await request("GET", "/profile", 401, undefined, 2);
});

test("Storage: falha na exclusão antiga não desfaz perfil atualizado ou remoção", async (t) => {
  const f=fixture(t), logs=[]; t.mock.method(console,"error",(...args)=>logs.push(args));
  await profileService.setAvatar(1,11,{image:photo.toString("base64")});
  const old=f.state.users[0].avatarKey;
  f.storage.failure={method:"DELETE",status:500};
  await profileService.setAvatar(1,11,{image:photo.toString("base64")});
  assert.notEqual(f.state.users[0].avatarKey,old);
  assert.ok(f.storage.objects.has(old));
  assert.equal((await profileService.removeAvatar(1,11)).avatarUrl,null);
  assert.equal(f.state.users[0].avatarKey,null);
  assert.equal(logs.length,2); assert.ok(!JSON.stringify(logs).includes("provider-secret"));
});
test("Storage: upload rejeitado não altera o banco e erros são sanitizados", async (t) => {
  const f=fixture(t); f.storage.failure={method:"POST",status:403};
  await assert.rejects(profileService.setAvatar(1,11,{image:photo.toString("base64")}),error=>error.status===503&&!String(error).includes("provider-secret"));
  assert.equal(f.state.users[0].avatarKey,null);assert.equal(f.storage.objects.size,0);
  f.storage.failure=null;const key=await avatarRepository.save(photo);
  f.storage.failure={method:"GET",status:500};
  await assert.rejects(avatarRepository.read(key),{status:503});
  await assert.rejects(avatarRepository.remove("../outside.jpg"),{status:404});
});
test("Storage: configuração ausente falha antes de enviar credenciais", async (t) => {
  const f=fixture(t);
  for(const name of ["SUPABASE_URL","SUPABASE_SECRET_KEY","SUPABASE_STORAGE_BUCKET"]){
    const value=process.env[name];delete process.env[name];
    await assert.rejects(avatarRepository.save(photo),{status:503});process.env[name]=value;
  }
  assert.equal(f.storage.calls.length,0);
});
