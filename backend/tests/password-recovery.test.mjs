import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import prisma from "../dist/config/prisma.js";
import authService, { recoveryMessage } from "../dist/services/auth.service.js";
import authRepository from "../dist/repositories/auth.repository.js";
import emailService from "../dist/services/email.service.js";
import { hashPassword, verifyPassword } from "../dist/security/password.js";
import { tokenHash, cookieName } from "../dist/security/session.js";
import app from "../dist/app.js";

const oldPassword = "Old-pass-123";
const oldHash = await hashPassword(oldPassword);
const neutral = { message: recoveryMessage };
const payload = (token, password = "New-pass-123") => ({ token, password, confirmPassword: password });

// Executa serviços e repositório reais; somente o transporte Prisma é substituído.
// Não abre conexão, aplica migrations ou altera dados no PostgreSQL.
function fixture(t) {
  // O proxy do Prisma não fornece descritores de método compatíveis com mock.method.
  function replace(object, key, implementation) {
    const original = object[key];
    object[key] = implementation;
    t.after(() => { object[key] = original; });
  }
  let state = {
    user: { id: 1, type: "REAL", name: "Teste", email: "test@focuslist.invalid", createdAt: new Date(), passwordHash: oldHash },
    reset: null,
    sessions: [{ userId: 1, revokedAt: null }, { userId: 1, revokedAt: null }, { userId: 2, revokedAt: null }],
  };
  const emails = [];
  const operations = [];
  const tx = {
    $queryRaw: async () => { operations.push("lock"); return [{ id: 1 }]; },
    user: {
      findUnique: async () => ({ ...state.user }),
      update: async ({ where, data }) => { assert.equal(where.id, 1); operations.push("password"); Object.assign(state.user, data); },
    },
    passwordReset: {
      findUnique: async ({ where }) => { assert.equal(where.userId, 1); return state.reset && { ...state.reset }; },
      upsert: async ({ create, update }) => { state.reset = { ...(state.reset ? update : create), userId: 1 }; },
      updateMany: async ({ where, data }) => {
        operations.push("consume");
        assert.deepEqual(where.user, { type: "REAL" });
        assert.equal(where.usedAt, null);
        assert.ok(where.expiresAt.gt instanceof Date);
        const reset = state.reset;
        if (!reset || reset.userId !== where.userId || reset.tokenHash !== where.tokenHash || reset.usedAt || reset.expiresAt <= where.expiresAt.gt || state.user.type !== "REAL") return { count: 0 };
        Object.assign(reset, data);
        return { count: 1 };
      },
    },
    session: {
      create: async ({ data }) => { operations.push("session"); state.sessions.push({ ...data, revokedAt: null }); },
      updateMany: async ({ where, data }) => {
        operations.push("revoke");
        assert.equal(where.revokedAt, null);
        let count = 0;
        for (const session of state.sessions) if (session.userId === where.userId && !session.revokedAt) { Object.assign(session, data); count++; }
        return { count };
      },
    },
  };
  // Serializa transações e simula rollback para exercitar o contrato atômico.
  let tail = Promise.resolve();
  replace(prisma, "$transaction", (callback) => {
    const result = tail.then(async () => {
      const snapshot = structuredClone(state);
      try { return await callback(tx); } catch (error) { state = snapshot; throw error; }
    });
    tail = result.catch(() => {});
    return result;
  });
  replace(prisma.user, "findUnique", async ({ where }) => where.email === state.user.email ? { ...state.user } : null);
  replace(prisma.passwordReset, "findFirst", async ({ where }) => {
    assert.deepEqual(where.user, { type: "REAL" });
    assert.equal(where.usedAt, null);
    assert.ok(where.expiresAt.gt instanceof Date);
    const reset = state.reset;
    return reset && reset.tokenHash === where.tokenHash && !reset.usedAt && reset.expiresAt > where.expiresAt.gt && state.user.type === "REAL" ? { userId: 1 } : null;
  });
  t.mock.method(emailService, "sendPasswordReset", async (email, token) => { emails.push({ email, token }); });
  return { get state() { return state; }, emails, operations, tx, async issue() {
    await authService.forgotPassword({ email: " TEST@FOCUSLIST.INVALID " });
    assert.equal(emails.length, 1);
    return emails[0].token;
  } };
}

test("solicitações existente/inexistente são neutras; token seguro, hash e 30 minutos", async (t) => {
  const f = fixture(t);
  assert.deepEqual(await authService.forgotPassword({ email: "missing@focuslist.invalid" }), neutral);
  assert.equal(f.emails.length, 0);
  const before = Date.now();
  const token = await f.issue();
  assert.match(token, /^[0-9a-f]{64}$/);
  assert.equal(f.state.reset.tokenHash, tokenHash(token));
  assert.notEqual(f.state.reset.tokenHash, token);
  assert.equal(f.state.reset.userId, 1);
  assert.equal(f.state.reset.expiresAt - f.state.reset.createdAt, 30 * 60_000);
  assert.ok(f.state.reset.createdAt >= before);
  assert.deepEqual(await authService.forgotPassword({ email: f.state.user.email }), neutral);
  assert.equal(f.emails.length, 1, "Cooldown impede envio duplicado");
  assert.equal(f.state.reset.usedAt, null);
});

test("solicitações simultâneas enviam apenas uma mensagem; novo link substitui o anterior", async (t) => {
  const f = fixture(t);
  await Promise.all([authService.forgotPassword({ email: f.state.user.email }), authService.forgotPassword({ email: f.state.user.email })]);
  assert.equal(f.emails.length, 1);
  const oldToken = f.emails[0].token;
  f.state.reset.createdAt = new Date(Date.now() - 61_000);
  await authService.forgotPassword({ email: f.state.user.email });
  assert.equal(f.emails.length, 2);
  assert.notEqual(f.emails[1].token, oldToken);
  await assert.rejects(authService.resetPassword(payload(oldToken)), { status: 400 });
});

test("token válido troca senha com scrypt, consome token e revoga todas as sessões do usuário", async (t) => {
  const f = fixture(t);
  const token = await f.issue();
  const before = f.operations.length;
  const result = await authService.resetPassword(payload(token));
  assert.match(result.message, /Senha redefinida com sucesso/);
  assert.deepEqual(f.operations.slice(before), ["lock", "consume", "password", "revoke"]);
  assert.ok(f.state.reset.usedAt instanceof Date);
  assert.ok(f.state.sessions.filter((s) => s.userId === 1).every((s) => s.revokedAt));
  assert.equal(f.state.sessions.find((s) => s.userId === 2).revokedAt, null);
  assert.match(f.state.user.passwordHash, /^scrypt\$131072\$8\$1\$/);
  assert.equal(await verifyPassword("New-pass-123", f.state.user.passwordHash), true);
  await assert.rejects(authService.login({ email: f.state.user.email, password: oldPassword }), { status: 401 });
  const login = await authService.login({ email: f.state.user.email, password: "New-pass-123" });
  assert.equal(login.user.id, 1);
  assert.equal(f.state.sessions.at(-1).revokedAt, null);
  assert.ok(!JSON.stringify(result).includes(token));
  assert.ok(!("passwordHash" in login.user));
  await assert.rejects(authService.resetPassword(payload(token)), { status: 400 });
});

test("token inválido, expirado, no limite exato ou utilizado é rejeitado sem trocar senha/sessões", async (t) => {
  const f = fixture(t);
  const token = await f.issue();
  for (const invalid of [undefined, "", "invalid", "a".repeat(64)]) await assert.rejects(authService.resetPassword(payload(invalid)), { status: 400 });
  f.state.reset.expiresAt = new Date(Date.now() - 1);
  await assert.rejects(authService.resetPassword(payload(token)), { status: 400 });
  f.state.reset.expiresAt = new Date();
  await assert.rejects(authService.resetPassword(payload(token)), { status: 400 });
  f.state.reset.expiresAt = new Date(Date.now() + 60_000);
  f.state.reset.usedAt = new Date();
  await assert.rejects(authService.resetPassword(payload(token)), { status: 400 });
  assert.equal(f.state.user.passwordHash, oldHash);
  assert.ok(f.state.sessions.every((s) => !s.revokedAt));
});

test("senhas 7/33 e confirmação diferente são rejeitadas; 8/32 são aceitas", async (t) => {
  const f = fixture(t);
  const token = await f.issue();
  for (const password of ["a".repeat(7), "a".repeat(33), "🔒".repeat(33)]) await assert.rejects(authService.resetPassword(payload(token, password)), { status: 400 });
  await assert.rejects(authService.resetPassword({ ...payload(token), confirmPassword: "different" }), { status: 400 });
  assert.equal(f.state.reset.usedAt, null);
  for (const password of ["a".repeat(8), "a".repeat(32), "🔒".repeat(8), "🔒".repeat(32)]) {
    f.state.reset.usedAt = null;
    await authService.resetPassword(payload(token, password));
    assert.equal(await verifyPassword(password, f.state.user.passwordHash), true);
  }
});

test("redefinições simultâneas: somente uma vence", async (t) => {
  const f = fixture(t);
  const token = await f.issue();
  const results = await Promise.allSettled([authService.resetPassword(payload(token)), authService.resetPassword(payload(token, "Other-pass-123"))]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(results.find((r) => r.status === "rejected").reason.status, 400);
});

test("transação rejeita token expirado ou substituído depois da consulta inicial", async (t) => {
  const f = fixture(t);
  const token = await f.issue();
  assert.deepEqual(await authRepository.findPasswordReset(tokenHash(token)), { userId: 1 });
  f.state.reset.expiresAt = new Date(Date.now() - 1);
  assert.equal(await authRepository.resetPassword(1, tokenHash(token), "unused-hash"), false);
  f.state.reset.expiresAt = new Date(Date.now() + 60_000);
  f.state.reset.tokenHash = tokenHash("replacement");
  assert.equal(await authRepository.resetPassword(1, tokenHash(token), "unused-hash"), false);
  assert.equal(f.state.reset.usedAt, null);
  assert.equal(f.state.user.passwordHash, oldHash);
  assert.ok(f.state.sessions.every((s) => !s.revokedAt));
});

test("falha na revogação faz rollback; corrida de login com senha antiga é rejeitada", async (t) => {
  const f = fixture(t);
  const token = await f.issue();
  const revoke = f.tx.session.updateMany;
  f.tx.session.updateMany = async () => { throw new Error("simulated failure"); };
  await assert.rejects(authService.resetPassword(payload(token)));
  assert.equal(f.state.reset.usedAt, null);
  assert.equal(f.state.user.passwordHash, oldHash);
  f.tx.session.updateMany = revoke;
  await authService.resetPassword(payload(token));
  await assert.rejects(authRepository.createSession(1, tokenHash("old-login"), new Date(Date.now() + 1000), undefined, oldHash), { status: 401 });
  assert.ok(f.state.sessions.filter((s) => s.userId === 1).every((s) => s.revokedAt));
});

test("falha do e-mail mantém resposta neutra e log sem segredos; DEMO não recebe recuperação", async (t) => {
  const f = fixture(t);
  const logs = [];
  t.mock.method(console, "error", (...args) => logs.push(args));
  t.mock.method(emailService, "sendPasswordReset", async () => { throw new Error("sensitive provider body"); });
  assert.deepEqual(await authService.forgotPassword({ email: f.state.user.email }), neutral);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(logs, [["Não foi possível enviar e-mail de recuperação de senha."]]);
  f.state.user.type = "DEMO";
  assert.deepEqual(await authService.forgotPassword({ email: f.state.user.email }), neutral);
});

test("HTTP: neutralidade, no-store, erros, cookie limpo e rate limit", async (t) => {
  const f = fixture(t);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body) => fetch(`${base}/auth/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const missing = await post("forgot-password", { email: "missing@focuslist.invalid" });
  const existing = await post("forgot-password", { email: f.state.user.email });
  assert.equal(missing.status, 202);
  assert.equal(existing.status, 202);
  assert.deepEqual(await missing.json(), await existing.json());
  assert.equal(existing.headers.get("cache-control"), "no-store");
  const bad = await post("reset-password", payload("bad"));
  assert.equal(bad.status, 400);
  const reset = await post("reset-password", payload(f.emails[0].token));
  assert.equal(reset.status, 200);
  assert.match(reset.headers.get("set-cookie"), new RegExp(`${cookieName}=;`));
  assert.match(reset.headers.get("set-cookie"), /Expires=Thu, 01 Jan 1970/);
  for (const body of [{ email: "invalid" }, { email: f.state.user.email, userId: 1 }]) {
    assert.equal((await post("forgot-password", body)).status, 400);
  }
  let limited = false;
  for (let i = 0; i < 31; i++) {
    const response = await post("forgot-password", { email: f.state.user.email });
    await response.json();
    if (response.status === 429) { limited = true; assert.ok(response.headers.get("retry-after")); break; }
  }
  assert.ok(limited);
});
