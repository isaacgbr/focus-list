import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8')
function worker() {
  const handlers = {}, stored = [], deleted = []
  const fallback = new Response('offline')
  let networkFails = false
  vm.runInNewContext(source, {
    URL, self: { location: { origin: 'https://focuslist.invalid' }, addEventListener: (name, handler) => { handlers[name] = handler }, skipWaiting: async () => {}, clients: { claim: async () => {} } },
    caches: { open: async () => ({ addAll: async (paths) => stored.push(...paths), match: async () => fallback.clone() }), keys: async () => ['focuslist-offline-old', 'other-app-cache'], delete: async (key) => deleted.push(key) },
    fetch: async () => { if (networkFails) throw new Error('network unavailable'); return new Response('network') },
  })
  return { handlers, stored, deleted, fail() { networkFails = true }, fetch(path, mode = 'cors', method = 'GET') {
    let response
    handlers.fetch({ request: { url: new URL(path, 'https://focuslist.invalid').href, mode, method }, respondWith(value) { response = value } })
    return response
  } }
}

test('instala somente recursos públicos da tela Offline e remove apenas caches próprios antigos', async () => {
  const w = worker()
  await new Promise((resolve, reject) => w.handlers.install({ waitUntil: promise => promise.then(resolve, reject) }))
  assert.deepEqual(w.stored, ['/offline.html', '/offline.css', '/offline.js', '/focuslist-mark.png'])
  await new Promise((resolve, reject) => w.handlers.activate({ waitUntil: promise => promise.then(resolve, reject) }))
  assert.deepEqual(w.deleted, ['focuslist-offline-old'])
})

test('API, autenticação, uploads e sondagem de conexão nunca recebem resposta do worker', () => {
  const w = worker()
  for (const path of ['/auth/session', '/auth/login', '/auth/demo', '/profile/avatar', '/tasks', '/areas', '/api/tasks', '/offline.html?connection-check']) {
    assert.equal(w.fetch(path), undefined, path)
    assert.equal(w.fetch(path, 'cors', 'POST'), undefined, path)
  }
  assert.equal(w.fetch('https://api.other.invalid/tasks'), undefined)
  assert.equal(w.fetch('/tasks', 'navigate'), undefined)
})

test('navegação usa rede online e somente o fallback público quando a rede falha', async () => {
  const w = worker()
  assert.equal(await (await w.fetch('/app', 'navigate')).text(), 'network')
  w.fail()
  for (const path of ['/app', '/app/areas/1/listas/2', '/login', '/demo/dados']) assert.equal(await (await w.fetch(path, 'navigate')).text(), 'offline')
  assert.equal(w.fetch('/app', 'cors'), undefined)
  assert.deepEqual(w.stored, [], 'Nenhuma navegação, sessão ou dado é gravado em cache.')
})
