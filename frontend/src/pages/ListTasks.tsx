import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  ClipboardList,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import taskService, { CreateTaskData, Task, TaskPriority, UpdateTaskData } from '../services/taskService'

type TaskForm = {
  title: string
  description: string
  dueDate: string
  priority: TaskPriority | ''
}

const emptyTaskForm: TaskForm = {
  title: '',
  description: '',
  dueDate: '',
  priority: '',
}

const priorityLabels: Record<TaskPriority, string> = {
  HIGH: 'Alta',
  MEDIUM: 'Média',
  LOW: 'Baixa',
}

function toDateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : ''
}

function formatDueDate(value: string | null) {
  if (!value) return 'Sem prazo'

  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value))
}

export function ListTasks() {
  const { listId } = useParams()
  const selectedListId = Number(listId)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<Task | null>(null)
  const [form, setForm] = useState<TaskForm>(emptyTaskForm)

  const loadTasks = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')

    if (!Number.isInteger(selectedListId) || selectedListId <= 0) {
      setTasks([])
      setLoadError('Não foi possível identificar a lista selecionada.')
      setIsLoading(false)
      return
    }

    try {
      const allTasks = await taskService.getAll()
      setTasks(allTasks.filter((task) => task.listId === selectedListId))
    } catch {
      setTasks([])
      setLoadError('Não foi possível carregar as tarefas desta lista.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedListId])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  useEffect(() => {
    if (!isModalOpen && !deleteCandidate) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (isModalOpen && !isSaving) setIsModalOpen(false)
      if (deleteCandidate && !isDeleting) setDeleteCandidate(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteCandidate, isDeleting, isModalOpen, isSaving])

  const openCreateModal = () => {
    setEditingTask(null)
    setForm(emptyTaskForm)
    setActionError('')
    setIsModalOpen(true)
  }

  const openEditModal = (task: Task) => {
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description ?? '',
      dueDate: toDateInputValue(task.dueDate),
      priority: task.priority ?? '',
    })
    setActionError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (!isSaving) setIsModalOpen(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.title.trim() || !Number.isInteger(selectedListId)) return

    setIsSaving(true)
    setActionError('')

    const commonPayload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      dueDate: form.dueDate ? `${form.dueDate}T12:00:00.000Z` : undefined,
      priority: form.priority || undefined,
      listId: selectedListId,
    }

    try {
      if (editingTask) {
        const payload: UpdateTaskData = {
          ...commonPayload,
          description: commonPayload.description ?? null,
          dueDate: commonPayload.dueDate ?? null,
          priority: commonPayload.priority ?? null,
        }
        await taskService.update(editingTask.id, payload)
      } else {
        const payload: CreateTaskData = commonPayload
        await taskService.create(payload)
      }

      setIsModalOpen(false)
      await loadTasks()
    } catch {
      setActionError(`Não foi possível ${editingTask ? 'salvar' : 'criar'} a tarefa.`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteCandidate) return

    setIsDeleting(true)
    setActionError('')

    try {
      await taskService.remove(deleteCandidate.id)
      setDeleteCandidate(null)
      await loadTasks()
    } catch {
      setActionError('Não foi possível excluir a tarefa.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleCompleted = async (task: Task) => {
    setUpdatingTaskId(task.id)
    setActionError('')

    try {
      await taskService.update(task.id, {
        completed: !task.completed,
        completedAt: task.completed ? null : new Date().toISOString(),
      })
      await loadTasks()
    } catch {
      setActionError(`Não foi possível ${task.completed ? 'reabrir' : 'concluir'} a tarefa.`)
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const pendingTasks = tasks.filter((task) => !task.completed)
  const completedTasks = tasks.filter((task) => task.completed)

  const renderTask = (task: Task) => (
    <article className={`task-item${task.completed ? ' is-completed' : ''}`} key={task.id}>
      <button
        className="task-complete-button"
        type="button"
        onClick={() => void handleToggleCompleted(task)}
        disabled={updatingTaskId === task.id}
        aria-label={task.completed ? `Desmarcar conclusão de ${task.title}` : `Concluir ${task.title}`}
      >
        {updatingTaskId === task.id ? <LoaderCircle className="spin" size={22} /> : task.completed ? <Check size={19} /> : null}
      </button>
      <div className="task-item-copy">
        <strong>{task.title}</strong>
        {task.description ? <p>{task.description}</p> : null}
      </div>
      <span className={`task-priority${task.priority ? ` is-${task.priority.toLowerCase()}` : ''}`}>
        {task.priority ? priorityLabels[task.priority] : 'Sem prioridade'}
      </span>
      <span className="task-due-date"><CalendarDays size={17} />{formatDueDate(task.dueDate)}</span>
      <div className="task-item-actions">
        <button type="button" onClick={() => openEditModal(task)} aria-label={`Editar ${task.title}`}><Pencil size={17} /></button>
        <button type="button" onClick={() => { setActionError(''); setDeleteCandidate(task) }} aria-label={`Excluir ${task.title}`}><Trash2 size={17} /></button>
      </div>
    </article>
  )

  return (
    <section className="lists-page tasks-page" aria-labelledby="tasks-title">
      <div className="lists-page-heading">
        <div>
          <p>Lista selecionada</p>
          <h1 id="tasks-title">Tarefas</h1>
          <span>Organize e acompanhe as tarefas desta lista.</span>
        </div>
        <button className="primary-action" type="button" onClick={openCreateModal}>
          <Plus size={20} aria-hidden="true" />
          Nova Tarefa
        </button>
      </div>

      {actionError && !isModalOpen && !deleteCandidate ? (
        <p className="lists-action-error" role="alert"><AlertCircle size={19} />{actionError}</p>
      ) : null}

      {isLoading ? (
        <div className="lists-state" aria-live="polite">
          <LoaderCircle className="spin" size={32} aria-hidden="true" />
          <h2>Carregando tarefas...</h2>
          <p>Aguarde enquanto buscamos os dados desta lista.</p>
        </div>
      ) : null}

      {!isLoading && loadError ? (
        <div className="lists-state is-error" role="alert">
          <AlertCircle size={36} aria-hidden="true" />
          <h2>Erro ao carregar</h2>
          <p>{loadError}</p>
          <button className="secondary-action" type="button" onClick={() => void loadTasks()}>Tentar novamente</button>
        </div>
      ) : null}

      {!isLoading && !loadError && tasks.length === 0 ? (
        <div className="lists-state">
          <span className="lists-state-icon" aria-hidden="true"><ClipboardList size={38} /></span>
          <h2>Nenhuma tarefa criada</h2>
          <p>Crie a primeira tarefa desta lista para começar.</p>
          <button className="primary-action" type="button" onClick={openCreateModal}>
            <Plus size={20} aria-hidden="true" />
            Criar Tarefa
          </button>
        </div>
      ) : null}

      {!isLoading && !loadError && tasks.length > 0 ? (
        <div className="tasks-content" aria-live="polite">
          <div className="tasks-summary">
            <span><Circle size={16} />{pendingTasks.length} {pendingTasks.length === 1 ? 'pendente' : 'pendentes'}</span>
            <span><CheckCircle2 size={17} />{completedTasks.length} {completedTasks.length === 1 ? 'concluída' : 'concluídas'}</span>
          </div>
          <div className="tasks-list">
            {pendingTasks.map(renderTask)}
          </div>
          {completedTasks.length > 0 ? (
            <section className="completed-tasks" aria-labelledby="completed-tasks-title">
              <h2 id="completed-tasks-title"><CheckCircle2 size={20} />Concluídas ({completedTasks.length})</h2>
              <div className="tasks-list">{completedTasks.map(renderTask)}</div>
            </section>
          ) : null}
        </div>
      ) : null}

      {isModalOpen ? (
        <div className="area-modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <section className="area-modal task-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="area-modal-heading">
              <span className="area-modal-heading-icon" aria-hidden="true">
                <ClipboardList size={32} />
                <Plus className="area-modal-heading-plus" size={17} />
              </span>
              <div>
                <h2 id="task-modal-title">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
                <p>{editingTask ? 'Atualize os dados desta tarefa.' : 'Crie uma nova tarefa para sua lista.'}</p>
              </div>
              <button className="icon-button area-modal-close" type="button" onClick={closeModal} aria-label="Fechar"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="area-form-field">
                <span>Nome da Tarefa <strong>*</strong></span>
                <input autoFocus maxLength={100} required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex.: Estudar herança em Java" />
                <small>{form.title.length}/100</small>
              </label>
              <label className="area-form-field">
                <span>Descrição</span>
                <textarea maxLength={500} rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Ex.: Revisar exemplos, fazer exercícios e anotações." />
                <small>{form.description.length}/500</small>
              </label>
              <div className="task-form-row">
                <label className="area-form-field">
                  <span>Prazo</span>
                  <input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
                </label>
                <label className="area-form-field">
                  <span>Prioridade</span>
                  <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as TaskPriority | '' }))}>
                    <option value="">Sem prioridade</option>
                    <option value="HIGH">Alta</option>
                    <option value="MEDIUM">Média</option>
                    <option value="LOW">Baixa</option>
                  </select>
                </label>
              </div>

              {actionError ? <p className="area-form-error" role="alert"><AlertCircle size={18} />{actionError}</p> : null}

              <div className="area-modal-actions">
                <button className="secondary-action" type="button" onClick={closeModal} disabled={isSaving}>Cancelar</button>
                <button className="primary-action" type="submit" disabled={isSaving || !form.title.trim()}>
                  {isSaving ? <LoaderCircle className="spin" size={19} aria-hidden="true" /> : null}
                  {editingTask ? 'Salvar alterações' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {deleteCandidate ? (
        <div className="area-modal-backdrop" role="presentation" onMouseDown={() => !isDeleting && setDeleteCandidate(null)}>
          <section className="area-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="task-delete-title" aria-describedby="task-delete-description" onMouseDown={(event) => event.stopPropagation()}>
            <span className="area-delete-icon" aria-hidden="true"><Trash2 size={29} /></span>
            <div>
              <h2 id="task-delete-title">Excluir Tarefa</h2>
              <p id="task-delete-description">Tem certeza de que deseja excluir “{deleteCandidate.title}”? Esta ação não pode ser desfeita.</p>
              {actionError ? <p className="area-form-error" role="alert"><AlertCircle size={18} />{actionError}</p> : null}
            </div>
            <div className="area-modal-actions">
              <button className="secondary-action" type="button" onClick={() => setDeleteCandidate(null)} disabled={isDeleting}>Cancelar</button>
              <button className="danger-action" type="button" onClick={() => void handleDelete()} disabled={isDeleting}>
                {isDeleting ? <LoaderCircle className="spin" size={19} aria-hidden="true" /> : <Trash2 size={19} aria-hidden="true" />}
                Excluir Tarefa
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}
