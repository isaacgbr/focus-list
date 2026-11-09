import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

// Executa as funções usadas pelos formulários, sem navegador ou novas dependências.
const source = await readFile(new URL('../src/utils/profile.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { defaultView, passwordChangeError, submitPasswordChange, cropRectangle, profileEditState } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

test('edição só permite salvar mudanças válidas e distingue troca de e-mail', () => {
  const saved = { name: 'Isaac Gabriel', email: 'isaac@example.com' }
  assert.deepEqual(profileEditState(saved, ' Isaac Gabriel ', 'ISAAC@example.com'), { valid: true, changed: false, emailChanged: false })
  assert.deepEqual(profileEditState(saved, 'Novo nome', saved.email), { valid: true, changed: true, emailChanged: false })
  assert.deepEqual(profileEditState(saved, saved.name, 'outro@example.com'), { valid: true, changed: true, emailChanged: true })
  for (const name of ['', '   ', 'a'.repeat(101), 'Nome\u0000inválido']) {
    assert.equal(profileEditState(saved, name, saved.email).valid, false)
  }
  for (const email of ['', 'inválido', 'a@', 'a@localhost', `${'a'.repeat(250)}@example.com`]) {
    assert.equal(profileEditState(saved, saved.name, email).valid, false)
  }
  assert.equal(profileEditState(saved, '🔒'.repeat(100), saved.email).valid, true)
})

test('confirmação divergente impede o envio da troca de senha', async () => {
  let calls = 0
  const payload = { currentPassword: 'Old-pass-123', newPassword: 'New-pass-123', confirmPassword: 'Different-123' }
  await assert.rejects(submitPasswordChange(payload, async () => { calls++ }), /confirmação/)
  assert.equal(calls, 0)
  payload.confirmPassword = payload.newPassword
  assert.equal(await submitPasswordChange(payload, async (data) => { calls++; assert.equal(data, payload); return 'ok' }), 'ok')
  assert.equal(calls, 1)
})

test('senha usa exatamente 8–32 caracteres, incluindo Unicode', () => {
  for (const password of ['1234567', 'a'.repeat(33), '🔒'.repeat(33)]) {
    assert.match(passwordChangeError({ currentPassword: 'Old-pass-123', newPassword: password, confirmPassword: password }), /8 e 32/)
  }
  for (const password of ['12345678', 'a'.repeat(32), '🔒'.repeat(32)]) {
    assert.equal(passwordChangeError({ currentPassword: 'Old-pass-123', newPassword: password, confirmPassword: password }), '')
  }
})

test('Lista e Cards vêm da conta REAL; DEMO conserva Lista e alternância é local', () => {
  assert.equal(defaultView({ type: 'REAL', defaultView: 'list' }), 'list')
  const user = { type: 'REAL', defaultView: 'cards' }
  let currentView = defaultView(user)
  assert.equal(currentView, 'cards')
  currentView = 'list'
  assert.equal(currentView, 'list')
  assert.equal(defaultView(user), 'cards')
  assert.equal(defaultView({ type: 'DEMO', defaultView: 'cards' }), 'list')
  assert.equal(defaultView({ type: 'REAL' }), 'list')
  assert.equal(defaultView(null), 'list')
})

test('recorte quadrado central, zoom e posição mantêm limites da foto', () => {
  assert.deepEqual(cropRectangle(800, 400, 1, 50, 50), { size: 400, x: 200, y: 0 })
  assert.deepEqual(cropRectangle(400, 800, 2, 100, 0), { size: 200, x: 200, y: 0 })
  for (const width of [100, 400, 1200]) for (const height of [100, 800]) for (const zoom of [1, 2, 3]) {
    const crop = cropRectangle(width, height, zoom, 100, 100)
    assert.ok(crop.x >= 0 && crop.y >= 0)
    assert.ok(crop.x + crop.size <= width + 1e-9 && crop.y + crop.size <= height + 1e-9)
  }
})
