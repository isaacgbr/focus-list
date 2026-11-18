import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleDashed,
  FileText,
  Folder,
  LayoutGrid,
  Link2,
  ListChecks,
  ListTodo,
  LoaderCircle,
  Pencil,
  Play,
  Plus,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import dashboardService, { type DashboardSummary, type DashboardTask as DashboardApiTask } from '../services/dashboardService'
import { useAuth } from '../auth/AuthContext'
import listService from '../services/listService'
import taskService, { type TaskPriority } from '../services/taskService'
import { matchesTaskAttention, type AttentionFilter } from '../utils/taskAttention'
import { getStoredHeroTheme, storeHeroTheme, heroThemeOptions, type DayPeriod, type HeroTheme } from '../utils/dashboardTheme'

const DATA_CHANGED_EVENT = 'focuslist:data-changed'
const DASHBOARD_AREA_LIMIT = 6

const dayPeriodContent: Record<DayPeriod, { greeting: string }> = {
  morning: { greeting: 'Bom dia' },
  afternoon: { greeting: 'Boa tarde' },
  night: { greeting: 'Boa noite' },
}

function getDayPeriod(date: Date): DayPeriod {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'night'
}

type DashboardTask = {
  id: number
  title: string
  listId?: number
  areaId?: number
  list?: string
  listColor?: string | null
  deadline?: string
  deadlineTone?: 'danger' | 'warning'
  checklistCompleted: number
  checklistTotal: number
  linksTotal: number
}

const priorityLabels: Record<TaskPriority, string> = { HIGH: 'Alta', MEDIUM: 'Média', LOW: 'Baixa' }

function useMobileDashboard() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 650px)').matches)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 650px)')
    const update = () => setIsMobile(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return isMobile
}

type AttentionItem = {
  id: AttentionFilter
  count: number
  label: string
  detail: string
  tone: 'danger' | 'warning' | 'info'
}

type AreaSummary = {
  id: number
  title: string
  color: string | null
  listsTotal: number
  tasksTotal: number
}

const emptyDashboardData: DashboardSummary = {
  attention: { overdue: 0, today: 0, week: 0, earliestOverdue: null },
  inProgress: [],
  upcoming: [],
  overview: { total: 0, pending: 0, completed: 0, completionPercentage: 0 },
  areas: [],
  firstAreaId: null,
  firstList: null,
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

function AttentionIcon({ id }: { id: AttentionItem['id'] }) {
  if (id === 'week') return <CalendarRange size={17} strokeWidth={1.9} />
  if (id === 'today') return <CalendarDays size={17} strokeWidth={1.9} />
  return <AlertCircle size={17} strokeWidth={1.9} />
}

function TaskTable({ tasks, onOpen, showDeadline = false }: { tasks: DashboardTask[]; onOpen: (task: DashboardTask) => void; showDeadline?: boolean }) {
  return (
    <div className={`task-table ${showDeadline ? 'has-deadline' : ''}`}>
      <div className="task-table-header" aria-hidden="true">
        <span>Tarefa</span>
        <span>Lista</span>
        {showDeadline ? <span>Prazo</span> : null}
        <span aria-hidden="true" />
      </div>
      {tasks.length === 0 ? <p className="dashboard-table-empty">Nenhuma tarefa nesta seção.</p> : null}
      {tasks.map((task) => (
        <button className="task-row" type="button" key={task.id} onClick={() => onOpen(task)} aria-label={`Abrir ${task.title}${task.list ? `, lista ${task.list}` : ''}${task.deadline ? `, prazo ${task.deadline}` : ''}`}>
          <span className="dashboard-task-title"><strong>{task.title}</strong><TaskMetadata task={task} /></span>
          <span>{task.list ? <ListBadge color={task.listColor} name={task.list} /> : null}</span>
          {showDeadline ? <span className={task.deadlineTone ? `deadline is-${task.deadlineTone}` : 'deadline'}>{task.deadline}</span> : null}
          <ChevronRight size={21} aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}

function MobileTaskItem({ task, onOpen, priority, upcoming = false }: {
  task: DashboardTask
  onOpen: (task: DashboardTask) => void
  priority?: TaskPriority | null
  upcoming?: boolean
}) {
  return (
    <button className={`mobile-dashboard-task${upcoming ? ' is-upcoming' : ''}`} type="button" onClick={() => onOpen(task)}>
      <span className="mobile-dashboard-task-copy">
        <strong>{task.title}</strong>
        {task.list ? <span><Folder size={14} fill={task.listColor ?? '#269cff'} color={task.listColor ?? '#269cff'} />{task.list}</span> : null}
      </span>
      <span className="mobile-dashboard-task-meta">
        {priority ? <span className={`mobile-priority is-${priority.toLowerCase()}`}>{priorityLabels[priority]}</span> : null}
        {task.deadline ? <span className={task.deadlineTone ? `mobile-deadline is-${task.deadlineTone}` : 'mobile-deadline'}><CalendarDays size={13} />{task.deadline}</span> : null}
        {!upcoming ? <TaskMetadata task={task} /> : null}
      </span>
      <ChevronRight size={18} aria-hidden="true" />
    </button>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMobileDashboard = useMobileDashboard()
  const firstName = user?.name?.trim().split(/\s+/)[0]
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const currentDateKey = toDateKey(currentDate)
  const [heroTheme, setHeroTheme] = useState<HeroTheme>(getStoredHeroTheme)
  const [isThemePopoverOpen, setIsThemePopoverOpen] = useState(false)
  const [areAreasExpanded, setAreAreasExpanded] = useState(false)
  const [data, setData] = useState<DashboardSummary>(emptyDashboardData)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [attentionFilter, setAttentionFilter] = useState<AttentionFilter | null>(null)
  const [attentionTasks, setAttentionTasks] = useState<DashboardTask[]>([])
  const [attentionLoading, setAttentionLoading] = useState(false)
  const [attentionError, setAttentionError] = useState('')
  const [attentionAttempt, setAttentionAttempt] = useState(0)
  const [mobilePriorities, setMobilePriorities] = useState<Map<number, TaskPriority | null>>(() => new Map())
  const heroThemeControlRef = useRef<HTMLDivElement>(null)
  const heroThemeButtonRef = useRef<HTMLButtonElement>(null)
  const dayPeriod = getDayPeriod(currentDate)
  const coverPeriod = heroTheme === 'auto' ? dayPeriod : heroTheme

  const selectHeroTheme = (theme: HeroTheme) => {
    setHeroTheme(theme)
    storeHeroTheme(theme)
    setIsThemePopoverOpen(false)
    window.requestAnimationFrame(() => heroThemeButtonRef.current?.focus())
  }

  const loadDashboard = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setLoadError('')
    try {
      setData(await dashboardService.getSummary(currentDateKey))
    } catch {
      setLoadError('Não foi possível carregar os dados do Dashboard.')
    } finally {
      setIsLoading(false)
    }
  }, [currentDateKey])

  useEffect(() => { void loadDashboard() }, [loadDashboard])

  useEffect(() => {
    if (!isMobileDashboard || data.overview.total === 0) return
    let active = true
    void taskService.getAll().then((tasks) => {
      if (active) setMobilePriorities(new Map(tasks.map((task) => [task.id, task.priority])))
    }).catch(() => {
      if (active) setMobilePriorities(new Map())
    })
    return () => { active = false }
  }, [isMobileDashboard, data])

  useEffect(() => {
    if (!attentionFilter) return
    let active = true
    setAttentionLoading(true)
    setAttentionError('')
    // Os contadores não se limitam às três tarefas exibidas no resumo.
    void Promise.all([taskService.getAll(), listService.getAll()]).then(([tasks, lists]) => {
      if (!active) return
      const listsById = new Map(lists.map((list) => [list.id, list]))
      const areasById = new Map(data.areas.map((area) => [area.id, area]))
      const filtered = tasks.filter((task) => matchesTaskAttention(task, attentionFilter, currentDateKey))
        .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!) || a.title.localeCompare(b.title))
        .flatMap((task): DashboardTask[] => {
          const list = listsById.get(task.listId)
          if (!list) return []
          return [{ id: task.id, title: task.title, listId: list.id, areaId: list.areaId, list: list.title,
            listColor: areasById.get(list.areaId)?.color, deadline: formatDeadline(task.dueDate!.slice(0, 10), currentDateKey),
            deadlineTone: attentionFilter === 'overdue' ? 'danger' : undefined,
            checklistCompleted: 0, checklistTotal: 0, linksTotal: 0 }]
        })
      setAttentionTasks(filtered)
    }).catch(() => {
      if (active) setAttentionError('Não foi possível carregar estas tarefas.')
    }).finally(() => { if (active) setAttentionLoading(false) })
    return () => { active = false }
  }, [attentionFilter, attentionAttempt, currentDateKey, data])

  useEffect(() => {
    if (!isThemePopoverOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!heroThemeControlRef.current?.contains(event.target as Node)) setIsThemePopoverOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsThemePopoverOpen(false)
      heroThemeButtonRef.current?.focus()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.requestAnimationFrame(() => heroThemeControlRef.current?.querySelector<HTMLButtonElement>('.hero-theme-option.is-active')?.focus())
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isThemePopoverOpen])

  useEffect(() => {
    if (data.areas.length <= DASHBOARD_AREA_LIMIT) setAreAreasExpanded(false)
  }, [data.areas.length])

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
    const todayKey = currentDateKey
    const weekKey = addDays(todayKey, 7)
    const toDashboardTask = (task: DashboardApiTask): DashboardTask => {
      const dueDateKey = dateKeyFromDueDate(task.dueDate)
      return {
        id: task.id,
        title: task.title,
        listId: task.listId,
        areaId: task.areaId,
        list: task.listTitle,
        listColor: task.listColor,
        deadline: dueDateKey ? formatDeadline(dueDateKey, todayKey) : undefined,
        deadlineTone: dueDateKey === todayKey ? 'danger' : dueDateKey === addDays(todayKey, 1) ? 'warning' : undefined,
        checklistCompleted: task.checklistCompleted,
        checklistTotal: task.checklistTotal,
        linksTotal: task.linksTotal,
      }
    }

    const upcoming = data.upcoming.map(toDashboardTask)
    const inProgress = data.inProgress.map(toDashboardTask)
    const earliestOverdue = dateKeyFromDueDate(data.attention.earliestOverdue)
    const attentionItems: AttentionItem[] = [
      { id: 'overdue', count: data.attention.overdue, label: 'vencidas', detail: earliestOverdue ? `Desde ${formatDateKey(earliestOverdue)}` : 'Nenhuma vencida', tone: 'danger' },
      { id: 'today', count: data.attention.today, label: 'vencem hoje', detail: formatDateKey(todayKey), tone: 'warning' },
      { id: 'week', count: data.attention.week, label: 'vencem nos próximos 7 dias', detail: `Até ${formatDateKey(weekKey)}`, tone: 'info' },
    ]
    const areaSummaries: AreaSummary[] = data.areas
    return { attentionItems, inProgress, upcoming, overview: data.overview, areaSummaries }
  }, [currentDateKey, data])

  const formattedDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    .format(currentDate).replace(/^(\w)/, (letter) => letter.toUpperCase()).replace(/\./g, '')

  const openTask = (task: DashboardTask) => {
    if (task.areaId && task.listId) navigate(`/app/areas/${task.areaId}/listas/${task.listId}`, { state: { taskId: task.id } })
  }

  const visibleAreaSummaries = areAreasExpanded ? dashboard.areaSummaries : dashboard.areaSummaries.slice(0, DASHBOARD_AREA_LIMIT)

  const renderHero = () => (
    <div className={`dashboard-hero is-${coverPeriod}`}>
      <div className="hero-stars" aria-hidden="true" />
      <div className="hero-mountain hero-mountain-back" aria-hidden="true" />
      <div className="hero-mountain hero-mountain-front" aria-hidden="true" />
      <div className="dashboard-hero-copy">
        <p className="dashboard-date"><CalendarDays size={20} aria-hidden="true" />{formattedDate}</p>
        <h1 id="dashboard-title">{dayPeriodContent[dayPeriod].greeting}{firstName ? <>, <span>{firstName}.</span></> : '.'}</h1>
      </div>
      <div className="hero-cover-control" ref={heroThemeControlRef}>
        <button ref={heroThemeButtonRef} className="hero-cover-button" type="button" aria-label="Personalizar capa" aria-haspopup="dialog" aria-expanded={isThemePopoverOpen} aria-controls="hero-cover-popover" onClick={() => setIsThemePopoverOpen((current) => !current)}>
          <Pencil size={15} aria-hidden="true" />
        </button>
        {isThemePopoverOpen ? (
          <div className="hero-cover-popover" id="hero-cover-popover" role="dialog" aria-label="Personalizar capa">
            <strong>Personalizar capa</strong>
            <div className="hero-theme-options" role="radiogroup" aria-label="Tema da capa">
              {heroThemeOptions.map((option) => (
                <button className={`hero-theme-option ${heroTheme === option.value ? 'is-active' : ''}`} type="button" role="radio" aria-checked={heroTheme === option.value} onClick={() => selectHeroTheme(option.value)} key={option.value}>
                  <span>{option.label}</span>
                  {heroTheme === option.value ? <Check size={14} aria-hidden="true" /> : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )

  const renderMobileHero = () => (
    <div className="mobile-dashboard-hero">
      <div>
        <p>{formattedDate}</p>
        <h1 id="dashboard-title">{dayPeriodContent[dayPeriod].greeting}{firstName ? <>, <span>{firstName}.</span></> : '.'}</h1>
      </div>
      <div className="mobile-dashboard-progress" aria-label={`${dashboard.overview.completionPercentage}% das tarefas concluídas`}>
        <span><strong>{dashboard.overview.completionPercentage}%</strong><small>concluído</small></span>
        <div aria-hidden="true"><span style={{ width: `${dashboard.overview.completionPercentage}%` }} /></div>
        <small>{dashboard.overview.completed} de {dashboard.overview.total} tarefas</small>
      </div>
    </div>
  )

  if (isLoading) {
    return <section className={`dashboard${isMobileDashboard ? ' mobile-dashboard' : ''}`} aria-labelledby="dashboard-title">{isMobileDashboard ? renderMobileHero() : renderHero()}<div className="dashboard-state" aria-live="polite"><LoaderCircle className="spin" size={34} aria-hidden="true" /><h2>Carregando Dashboard...</h2><p>Aguarde enquanto buscamos os dados mais recentes.</p></div></section>
  }

  if (loadError) {
    return <section className={`dashboard${isMobileDashboard ? ' mobile-dashboard' : ''}`} aria-labelledby="dashboard-title">{isMobileDashboard ? renderMobileHero() : renderHero()}<div className="dashboard-state is-error" role="alert"><AlertCircle size={38} aria-hidden="true" /><h2>Erro ao carregar</h2><p>{loadError}</p><button className="secondary-action" type="button" onClick={() => void loadDashboard()}>Tentar novamente</button></div></section>
  }

  if (data.overview.total === 0) {
    const hasAreas = data.areas.length > 0
    const hasLists = data.firstList !== null
    const title = !hasAreas ? 'Crie sua primeira Área' : !hasLists ? 'Crie sua primeira Lista' : 'Crie sua primeira Tarefa'
    const description = !hasAreas ? 'Comece organizando um contexto da sua vida, como Trabalho ou Estudos.' : !hasLists ? 'Abra uma Área e crie uma Lista para agrupar suas tarefas.' : 'Sua estrutura está pronta. Adicione uma tarefa para acompanhar o que precisa ser feito.'
    const action = !hasAreas ? () => window.dispatchEvent(new Event('focuslist:open-area-form')) : !hasLists ? () => navigate(`/app/areas/${data.firstAreaId}`) : () => navigate(`/app/areas/${data.firstList!.areaId}/listas/${data.firstList!.id}`)
    return (
      <section className={`dashboard${isMobileDashboard ? ' mobile-dashboard' : ''}`} aria-labelledby="dashboard-title">
        {isMobileDashboard ? renderMobileHero() : renderHero()}
        <div className="dashboard-state dashboard-empty-state">
          <span className="dashboard-state-icon" aria-hidden="true">{!hasAreas ? <Folder size={38} /> : !hasLists ? <ListChecks size={38} /> : <FileText size={38} />}</span>
          <h2>{title}</h2><p>{description}</p>
          <button className="primary-action" type="button" onClick={action}><Plus size={20} />{title}</button>
        </div>
      </section>
    )
  }

  if (isMobileDashboard) {
    const selectedAttentionLabel = dashboard.attentionItems.find((item) => item.id === attentionFilter)?.label
    return (
      <section className="dashboard mobile-dashboard" aria-labelledby="dashboard-title">
        {renderMobileHero()}

        <section className="mobile-dashboard-section mobile-dashboard-summary" aria-labelledby="mobile-summary-title">
          <div className="mobile-dashboard-section-heading">
            <h2 id="mobile-summary-title">Resumo</h2>
          </div>
          <div className="mobile-dashboard-metrics">
            <div className="mobile-dashboard-metric is-pending"><CircleDashed size={18} aria-hidden="true" /><span><strong>{dashboard.overview.pending}</strong><small>Pendentes</small></span></div>
            <div className="mobile-dashboard-metric is-completed"><CheckCircle2 size={18} aria-hidden="true" /><span><strong>{dashboard.overview.completed}</strong><small>Concluídas</small></span></div>
            <button className={`mobile-dashboard-metric is-today${attentionFilter === 'today' ? ' is-active' : ''}`} type="button" aria-expanded={attentionFilter === 'today'} aria-controls="mobile-attention-tasks" onClick={() => setAttentionFilter((current) => current === 'today' ? null : 'today')}><CalendarDays size={18} aria-hidden="true" /><span><strong>{data.attention.today}</strong><small>Para hoje</small></span></button>
            <button className={`mobile-dashboard-metric is-overdue${attentionFilter === 'overdue' ? ' is-active' : ''}`} type="button" aria-expanded={attentionFilter === 'overdue'} aria-controls="mobile-attention-tasks" onClick={() => setAttentionFilter((current) => current === 'overdue' ? null : 'overdue')}><AlertCircle size={18} aria-hidden="true" /><span><strong>{data.attention.overdue}</strong><small>Vencidas</small></span></button>
          </div>
          {attentionFilter ? (
            <div className="mobile-dashboard-attention" id="mobile-attention-tasks" aria-label={`Tarefas ${selectedAttentionLabel}`} aria-live="polite" aria-busy={attentionLoading}>
              {attentionLoading ? <p><LoaderCircle className="spin" size={17} />Carregando tarefas...</p> : attentionError ? <p role="alert">{attentionError}</p> : attentionTasks.length === 0 ? <p>Nenhuma tarefa {selectedAttentionLabel}.</p> : attentionTasks.map((task) => <MobileTaskItem task={task} onOpen={openTask} priority={mobilePriorities.get(task.id)} upcoming key={task.id} />)}
            </div>
          ) : null}
        </section>

        <section className="mobile-dashboard-section" aria-labelledby="mobile-progress-title">
          <div className="mobile-dashboard-section-heading"><h2 id="mobile-progress-title">Em andamento</h2><span>{dashboard.inProgress.length}</span></div>
          <div className="mobile-dashboard-task-list">
            {dashboard.inProgress.length === 0 ? <p className="mobile-dashboard-empty">Nenhuma tarefa pendente.</p> : dashboard.inProgress.map((task) => <MobileTaskItem task={task} onOpen={openTask} priority={mobilePriorities.get(task.id)} key={task.id} />)}
          </div>
        </section>

        <section className="mobile-dashboard-section" aria-labelledby="mobile-upcoming-title">
          <div className="mobile-dashboard-section-heading"><h2 id="mobile-upcoming-title">Próximas tarefas</h2><CalendarRange size={18} aria-hidden="true" /></div>
          <div className="mobile-dashboard-task-list">
            {dashboard.upcoming.length === 0 ? <p className="mobile-dashboard-empty">Nenhum prazo nos próximos 7 dias.</p> : dashboard.upcoming.map((task) => <MobileTaskItem task={task} onOpen={openTask} priority={mobilePriorities.get(task.id)} upcoming key={task.id} />)}
          </div>
        </section>
      </section>
    )
  }

  return (
    <section className="dashboard" aria-labelledby="dashboard-title">
      {renderHero()}
      <section className="dashboard-card attention-card" aria-labelledby="attention-title">
        <div className="dashboard-card-topline"><SectionHeading id="attention-title" icon={AlertCircle} tone="attention" title="Atenção" description="Tarefas que precisam da sua atenção agora." /></div>
        <div className="attention-grid">{dashboard.attentionItems.map((item) => <button type="button" className={`attention-item is-${item.tone}${item.count === 0 ? ' is-empty' : ''}`} key={item.id} aria-expanded={attentionFilter === item.id} aria-controls="attention-tasks" onClick={() => setAttentionFilter((current) => current === item.id ? null : item.id)}><span className="attention-status-icon" aria-hidden="true"><AttentionIcon id={item.id} /></span><strong>{item.count}</strong><span className="attention-copy"><span>{item.label}</span><small>{item.detail}</small></span><ChevronRight className="attention-arrow" size={17} aria-hidden="true" /></button>)}</div>
        {attentionFilter ? <section className="attention-results" id="attention-tasks" aria-label={`Tarefas ${dashboard.attentionItems.find((item) => item.id === attentionFilter)?.label}`} aria-live="polite" aria-busy={attentionLoading}>
          {attentionLoading ? <p className="dashboard-table-empty"><LoaderCircle className="spin" size={18} aria-hidden="true" /> Carregando tarefas...</p> : attentionError ? <div role="alert"><p>{attentionError}</p><button type="button" className="secondary-action" onClick={() => setAttentionAttempt((current) => current + 1)}>Tentar novamente</button></div> : <TaskTable tasks={attentionTasks} onOpen={openTask} showDeadline />}
        </section> : null}
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
      <div className="dashboard-insights">
        <section className="dashboard-card overview-card" aria-labelledby="overview-title">
          <div className="dashboard-card-topline"><SectionHeading id="overview-title" icon={LayoutGrid} tone="overview" title="Visão geral" description="Panorama das suas tarefas." /></div>
          <div className="overview-metrics">
            <div><span className="overview-metric-icon is-total"><ListTodo size={17} /></span><span><strong>{dashboard.overview.total}</strong><small>Total de tarefas</small></span></div>
            <div><span className="overview-metric-icon is-pending"><CircleDashed size={17} /></span><span><strong>{dashboard.overview.pending}</strong><small>Pendentes</small></span></div>
            <div><span className="overview-metric-icon is-completed"><CheckCircle2 size={17} /></span><span><strong>{dashboard.overview.completed}</strong><small>Concluídas</small></span></div>
          </div>
        </section>
        <section className="dashboard-card areas-card" aria-labelledby="areas-title">
          <div className="dashboard-card-topline"><SectionHeading id="areas-title" icon={Folder} tone="areas" title="Áreas e listas" description="Como suas tarefas estão distribuídas." /></div>
          <div className={`dashboard-area-list ${areAreasExpanded ? 'is-expanded' : ''}`}>
            {dashboard.areaSummaries.length === 0 ? <p className="dashboard-table-empty">Nenhuma Área criada.</p> : null}
            {visibleAreaSummaries.map((area) => (
              <button className="dashboard-area-row" type="button" onClick={() => navigate(`/app/areas/${area.id}`)} key={area.id}>
                <span className="dashboard-area-mark" style={{ '--area-color': area.color ?? '#269cff' } as CSSProperties}><Folder size={18} fill="currentColor" /></span>
                <span className="dashboard-area-copy"><strong>{area.title}</strong><small>{area.listsTotal} {area.listsTotal === 1 ? 'lista' : 'listas'} · {area.tasksTotal} {area.tasksTotal === 1 ? 'tarefa' : 'tarefas'}</small></span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
          {dashboard.areaSummaries.length > DASHBOARD_AREA_LIMIT ? (
            <button className="dashboard-area-toggle" type="button" aria-expanded={areAreasExpanded} onClick={() => setAreAreasExpanded((current) => !current)}>
              {areAreasExpanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
              {areAreasExpanded ? 'Recolher' : 'Ver todas'}
              <span>{dashboard.areaSummaries.length}</span>
            </button>
          ) : null}
        </section>
      </div>
    </section>
  )
}
