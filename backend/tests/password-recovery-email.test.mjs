import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import emailService from "../dist/services/email.service.js";

test("transporte Resend usa ambiente, link com fragmento, timeout e idempotência", async (t) => {
  const original = { ...process.env };
  t.after(() => { process.env = original; });
  process.env.RESEND_API_KEY = "test-key-not-real";
  process.env.RESEND_FROM_EMAIL = "FocusList <access@focuslist.invalid>";
  process.env.FRONTEND_ORIGIN = "https://focuslist.invalid";
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => { calls.push({ url, options }); return new Response('{}', { status: 200 }); });
  const token = "a".repeat(64);
  await emailService.sendPasswordReset("test@focuslist.invalid", token);
  const { url, options } = calls[0];
  assert.equal(url, "https://api.resend.com/emails");
  assert.equal(options.headers.Authorization, "Bearer test-key-not-real");
  assert.match(options.headers["Idempotency-Key"], /^password-reset\//);
  assert.ok(options.signal instanceof AbortSignal);
  const body = JSON.parse(options.body);
  assert.equal(body.from, process.env.RESEND_FROM_EMAIL);
  assert.deepEqual(body.to, ["test@focuslist.invalid"]);
  assert.ok(body.text.includes(`https://focuslist.invalid/redefinir-senha#token=${token}`));
  assert.match(body.text, /30 minutos/);
  assert.equal(body.subject, "Redefina sua senha do FocusList");
  assert.ok(body.html.includes(`href="https://focuslist.invalid/redefinir-senha#token=${token}"`));
  for (const text of ["Redefina sua senha.", "Você solicitou uma nova senha para acessar seu espaço no FocusList.", "Redefinir minha senha", "Este link é válido por 30 minutos e pode ser utilizado apenas uma vez.", "Não foi você?", "Pode ignorar esta mensagem. Nenhuma alteração será feita na sua conta.", "FocusList · Organize. Acompanhe. Conclua."]) {
    assert.ok(body.html.includes(text));
    assert.ok(body.text.includes(text));
  }
  assert.match(body.html, /src="cid:focuslist-mark"/);
  assert.equal(body.attachments[0].content_id, "focuslist-mark");
  assert.deepEqual(Buffer.from(body.attachments[0].content, "base64"), await readFile(new URL("../assets/focuslist-mark-email.png", import.meta.url)));
  assert.ok(!body.html.includes("Redefinir minha senha →"));
  assert.ok(!body.text.includes("Redefinir minha senha →"));
  assert.ok(!body.text.includes(process.env.RESEND_API_KEY));
  assert.ok(!body.html.includes(process.env.RESEND_API_KEY));

  t.mock.method(globalThis, "fetch", async () => new Response("sensitive provider response", { status: 403 }));
  await assert.rejects(emailService.sendPasswordReset("test@focuslist.invalid", token), { message: "Falha no envio de recuperação." });
  delete process.env.RESEND_API_KEY;
  await assert.rejects(emailService.sendPasswordReset("test@focuslist.invalid", token), { message: "Envio de recuperação não configurado." });
});

test("Resend rejeita origem insegura em produção e limita envios simultâneos", async (t) => {
  const original = { ...process.env };
  t.after(() => { process.env = original; });
  process.env.RESEND_API_KEY = "test-key-not-real";
  process.env.RESEND_FROM_EMAIL = "access@focuslist.invalid";
  process.env.FRONTEND_ORIGIN = "http://focuslist.invalid";
  process.env.NODE_ENV = "production";
  await assert.rejects(emailService.sendPasswordReset("test@focuslist.invalid", "a".repeat(64)), { message: "Origem de recuperação inválida." });
  process.env.FRONTEND_ORIGIN = "https://focuslist.invalid";
  const pending = [];
  t.mock.method(globalThis, "fetch", () => new Promise((resolve) => pending.push(resolve)));
  const sends = Array.from({ length: 5 }, () => emailService.sendPasswordReset("test@focuslist.invalid", "a".repeat(64)));
  await assert.rejects(emailService.sendPasswordReset("test@focuslist.invalid", "b".repeat(64)), { message: "Envio de recuperação ocupado." });
  while (pending.length < 5) await new Promise((resolve) => setTimeout(resolve, 1));
  for (const resolve of pending) resolve(new Response('{}'));
  await Promise.all(sends);
});

test("origem local padrão funciona sem alterar .env; produção exige configuração", async (t) => {
  const original = { ...process.env };
  t.after(() => { process.env = original; });
  process.env.RESEND_API_KEY = "test-key-not-real";
  process.env.RESEND_FROM_EMAIL = "onboarding@resend.dev";
  delete process.env.FRONTEND_ORIGIN;
  process.env.NODE_ENV = "development";
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.ok(body.html.includes('href="http://localhost:5173/redefinir-senha#token='));
    return new Response('{}');
  });
  await emailService.sendPasswordReset("test@focuslist.invalid", "a".repeat(64));
  process.env.NODE_ENV = "production";
  await assert.rejects(emailService.sendPasswordReset("test@focuslist.invalid", "a".repeat(64)), { message: "Envio de recuperação não configurado." });
});
