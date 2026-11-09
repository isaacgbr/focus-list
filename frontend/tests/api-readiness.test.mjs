import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/utils/apiReadiness.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { waitForApi } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const options = () => ({ signal: new AbortController().signal, onSlow() {}, timeout: 100, retryDelay: 2, grace: 1 })

test('API pronta libera imediatamente, sem loading nem cookies/cache', async () => {
  let slow = false
  assert.equal(await waitForApi('/health', { ...options(), onSlow() { slow = true }, request: async (url, init) => {
    assert.equal(url, '/health'); assert.equal(init.cache, 'no-store'); assert.equal(init.credentials, 'omit')
    return Response.json({ status: 'OK' })
  } }), 'ready')
  await new Promise(resolve => setTimeout(resolve, 5))
  assert.equal(slow, false)
})

test('repete após proxy HTML, erro HTTP e rede, até saúde confirmada', async () => {
  let calls = 0; let slow = false
  assert.equal(await waitForApi('/health', { ...options(), onSlow() { slow = true }, request: async () => {
    calls++
    if (calls === 1) return new Response('<html>starting</html>')
    if (calls === 2) return new Response('', { status: 503 })
    if (calls === 3) throw new TypeError('network')
    return Response.json({ status: 'OK' })
  } }), 'ready')
  assert.equal(calls, 4); assert.equal(slow, true)
})

test('falha prolongada termina e nova tentativa pode recuperar', async () => {
  assert.equal(await waitForApi('/health', { ...options(), timeout: 15, request: async () => Response.json({ status: 'starting' }) }), 'error')
  assert.equal(await waitForApi('/health', { ...options(), request: async () => Response.json({ status: 'OK' }) }), 'ready')
})

test('cancelamento interrompe espera e requisição em andamento', async () => {
  const controller = new AbortController()
  const pending = waitForApi('/health', { ...options(), signal: controller.signal, request: async (_, { signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  }) })
  controller.abort()
  assert.equal(await pending, 'cancelled')
})

test('prazo global também interrompe uma requisição travada', async () => {
  const keepAlive = setTimeout(() => {}, 100)
  try {
    assert.equal(await waitForApi('/health', { ...options(), timeout: 15, request: async (_, { signal }) => new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true })
    }) }), 'error')
  } finally { clearTimeout(keepAlive) }
})
