export type AttentionFilter = 'overdue' | 'today' | 'week'

// Prazos são datas de calendário, como no resumo do backend: a semana exclui hoje.
export function matchesTaskAttention(task: { completed: boolean; archivedAt: string | null; dueDate: string | null }, filter: AttentionFilter, today: string) {
  if (task.completed || task.archivedAt || !task.dueDate) return false
  const due = task.dueDate.slice(0, 10)
  if (filter === 'overdue') return due < today
  if (filter === 'today') return due === today
  const [year, month, day] = today.split('-').map(Number)
  const weekEnd = new Date(Date.UTC(year, month - 1, day + 7)).toISOString().slice(0, 10)
  return due > today && due <= weekEnd
}
