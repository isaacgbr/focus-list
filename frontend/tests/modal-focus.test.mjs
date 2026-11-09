import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/hooks/useModalFocusTrap.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })

// Executa o hook real com ciclo de efeitos e DOM mínimo, sem navegador ou novas dependências.
function fixture(t) {
  const listeners = new Map()
  const observers = new Set()
  const doc = {
    addEventListener(name, callback) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(callback) },
    removeEventListener(name, callback) { listeners.get(name)?.delete(callback) },
  }
  class Element {
    isConnected = true
    hidden = false
    disabled = false
    tabIndex = 0
    children = []
    focus() { doc.activeElement = this; for (const callback of listeners.get('focusin') ?? []) callback({ target: this }) }
    contains(element) { return this === element || this.children.some((child) => child.contains(element)) }
    closest() { return null }
    matches() { return this.disabled }
    getClientRects() { return this.isConnected ? [{}] : [] }
    querySelector() { return null }
    querySelectorAll() { return this.children }
  }
  doc.body = new Element()
  doc.documentElement = new Element()
  class Observer {
    constructor(callback) { this.callback = callback }
    observe() { observers.add(this) }
    disconnect() { observers.delete(this) }
  }
  const restoreGlobals = []
  for (const [key, value] of Object.entries({ document: doc, window: { getComputedStyle: () => ({ display: 'block', visibility: 'visible' }) }, HTMLElement: Element, MutationObserver: Observer })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { configurable: true, value })
    restoreGlobals.push(() => { if (previous) Object.defineProperty(globalThis, key, previous); else delete globalThis[key] })
  }
  const refs = []
  let cursor = 0, setup, cleanup, pending, previousOpen
  const hooks = {
    useRef(value) { const index = cursor++; return refs[index] ??= { current: value } },
    useLayoutEffect(callback, [open]) { if (previousOpen !== open) { pending = callback; previousOpen = open } },
  }
  const exports = {}
  new Function('require', 'exports', outputText)((name) => { assert.equal(name, 'react'); return hooks }, exports)
  const trigger = new Element(), modal = new Element(), first = new Element(), last = new Element()
  modal.children = [first, last]
  doc.activeElement = trigger
  function render(open) {
    cursor = 0
    const ref = exports.useModalFocusTrap(open)
    ref.current = modal
    if (pending) { cleanup?.(); setup = pending; pending = undefined; cleanup = setup() }
  }
  t.after(async () => {
    cleanup?.()
    for (const observer of [...observers]) observer.disconnect()
    await Promise.resolve()
    for (const restore of restoreGlobals.reverse()) restore()
  })
  return {
    doc, trigger, modal, first, last, render, observers, Element,
    replay() { cleanup?.(); cleanup = setup() },
    remove() { modal.isConnected = first.isConnected = last.isConnected = false; doc.activeElement = doc.body; for (const observer of [...observers]) observer.callback() },
    key(event) { for (const callback of listeners.get('keydown') ?? []) callback(event) },
    notify() { for (const observer of [...observers]) observer.callback() },
  }
}

test('modal animado restaura o foco só depois da remoção; trap continua funcionando ao abrir', async (t) => {
  const f = fixture(t)
  f.render(true)
  assert.equal(f.doc.activeElement, f.first)
  f.last.focus()
  let prevented = false
  f.key({ key: 'Tab', shiftKey: false, preventDefault() { prevented = true } })
  assert.equal(prevented, true)
  assert.equal(f.doc.activeElement, f.first)
  f.render(false)
  await Promise.resolve()
  assert.equal(f.doc.activeElement, f.first, 'Saída ainda mantém o modal conectado.')
  f.remove()
  assert.equal(f.doc.activeElement, f.trigger)
  assert.equal(f.observers.size, 0)
})

test('reconexão StrictMode e reabertura cancelam restauração antiga', async (t) => {
  const f = fixture(t)
  f.render(true)
  f.replay()
  await Promise.resolve()
  assert.equal(f.doc.activeElement, f.first)
  assert.equal(f.observers.size, 0)
  f.render(false)
  f.render(true)
  await Promise.resolve()
  f.notify()
  assert.equal(f.doc.activeElement, f.first)
  f.render(false)
  f.remove()
  assert.equal(f.doc.activeElement, f.trigger)
})

test('fechamento sem animação devolve foco e respeita interação em outro elemento', async (t) => {
  const f = fixture(t)
  f.render(true)
  f.modal.isConnected = false
  f.doc.activeElement = f.doc.body
  f.render(false)
  await Promise.resolve()
  assert.equal(f.doc.activeElement, f.trigger)
  f.modal.isConnected = true
  f.render(true)
  f.render(false)
  const other = new f.Element()
  f.modal.isConnected = false
  other.focus()
  f.notify()
  assert.equal(f.doc.activeElement, other, 'Não rouba foco movido durante a saída.')
})
