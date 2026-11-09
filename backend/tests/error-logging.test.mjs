import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@prisma/client";
import { errorMiddleware } from "../dist/middlewares/error.middleware.js";
import { HttpError } from "../dist/utils/http-error.js";

function response() {
  return { headersSent: false, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}

test("500 registra somente método, rota declarada, categoria e código Prisma seguro", (t) => {
  const logs = [];
  t.mock.method(console, "error", (...args) => logs.push(args));
  const secret = "sensitive-value-must-not-be-logged";
  const req = { method: "POST", route: { path: "/auth/reset-password" }, originalUrl: `/auth/reset-password?token=${secret}`, headers: { cookie: secret, authorization: secret }, body: { password: secret, token: secret, apiKey: secret } };
  const error = new Prisma.PrismaClientKnownRequestError(secret, { code: "P2002", clientVersion: secret, meta: { target: secret } });
  const res = response();
  errorMiddleware(error, req, res, () => assert.fail("500 deve ser tratado."));
  assert.equal(res.code, 500);
  assert.deepEqual(res.body, { message: "Erro interno do servidor." });
  assert.deepEqual(logs, [["Erro interno do servidor.", { method: "POST", route: "/auth/reset-password", category: "PrismaClientKnownRequestError", code: "P2002" }]]);
  assert.ok(!JSON.stringify(logs).includes(secret));
  logs.length = 0;
  const unexpected = new Error(secret);
  unexpected.name = secret;
  errorMiddleware(unexpected, { ...req, method: secret, route: undefined }, response(), () => {});
  assert.deepEqual(logs[0][1], { method: "OTHER", route: "unmatched", category: "UnexpectedError" });
  assert.ok(!JSON.stringify(logs).includes(secret));
});

test("erros esperados não geram log e preservam respostas públicas", (t) => {
  const logs = [];
  t.mock.method(console, "error", (...args) => logs.push(args));
  for (const [error, status] of [
    [new HttpError(400, "Entrada inválida."), 400],
    [new HttpError(503, "Autenticação ocupada. Tente novamente."), 503],
    [new Prisma.PrismaClientKnownRequestError("internal", { code: "P2025", clientVersion: "test" }), 404],
    [{ type: "entity.parse.failed" }, 400],
    [{ type: "entity.too.large" }, 413],
  ]) {
    const res = response();
    errorMiddleware(error, {}, res, () => assert.fail());
    assert.equal(res.code, status);
  }
  const res = response(); res.headersSent = true;
  const error = new Error("already sent");
  let forwarded;
  errorMiddleware(error, {}, res, (cause) => { forwarded = cause; });
  assert.equal(forwarded, error);
  assert.deepEqual(logs, []);
});
