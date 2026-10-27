import assert from "node:assert/strict";
import test from "node:test";
import authService from "../dist/services/auth.service.js";
import authRepository from "../dist/repositories/auth.repository.js";
import { verifyPassword } from "../dist/security/password.js";

// Substitui a persistência para testar a regra real sem conectar ao banco.
test("cadastro aceita 8–32 caracteres e preserva confirmação e hash", async (t) => {
  const created = [];
  t.mock.method(authRepository, "createUser", async (data) => {
    created.push(data);
    return { id: created.length, name: data.name, email: data.email };
  });
  const payload = (password) => ({ name: "Teste", email: "test@focuslist.invalid", password, confirmPassword: password });

  for (const password of ["12345678", "a".repeat(32), "🔒".repeat(8), "🔒".repeat(32)]) {
    const before = created.length;
    await authService.register(payload(password));
    assert.equal(created.length, before + 1);
    assert.equal(await verifyPassword(password, created.at(-1).passwordHash), true);
  }
  const accepted = created.length;
  for (const password of ["", "1234567", "a".repeat(33), "🔒".repeat(33)]) {
    await assert.rejects(authService.register(payload(password)), { status: 400 });
  }
  await assert.rejects(authService.register({ ...payload("12345678"), confirmPassword: "87654321" }), { status: 400 });
  assert.equal(created.length, accepted, "Entradas inválidas não chegam à persistência");
});

test("login rejeita senhas fora de 8–32 antes de consultar a conta", async (t) => {
  t.mock.method(authRepository, "findAccount", () => assert.fail("Senha inválida chegou ao repositório"));
  for (const password of ["", "1234567", "a".repeat(33), "🔒".repeat(33)]) {
    await assert.rejects(authService.login({ email: "test@focuslist.invalid", password }), { status: 400 });
  }
});
