import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/utils/dashboardTheme.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { getStoredHeroTheme, storeHeroTheme } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

function browser(t, value) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', { configurable: true, value })
  t.after(() => { if (previous) Object.defineProperty(globalThis, 'window', previous); else delete globalThis.window })
}

test('preserva a chave e todas as preferências válidas; valores ausentes/inválidos usam auto', (t) => {
  let saved = null
  browser(t, { localStorage: {
    getItem(key) { assert.equal(key, 'focuslist:dashboard-hero-theme'); return saved },
    setItem(key, value) { assert.equal(key, 'focuslist:dashboard-hero-theme'); saved = value },
  } })
  for (const theme of ['auto', 'morning', 'afternoon', 'night']) {
    storeHeroTheme(theme)
    assert.equal(getStoredHeroTheme(), theme)
  }
  for (const value of [null, '', 'invalid', 'NIGHT']) { saved = value; assert.equal(getStoredHeroTheme(), 'auto') }
})

test('getter de storage indisponível e falhas de leitura/escrita não interrompem a interface', (t) => {
  const value = { get localStorage() { throw new Error('storage blocked') } }
  browser(t, value)
  assert.equal(getStoredHeroTheme(), 'auto')
  assert.doesNotThrow(() => storeHeroTheme('night'))
  Object.defineProperty(value, 'localStorage', { value: {
    getItem() { throw new Error('read blocked') }, setItem() { throw new Error('quota exceeded') },
  } })
  assert.equal(getStoredHeroTheme(), 'auto')
  assert.doesNotThrow(() => storeHeroTheme('morning'))
})
