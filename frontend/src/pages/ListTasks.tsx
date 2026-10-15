import { AlertCircle, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronUp, Circle, ClipboardList, LayoutGrid, Link2, List as ListIcon, ListChecks, LoaderCircle, Pencil, Plus, X } from 'lucide-react'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { ArchivedModeBanner } from '../components/ArchivedModeBanner'
import { useBreadcrumbs } from '../components/BreadcrumbContext'
import { TaskDetails } from '../components/TaskDetails'
import { useModalFocusTrap } from '../hooks/useModalFocusTrap'
import archiveService, { ArchivedListDetail } from '../services/archiveService'
import areaService from '../services/areaService'
import checklistItemService, { ChecklistItem } from '../services/checklistItemService'
import listService from '../services/listService'
import linkService, { Link } from '../services/linkService'
import taskService, { CreateTaskData, Task, TaskPriority } from '../services/taskService'

type TaskForm = { title: string; description: string; dueDate: string; priority: TaskPriority | '' }

const emptyTaskForm: TaskForm = { title: '', description: '', dueDate: '', priority: '' }
const priorityLabels: Record<TaskPriority, string> = { HIGH: 'Alta', MEDIUM: 'Média', LOW: 'Baixa' }
const INITIAL_VISIBLE_CARDS = 12

type TaskContentSummary = {
  checklistCompleted: number
  checklistTotal: number
  linkCount: number
}

function summarizeTaskContent(checklistItems: ChecklistItem[], links: Link[]) {
  const summaries: Record<number, TaskContentSummary> = {}

  checklistItems.forEach((item) => {
    const summary = summaries[item.taskId] ?? { checklistCompleted: 0, checklistTotal: 0, linkCount: 0 }
    summary.checklistTotal += 1
    if (item.completed) summary.checklistCompleted += 1
    summaries[item.taskId] = summary
  })

  links.forEach((link) => {
    const summary = summaries[link.taskId] ?? { checklistCompleted: 0, checklistTotal: 0, linkCount: 0 }
    summary.linkCount += 1
    summaries[link.taskId] = summary
  })

  return summaries
}

function formatDueDate(value: string | null) {
  if (!value) return 'Sem prazo'
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value))
}

export function ListTasks({ archivedMode = false }: { archivedMode?: boolean }) {
  const { areaId, listId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const selectedListId = Number(listId)
  const selectedAreaId = Number(areaId)
  const setBreadcrumbs = useBreadcrumbs()
  const [listTitle, setListTitle] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskContentSummaries, setTaskContentSummaries] = useState<Record<number, TaskContentSummary>>({})
  const [archivedList, setArchivedList] = useState<ArchivedListDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isListEditOpen, setIsListEditOpen] = useState(false)
  const [listEditForm, setListEditForm] = useState({ title: '', description: '' })
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [form, setForm] = useState<TaskForm>(emptyTaskForm)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')
  const [visiblePendingCards, setVisiblePendingCards] = useState(INITIAL_VISIBLE_CARDS)
  const [visibleCompletedCards, setVisibleCompletedCards] = useState(INITIAL_VISIBLE_CARDS)
  const [completedCardsExpanded, setCompletedCardsExpanded] = useState(false)
  const taskModalRef = useModalFocusTrap<HTMLElement>(isModalOpen)
  const listEditModalRef = useModalFocusTrap<HTMLElement>(isListEditOpen)

  const loadTaskContentSummaries = useCallback(async () => {
    const [checklistItems, links] = await Promise.all([
      checklistItemService.getAll(),
      linkService.getAll(),
    ])
    setTaskContentSummaries(summarizeTaskContent(checklistItems, links))
  }, [])

  const loadTasks = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    setBreadcrumbs([])
    if (!Number.isInteger(selectedListId) || selectedListId <= 0) {
      setTasks([])
      setLoadError('Não foi possível identificar a lista selecionada.')
      setIsLoading(false)
      return
    }
    try {
      if (archivedMode) {
        const list = await archiveService.getList(selectedListId)
        setArchivedList(list)
        setListTitle(list.title)
        setBreadcrumbs([
          { label: list.area.title, to: list.area.archivedAt ? `/arquivados/areas/${list.area.id}` : undefined },
          { label: list.title },
        ])
        setTasks(list.tasks.map((task) => ({ ...task, listId: selectedListId })))
        setTaskContentSummaries({})
      } else {
        const [allTasks, selectedList, area, checklistItems, links] = await Promise.all([
          taskService.getAll(),
          listService.getById(selectedListId),
          areaService.getById(selectedAreaId),
          checklistItemService.getAll(),
          linkService.getAll(),
        ])
        setTasks(allTasks.filter((task) => task.listId === selectedListId))
        setTaskContentSummaries(summarizeTaskContent(checklistItems, links))
        setListTitle(selectedList.title)
        setBreadcrumbs([
          { label: area.title, to: `/areas/${area.id}` },
          { label: selectedList.title },
        ])
      }
    } catch {
      setTasks([])
      setArchivedList(null)
      setLoadError(archivedMode ? 'Não foi possível carregar esta lista arquivada.' : 'Não foi possível carregar as tarefas desta lista.')
    } finally {
      setIsLoading(false)
    }
  }, [archivedMode, selectedAreaId, selectedListId, setBreadcrumbs])

  const openArchivedListEdit = () => {
    if (!archivedList) return
    setListEditForm({ title: archivedList.title, description: archivedList.description ?? '' })
    setActionError('')
    setIsListEditOpen(true)
  }

  const handleArchivedListEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!listEditForm.title.trim()) return
    setIsSaving(true)
    setActionError('')
    try {
      await listService.update(selectedListId, {
        title: listEditForm.title.trim(),
        description: listEditForm.description.trim(),
      })
      setIsListEditOpen(false)
      await loadTasks()
    } catch {
      setActionError('Não foi possível salvar a lista.')
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => { void loadTasks() }, [loadTasks])
  useEffect(() => {
    const taskId = (location.state as { taskId?: unknown } | null)?.taskId
    if (archivedMode || isLoading || loadError || typeof taskId !== 'number') return

    setSelectedTask(tasks.find((task) => task.id === taskId) ?? null)
    navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state: null })
  }, [archivedMode, isLoading, loadError, location.hash, location.pathname, location.search, location.state, navigate, tasks])

  useEffect(() => {
    if (!isModalOpen && !isListEditOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || isSaving) return
      if (isListEditOpen) setIsListEditOpen(false)
      else setIsModalOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isListEditOpen, isModalOpen, isSaving])

  const openCreateModal = () => {
    setForm(emptyTaskForm)
    setActionError('')
    setIsModalOpen(true)
  }

  const closeModal = () => { if (!isSaving) setIsModalOpen(false) }

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
      await taskService.create(commonPayload as CreateTaskData)
      setIsModalOpen(false)
      await loadTasks()
    } catch {
      setActionError('Não foi possível criar a tarefa.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleCompleted = async (task: Task) => {
    setUpdatingTaskId(task.id)
    setActionError('')
    try {
      await taskService.update(task.id, { completed: !task.completed, completedAt: task.completed ? null : new Date().toISOString() })
      await loadTasks()
    } catch {
      setActionError(`Não foi possível ${task.completed ? 'reabrir' : 'concluir'} a tarefa.`)
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const updateSelectedTask = (updated: Task) => {
    setSelectedTask(updated)
    setTasks((current) => current.map((task) => task.id === updated.id ? updated : task))
  }

  const pendingTasks = tasks.filter((task) => !task.completed)
  const completedTasks = tasks.filter((task) => task.completed)
  const renderContentIndicators = (task: Task) => {
    const summary = taskContentSummaries[task.id]
    if (!summary || (!summary.checklistTotal && !summary.linkCount)) return null

    return <span className="task-content-indicators">
      {summary.checklistTotal ? <span title={`${summary.checklistCompleted} de ${summary.checklistTotal} itens do checklist concluídos`} aria-label={`${summary.checklistCompleted} de ${summary.checklistTotal} itens do checklist concluídos`}><ListChecks size={15} aria-hidden="true" />{summary.checklistCompleted}/{summary.checklistTotal}</span> : null}
      {summary.linkCount ? <span title={`${summary.linkCount} ${summary.linkCount === 1 ? 'link' : 'links'}`} aria-label={`${summary.linkCount} ${summary.linkCount === 1 ? 'link' : 'links'}`}><Link2 size={15} aria-hidden="true" />{summary.linkCount}</span> : null}
    </span>
  }

  const renderTask = (task: Task) => (
    <article className={`task-item${task.completed ? ' is-completed' : ''}`} key={task.id}>
      <button className="task-complete-button" type="button" onClick={() => void handleToggleCompleted(task)} disabled={updatingTaskId === task.id} aria-label={task.completed ? `Desmarcar conclusão de ${task.title}` : `Concluir ${task.title}`}>
        {updatingTaskId === task.id ? <LoaderCircle className="spin" size={22} /> : task.completed ? <Check size={19} /> : null}
      </button>
      <button className="task-item-copy" type="button" onClick={() => setSelectedTask(task)} aria-label={`Abrir detalhes de ${task.title}`}>
        <strong>{task.title}</strong>{task.description ? <p>{task.description}</p> : null}{renderContentIndicators(task)}
      </button>
      <span className={`task-priority${task.priority ? ` is-${task.priority.toLowerCase()}` : ''}`}>{task.priority ? priorityLabels[task.priority] : 'Sem prioridade'}</span>
      <span className="task-due-date"><CalendarDays size={17} />{formatDueDate(task.dueDate)}</span>
    </article>
  )

  const renderTaskCard = (task: Task) => (
    <article className={`task-card${task.completed ? ' is-completed' : ''}`} key={task.id}>
      <button className="task-complete-button" type="button" onClick={() => void handleToggleCompleted(task)} disabled={updatingTaskId === task.id} aria-label={task.completed ? `Desmarcar conclusão de ${task.title}` : `Concluir ${task.title}`}>
        {updatingTaskId === task.id ? <LoaderCircle className="spin" size={22} /> : task.completed ? <Check size={19} /> : null}
      </button>
      <button className="task-card-copy" type="button" onClick={() => setSelectedTask(task)} aria-label={`Abrir detalhes de ${task.title}`}>
        <strong>{task.title}</strong>
        {task.description ? <p>{task.description}</p> : null}
        {task.priority || task.dueDate || taskContentSummaries[task.id] ? <span className="task-card-metadata">
          {task.priority ? <span className={`task-priority is-${task.priority.toLowerCase()}`}>{priorityLabels[task.priority]}</span> : null}
          {task.dueDate ? <span className="task-due-date"><CalendarDays size={15} />{formatDueDate(task.dueDate)}</span> : null}
          {renderContentIndicators(task)}
        </span> : null}
      </button>
    </article>
  )

  return (
    <section className="lists-page tasks-page" aria-labelledby="tasks-title">
      <div className="lists-page-heading">
        <div><p>{listTitle || 'Lista selecionada'}</p><h1 id="tasks-title">Tarefas</h1><span>Organize e acompanhe as tarefas desta lista.</span></div>
        {!archivedMode ? <button className="primary-action" type="button" onClick={openCreateModal}><Plus size={20} />Nova Tarefa</button> : <button className="secondary-action" type="button" onClick={openArchivedListEdit}><Pencil size={18} />Editar Lista</button>}
      </div>
      {archivedMode && archivedList ? <ArchivedModeBanner /> : null}
      {actionError && !isModalOpen ? <p className="lists-action-error" role="alert"><AlertCircle size={19} />{actionError}</p> : null}
      {isLoading ? <div className="lists-state" aria-live="polite"><LoaderCircle className="spin" size={32} /><h2>Carregando tarefas...</h2><p>Aguarde enquanto buscamos os dados desta lista.</p></div> : null}
      {!isLoading && loadError ? <div className="lists-state is-error" role="alert"><AlertCircle size={36} /><h2>Erro ao carregar</h2><p>{loadError}</p><button className="secondary-action" type="button" onClick={() => void loadTasks()}>Tentar novamente</button></div> : null}
      {!isLoading && !loadError && tasks.length === 0 ? <div className="lists-state"><span className="lists-state-icon"><ClipboardList size={38} /></span><h2>Nenhuma tarefa criada</h2><p>{archivedMode ? 'Esta lista não possui tarefas.' : 'Crie a primeira tarefa desta lista para começar.'}</p>{!archivedMode ? <button className="primary-action" type="button" onClick={openCreateModal}><Plus size={20} />Criar Tarefa</button> : null}</div> : null}
      {!isLoading && !loadError && tasks.length > 0 ? (
        <div className="tasks-content" aria-live="polite">
          {!archivedMode ? (
            <div className="tasks-view-header">
              <div className="tasks-summary"><span><Circle size={16} />{pendingTasks.length} {pendingTasks.length === 1 ? 'pendente' : 'pendentes'}</span><span><CheckCircle2 size={17} />{completedTasks.length} {completedTasks.length === 1 ? 'concluída' : 'concluídas'}</span></div>
              <div className="view-mode-toggle" role="group" aria-label="Modo de visualização das tarefas">
                <button className={viewMode === 'list' ? 'is-active' : ''} type="button" onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'}><ListIcon size={18} />Lista</button>
                <button className={viewMode === 'cards' ? 'is-active' : ''} type="button" onClick={() => setViewMode('cards')} aria-pressed={viewMode === 'cards'}><LayoutGrid size={18} />Cards</button>
              </div>
            </div>
          ) : <div className="tasks-summary"><span><Circle size={16} />{pendingTasks.length} {pendingTasks.length === 1 ? 'pendente' : 'pendentes'}</span><span><CheckCircle2 size={17} />{completedTasks.length} {completedTasks.length === 1 ? 'concluída' : 'concluídas'}</span></div>}

          {!archivedMode && viewMode === 'cards' ? (
            <div className="task-card-sections">
              {pendingTasks.length > 0 ? <section className="task-card-section pending-task-cards" aria-labelledby="pending-task-cards-title">
                <h2 id="pending-task-cards-title">Pendentes <span aria-hidden="true">·</span> {pendingTasks.length}</h2>
                <div className="task-cards-grid">{pendingTasks.slice(0, visiblePendingCards).map(renderTaskCard)}</div>
                {pendingTasks.length > INITIAL_VISIBLE_CARDS ? <button className="task-cards-more" type="button" onClick={() => setVisiblePendingCards((current) => current >= pendingTasks.length ? INITIAL_VISIBLE_CARDS : pendingTasks.length)}>{visiblePendingCards >= pendingTasks.length ? <><ChevronUp size={18} />Recolher</> : <><ChevronDown size={18} />Ver mais {pendingTasks.length - visiblePendingCards}</>}</button> : null}
              </section> : null}
              {completedTasks.length > 0 ? <section className={`task-card-section completed-task-cards${completedCardsExpanded ? ' is-expanded' : ''}`} aria-labelledby="completed-task-cards-title">
                <button className="task-card-section-toggle" type="button" onClick={() => setCompletedCardsExpanded((current) => !current)} aria-expanded={completedCardsExpanded}>
                  <span id="completed-task-cards-title"><CheckCircle2 size={18} />Concluídas <span aria-hidden="true">·</span> {completedTasks.length}</span>
                  <span className="task-card-section-action">{completedCardsExpanded ? 'Ocultar' : 'Mostrar'}{completedCardsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
                </button>
                {completedCardsExpanded ? <><div className="task-cards-grid">{completedTasks.slice(0, visibleCompletedCards).map(renderTaskCard)}</div>{completedTasks.length > INITIAL_VISIBLE_CARDS ? <button className="task-cards-more" type="button" onClick={() => setVisibleCompletedCards((current) => current >= completedTasks.length ? INITIAL_VISIBLE_CARDS : completedTasks.length)}>{visibleCompletedCards >= completedTasks.length ? <><ChevronUp size={18} />Recolher</> : <><ChevronDown size={18} />Ver mais {completedTasks.length - visibleCompletedCards}</>}</button> : null}</> : null}
              </section> : null}
            </div>
          ) : <>
            <div className="tasks-list">{pendingTasks.map(renderTask)}</div>
            {completedTasks.length > 0 ? <section className="completed-tasks" aria-labelledby="completed-tasks-title"><h2 id="completed-tasks-title"><CheckCircle2 size={20} />Concluídas ({completedTasks.length})</h2><div className="tasks-list">{completedTasks.map(renderTask)}</div></section> : null}
          </>}
        </div>
      ) : null}

      {!archivedMode && isModalOpen ? (
        <div className="area-modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <section ref={taskModalRef} className="area-modal task-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
            <div className="area-modal-heading">
              <span className="area-modal-heading-icon"><ClipboardList size={32} /><Plus className="area-modal-heading-plus" size={17} /></span>
              <div><h2 id="task-modal-title">Nova Tarefa</h2><p>Crie uma nova tarefa para sua lista.</p></div>
              <button className="icon-button area-modal-close" type="button" onClick={closeModal} aria-label="Fechar"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <label className="area-form-field"><span>Nome da Tarefa <strong>*</strong></span><input data-modal-initial-focus maxLength={100} required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex.: Estudar herança em Java" /><small>{form.title.length}/100</small></label>
              <label className="area-form-field"><span>Descrição</span><textarea maxLength={500} rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Ex.: Revisar exemplos, fazer exercícios e anotações." /><small>{form.description.length}/500</small></label>
              <div className="task-form-row">
                <label className="area-form-field"><span>Prazo</span><input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} /></label>
                <label className="area-form-field"><span>Prioridade</span><select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as TaskPriority | '' }))}><option value="">Sem prioridade</option><option value="HIGH">Alta</option><option value="MEDIUM">Média</option><option value="LOW">Baixa</option></select></label>
              </div>
              {actionError ? <p className="area-form-error" role="alert"><AlertCircle size={18} />{actionError}</p> : null}
              <div className="area-modal-actions"><button className="secondary-action" type="button" onClick={closeModal} disabled={isSaving}>Cancelar</button><button className="primary-action" type="submit" disabled={isSaving || !form.title.trim()}>{isSaving ? <LoaderCircle className="spin" size={19} /> : null}Criar Tarefa</button></div>
            </form>
          </section>
        </div>
      ) : null}

      {archivedMode && isListEditOpen ? (
        <div className="area-modal-backdrop" role="presentation" onMouseDown={() => !isSaving && setIsListEditOpen(false)}>
          <section ref={listEditModalRef} className="area-modal list-modal" role="dialog" aria-modal="true" aria-labelledby="archived-list-edit-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
            <div className="area-modal-heading"><span className="area-modal-heading-icon" aria-hidden="true"><ClipboardList size={31} /></span><div><h2 id="archived-list-edit-title">Editar Lista</h2><p>Atualize os dados desta lista.</p></div><button className="icon-button area-modal-close" type="button" onClick={() => setIsListEditOpen(false)} aria-label="Fechar"><X size={24} /></button></div>
            <form onSubmit={handleArchivedListEdit}>
              <label className="area-form-field"><span>Nome da Lista <strong>*</strong></span><input data-modal-initial-focus maxLength={50} required value={listEditForm.title} onChange={(event) => setListEditForm((current) => ({ ...current, title: event.target.value }))} /><small>{listEditForm.title.length}/50</small></label>
              <label className="area-form-field"><span>Descrição</span><textarea maxLength={200} rows={3} value={listEditForm.description} onChange={(event) => setListEditForm((current) => ({ ...current, description: event.target.value }))} /><small>{listEditForm.description.length}/200</small></label>
              {actionError ? <p className="area-form-error" role="alert"><AlertCircle size={18} />{actionError}</p> : null}
              <div className="area-modal-actions"><button className="secondary-action" type="button" onClick={() => setIsListEditOpen(false)} disabled={isSaving}>Cancelar</button><button className="primary-action" type="submit" disabled={isSaving || !listEditForm.title.trim()}>{isSaving ? <LoaderCircle className="spin" size={19} /> : null}Salvar alterações</button></div>
            </form>
          </section>
        </div>
      ) : null}

      {selectedTask && !isModalOpen && !isListEditOpen ? <TaskDetails task={selectedTask} listTitle={listTitle} archivedMode={archivedMode} onClose={() => { setSelectedTask(null); if (!archivedMode) void loadTaskContentSummaries() }} onTaskChange={updateSelectedTask} onArchived={() => { setSelectedTask(null); void loadTasks() }} /> : null}
    </section>
  )
}
