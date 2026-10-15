import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  FileText,
  Folder,
  Link2,
  ListChecks,
  LoaderCircle,
  Play,
  Plus,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import areaService, { Area } from '../services/areaService'
import checklistItemService, { ChecklistItem } from '../services/checklistItemService'
import linkService, { Link } from '../services/linkService'
import listService, { List } from '../services/listService'
import taskService, { Task } from '../services/taskService'

const DATA_CHANGED_EVENT = 'focuslist:data-changed'
const DASHBOARD_TASK_LIMIT = 3

type DayPeriod = 'morning' | 'afternoon' | 'night'

const dayPeriodContent: Record<DayPeriod, { greeting: string }> = {
  morning: { greeting: 'Bom dia' },
  afternoon: { greeting: 'Boa tarde' },
  night: { greeting: 'Boa noite' },
}

function getDayPeriod(date: Date): DayPeriod {
  const hour = date.getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'night'
}

type DashboardData = {
  areas: Area[]
  lists: List[]
  tasks: Task[]
  checklistItems: ChecklistItem[]
  links: Link[]
}

type DashboardTask = {
  id: number
  title: string
  listId?: number
  list?: string
  listColor?: string | null
  deadline?: string
  deadlineTone?: 'danger' | 'warning'
  checklistCompleted: number
  checklistTotal: number
  linksTotal: number
}

type AttentionItem = {
  id: 'overdue' | 'today' | 'week'
  count: number
  label: string
  detail: string
  tone: 'danger' | 'warning' | 'info'
}

const emptyDashboardData: DashboardData = {
  areas: [],
  lists: [],
  tasks: [],
  checklistItems: [],
  links: [],
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateKeyFromDueDate(value: string | null) {
  return value?.slice(0, 10) ?? null
}

function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return date.toISOString().slice(0, 10)
}

function formatDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)))
}

function formatDeadline(dateKey: string, todayKey: string) {
  if (dateKey === todayKey) return 'Hoje'
  if (dateKey === addDays(todayKey, 1)) return 'Amanhã'
  return formatDateKey(dateKey)
}

function ListBadge({ color, name }: { color?: string | null; name: string }) {
  return (
    <span className="task-list">
      <Folder className="task-list-icon" size={20} fill={color ?? '#269cff'} color={color ?? '#269cff'} strokeWidth={1.5} aria-hidden="true" />
      {name}
    </span>
  )
}

function SectionHeading({
  icon: Icon,
  id,
  tone,
  title,
  description,
}: {
  icon: typeof Play
  id: string
  tone: string
  title: string
  description: string
}) {
  return (
    <div className="dashboard-section-heading">
      <span className={`section-icon is-${tone}`} aria-hidden="true">
        <Icon size={27} fill={tone === 'progress' ? 'currentColor' : 'none'} strokeWidth={1.9} />
      </span>
      <div>
        <h2 id={id}>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  )
}

function TaskMetadata({ task }: { task: DashboardTask }) {
  if (task.checklistTotal === 0 && task.linksTotal === 0) return null
  return (
    <small className="dashboard-task-metadata">
      {task.checklistTotal > 0 ? <span><ListChecks size={13} />{task.checklistCompleted}/{task.checklistTotal}</span> : null}
      {task.linksTotal > 0 ? <span><Link2 size={13} />{task.linksTotal}</span> : null}
    </small>
  )
}

function TaskTable({ tasks, onOpen, showDeadline = false }: { tasks: DashboardTask[]; onOpen: (task: DashboardTask) => void; showDeadline?: boolean }) {
  return (
    <div className={`task-table ${showDeadline ? 'has-deadline' : ''}`} role="table">
      <div className="task-table-header" role="row">
        <span role="columnheader">Tarefa</span>
        <span role="columnheader">Lista</span>
        {showDeadline ? <span role="columnheader">Prazo</span> : null}
        <span aria-hidden="true" />
      </div>
      {tasks.length === 0 ? <p className="dashboard-table-empty">Nenhuma tarefa nesta seção.</p> : null}
      {tasks.map((task) => (
        <button className="task-row" type="button" role="row" key={task.id} onClick={() => onOpen(task)}>
          <span className="dashboard-task-title" role="cell"><strong>{task.title}</strong><TaskMetadata task={task} /></span>
          <span role="cell">{task.list ? <ListBadge color={task.listColor} name={task.list} /> : null}</span>
          {showDeadline ? <span className={task.deadlineTone ? `deadline is-${task.deadlineTone}` : 'deadline'} role="cell">{task.deadline}</span> : null}
          <ChevronRight size={21} aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [data, setData] = useState<DashboardData>(emptyDashboardData)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const dayPeriod = getDayPeriod(currentDate)

  const loadDashboard = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setLoadError('')
    try {
      const [areas, lists, tasks, checklistItems, links] = await Promise.all([
        areaService.getAll(), listService.getAll(), taskService.getAll(), checklistItemService.getAll(), linkService.getAll(),
      ])
      setData({ areas, lists, tasks, checklistItems, links })
    } catch {
      setLoadError('Não foi possível carregar os dados do Dashboard.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void loadDashboard() }, [loadDashboard])

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentDate(new Date()), 60_000)
    const handleDataChanged = () => void loadDashboard(false)
    const handleFocus = () => void loadDashboard(false)
    window.addEventListener(DATA_CHANGED_EVENT, handleDataChanged)
    window.addEventListener('focus', handleFocus)
    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener(DATA_CHANGED_EVENT, handleDataChanged)
      window.removeEventListener('focus', handleFocus)
    }
  }, [loadDashboard])

  const dashboard = useMemo(() => {
    const todayKey = toDateKey(currentDate)
    const weekKey = addDays(todayKey, 7)
    const listsById = new Map(data.lists.map((list) => [list.id, list]))
    const areasById = new Map(data.areas.map((area) => [area.id, area]))
    const checklistByTask = new Map<number, ChecklistItem[]>()
    const linksByTask = new Map<number, Link[]>()

    data.checklistItems.forEach((item) => checklistByTask.set(item.taskId, [...(checklistByTask.get(item.taskId) ?? []), item]))
    data.links.forEach((link) => linksByTask.set(link.taskId, [...(linksByTask.get(link.taskId) ?? []), link]))

    const toDashboardTask = (task: Task): DashboardTask => {
      const list = listsById.get(task.listId)
      const area = list ? areasById.get(list.areaId) : undefined
      const checklist = checklistByTask.get(task.id) ?? []
      const taskLinks = linksByTask.get(task.id) ?? []
      const dueDateKey = dateKeyFromDueDate(task.dueDate)
      return {
        id: task.id,
        title: task.title,
        listId: list?.id,
        list: list?.title,
        listColor: area?.color,
        deadline: dueDateKey ? formatDeadline(dueDateKey, todayKey) : undefined,
        deadlineTone: dueDateKey === todayKey ? 'danger' : dueDateKey === addDays(todayKey, 1) ? 'warning' : undefined,
        checklistCompleted: checklist.filter((item) => item.completed).length,
        checklistTotal: checklist.length,
        linksTotal: taskLinks.length,
      }
    }

    const pendingTasks = data.tasks.filter((task) => !task.completed)
    const tasksWithDueDate = pendingTasks.filter((task) => dateKeyFromDueDate(task.dueDate) !== null)
    const overdue = tasksWithDueDate.filter((task) => dateKeyFromDueDate(task.dueDate)! < todayKey)
    const today = tasksWithDueDate.filter((task) => dateKeyFromDueDate(task.dueDate) === todayKey)
    const week = tasksWithDueDate.filter((task) => {
      const dueDateKey = dateKeyFromDueDate(task.dueDate)!
      return dueDateKey > todayKey && dueDateKey <= weekKey
    })
    const upcoming = tasksWithDueDate
      .filter((task) => dateKeyFromDueDate(task.dueDate)! >= todayKey && dateKeyFromDueDate(task.dueDate)! <= weekKey)
      .sort((first, second) => dateKeyFromDueDate(first.dueDate)!.localeCompare(dateKeyFromDueDate(second.dueDate)!))
      .slice(0, DASHBOARD_TASK_LIMIT)
      .map(toDashboardTask)
    const inProgress = [...pendingTasks]
      .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))
      .slice(0, DASHBOARD_TASK_LIMIT)
      .map(toDashboardTask)
    const earliestOverdue = overdue.map((task) => dateKeyFromDueDate(task.dueDate)!).sort()[0]
    const attentionItems: AttentionItem[] = [
      { id: 'overdue', count: overdue.length, label: 'vencidas', detail: earliestOverdue ? `Desde ${formatDateKey(earliestOverdue)}` : 'Nenhuma vencida', tone: 'danger' },
      { id: 'today', count: today.length, label: 'vencem hoje', detail: formatDateKey(todayKey), tone: 'warning' },
      { id: 'week', count: week.length, label: 'vencem nos próximos 7 dias', detail: `Até ${formatDateKey(weekKey)}`, tone: 'info' },
    ]
    return { attentionItems, inProgress, upcoming }
  }, [currentDate, data])

  const formattedDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    .format(currentDate).replace(/^(\w)/, (letter) => letter.toUpperCase()).replace(/\./g, '')

  const openTask = (task: DashboardTask) => {
    const list = data.lists.find((item) => item.id === task.listId)
    if (list) navigate(`/areas/${list.areaId}/listas/${list.id}`, { state: { taskId: task.id } })
  }

  const renderHero = () => (
    <div className={`dashboard-hero is-${dayPeriod}`}>
      <div className="hero-stars" aria-hidden="true" />
      <div className="hero-mountain hero-mountain-back" aria-hidden="true" />
      <div className="hero-mountain hero-mountain-front" aria-hidden="true" />
      <p className="dashboard-date"><CalendarDays size={20} aria-hidden="true" />{formattedDate}</p>
      <h1 id="dashboard-title">{dayPeriodContent[dayPeriod].greeting}, <span>Isaac.</span></h1>
    </div>
  )

  if (isLoading) {
    return <section className="dashboard" aria-labelledby="dashboard-title">{renderHero()}<div className="dashboard-state" aria-live="polite"><LoaderCircle className="spin" size={34} aria-hidden="true" /><h2>Carregando Dashboard...</h2><p>Aguarde enquanto buscamos os dados mais recentes.</p></div></section>
  }

  if (loadError) {
    return <section className="dashboard" aria-labelledby="dashboard-title">{renderHero()}<div className="dashboard-state is-error" role="alert"><AlertCircle size={38} aria-hidden="true" /><h2>Erro ao carregar</h2><p>{loadError}</p><button className="secondary-action" type="button" onClick={() => void loadDashboard()}>Tentar novamente</button></div></section>
  }

  if (data.tasks.length === 0) {
    const hasAreas = data.areas.length > 0
    const hasLists = data.lists.length > 0
    const title = !hasAreas ? 'Crie sua primeira Área' : !hasLists ? 'Crie sua primeira Lista' : 'Crie sua primeira Tarefa'
    const description = !hasAreas ? 'Comece organizando um contexto da sua vida, como Trabalho ou Estudos.' : !hasLists ? 'Abra uma Área e crie uma Lista para agrupar suas tarefas.' : 'Sua estrutura está pronta. Adicione uma tarefa para acompanhar o que precisa ser feito.'
    const action = !hasAreas ? () => window.dispatchEvent(new Event('focuslist:open-area-form')) : !hasLists ? () => navigate(`/areas/${data.areas[0].id}`) : () => navigate(`/areas/${data.lists[0].areaId}/listas/${data.lists[0].id}`)
    return (
      <section className="dashboard" aria-labelledby="dashboard-title">
        {renderHero()}
        <div className="dashboard-state dashboard-empty-state">
          <span className="dashboard-state-icon" aria-hidden="true">{!hasAreas ? <Folder size={38} /> : !hasLists ? <ListChecks size={38} /> : <FileText size={38} />}</span>
          <h2>{title}</h2><p>{description}</p>
          <button className="primary-action" type="button" onClick={action}><Plus size={20} />{title}</button>
        </div>
      </section>
    )
  }

  return (
    <section className="dashboard" aria-labelledby="dashboard-title">
      {renderHero()}
      <section className="dashboard-card attention-card" aria-labelledby="attention-title">
        <div className="dashboard-card-topline"><SectionHeading id="attention-title" icon={AlertCircle} tone="attention" title="Atenção" description="Tarefas que precisam da sua atenção agora." /></div>
        <div className="attention-grid">{dashboard.attentionItems.map((item) => <div className={`attention-item is-${item.tone}`} key={item.id}><strong>{item.count}</strong><span className="attention-copy"><span>{item.label}</span><small>{item.detail}</small></span><span className="attention-arrow" aria-hidden="true"><ChevronRight size={26} /></span></div>)}</div>
      </section>
      <div className="dashboard-columns">
        <section className="dashboard-card tasks-card" aria-labelledby="progress-title">
          <div className="dashboard-card-topline"><SectionHeading id="progress-title" icon={Play} tone="progress" title="Em andamento" description="Tarefas pendentes, ordenadas pela atualização mais recente." /></div>
          <TaskTable tasks={dashboard.inProgress} onOpen={openTask} />
        </section>
        <section className="dashboard-card tasks-card" aria-labelledby="upcoming-title">
          <div className="dashboard-card-topline"><SectionHeading id="upcoming-title" icon={CalendarDays} tone="upcoming" title="Próximos prazos" description="Tarefas que vencem nos próximos 7 dias." /></div>
          <TaskTable tasks={dashboard.upcoming} onOpen={openTask} showDeadline />
        </section>
      </div>
    </section>
  )
}
