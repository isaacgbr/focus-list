import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/utils/taskAttention.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { matchesTaskAttention } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const task = (dueDate, extra = {}) => ({ dueDate, completed: false, archivedAt: null, ...extra })

test('atenção separa vencidas, hoje e os sete dias seguintes sem depender do horário UTC', () => {
  const today = '2026-11-08'
  assert.equal(matchesTaskAttention(task('2026-11-07T23:59:00Z'), 'overdue', today), true)
  assert.equal(matchesTaskAttention(task('2026-11-08T00:00:00Z'), 'overdue', today), false)
  assert.equal(matchesTaskAttention(task('2026-11-08T23:59:00Z'), 'today', today), true)
  assert.equal(matchesTaskAttention(task('2026-11-08T12:00:00Z'), 'week', today), false)
  assert.equal(matchesTaskAttention(task('2026-11-09T00:00:00Z'), 'week', today), true)
  assert.equal(matchesTaskAttention(task('2026-11-15T23:59:00Z'), 'week', today), true)
  assert.equal(matchesTaskAttention(task('2026-11-16T00:00:00Z'), 'week', today), false)
})

test('atenção exclui tarefas concluídas, arquivadas e sem prazo em qualquer filtro', () => {
  for (const filter of ['overdue', 'today', 'week']) {
    for (const due of ['2026-11-07', '2026-11-08', '2026-11-09']) {
      assert.equal(matchesTaskAttention(task(due, { completed: true }), filter, '2026-11-08'), false)
      assert.equal(matchesTaskAttention(task(due, { archivedAt: '2026-11-01' }), filter, '2026-11-08'), false)
    }
    assert.equal(matchesTaskAttention(task(null), filter, '2026-11-08'), false)
  }
})

test('próximos sete dias respeitam virada de mês, ano e ano bissexto', () => {
  for (const [today, end, outside] of [
    ['2026-11-28', '2026-12-05', '2026-12-06'],
    ['2026-12-29', '2027-01-05', '2027-01-06'],
    ['2028-02-24', '2028-03-02', '2028-03-03'],
  ]) {
    assert.equal(matchesTaskAttention(task(end), 'week', today), true)
    assert.equal(matchesTaskAttention(task(outside), 'week', today), false)
  }
})
