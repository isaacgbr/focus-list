import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  FileText,
  Folder,
  Play,
} from 'lucide-react'

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

type ListColor = 'purple' | 'blue' | 'green'

type DashboardTask = {
  id: number
  title: string
  list?: string
  listColor?: ListColor
  deadline?: string
  deadlineTone?: 'danger' | 'warning'
}

const attentionItems = [
  { id: 1, count: 2, label: 'vencidas', detail: 'Desde 10/10', tone: 'danger' },
  { id: 2, count: 3, label: 'vencem hoje', detail: '13/10', tone: 'warning' },
  { id: 3, count: 2, label: 'vencem nos próximos 7 dias', detail: 'Até 20/10', tone: 'info' },
] as const

const inProgressTasks: DashboardTask[] = [
  { id: 1, title: 'Estudar Java', list: 'Faculdade', listColor: 'purple' },
  { id: 2, title: 'Atualizar currículo', list: 'Trabalho', listColor: 'blue' },
  { id: 3, title: 'Planejar viagem', list: 'Viagem', listColor: 'green' },
]

const upcomingTasks: DashboardTask[] = [
  { id: 1, title: 'Entregar atividade', list: 'Faculdade', listColor: 'purple', deadline: 'Hoje', deadlineTone: 'danger' },
  { id: 2, title: 'Enviar relatório', list: 'Trabalho', listColor: 'blue', deadline: 'Amanhã', deadlineTone: 'warning' },
  { id: 3, title: 'Comprar passagens', list: 'Viagem', listColor: 'green', deadline: '15/10' },
]

const standaloneTasks: DashboardTask[] = [
  { id: 1, title: 'Comprar pilhas' },
  { id: 2, title: 'Ler artigo sobre produtividade' },
  { id: 3, title: 'Organizar documentos' },
]

function ListBadge({ color, name }: { color: ListColor; name: string }) {
  return (
    <span className="task-list">
      <Folder className={`task-list-icon is-${color}`} size={20} fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
      {name}
    </span>
  )
}

function SeeAllLink() {
  return (
    <button className="see-all" type="button">
      Ver todas
      <ArrowRight size={19} aria-hidden="true" />
    </button>
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

function TaskTable({ tasks, showDeadline = false }: { tasks: DashboardTask[]; showDeadline?: boolean }) {
  return (
    <div className={`task-table ${showDeadline ? 'has-deadline' : ''}`} role="table">
      <div className="task-table-header" role="row">
        <span role="columnheader">Tarefa</span>
        <span role="columnheader">Lista</span>
        {showDeadline ? <span role="columnheader">Prazo</span> : null}
        <span aria-hidden="true" />
      </div>
      {tasks.map((task) => (
        <button className="task-row" type="button" role="row" key={task.id}>
          <strong role="cell">{task.title}</strong>
          <span role="cell">{task.list && task.listColor ? <ListBadge color={task.listColor} name={task.list} /> : null}</span>
          {showDeadline ? (
            <span className={task.deadlineTone ? `deadline is-${task.deadlineTone}` : 'deadline'} role="cell">
              {task.deadline}
            </span>
          ) : null}
          <ChevronRight size={21} aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}

export function Dashboard() {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const dayPeriod = getDayPeriod(currentDate)

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentDate(new Date()), 60_000)

    return () => window.clearInterval(intervalId)
  }, [])

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(currentDate)
    .replace(/^(\w)/, (letter) => letter.toUpperCase())
    .replace(/\./g, '')

  return (
    <section className="dashboard" aria-labelledby="dashboard-title">
      <div className={`dashboard-hero is-${dayPeriod}`}>
        <div className="hero-stars" aria-hidden="true" />
        <div className="hero-mountain hero-mountain-back" aria-hidden="true" />
        <div className="hero-mountain hero-mountain-front" aria-hidden="true" />
        <p className="dashboard-date">
          <CalendarDays size={20} aria-hidden="true" />
          {formattedDate}
        </p>
        <h1 id="dashboard-title">
          {dayPeriodContent[dayPeriod].greeting}, <span>Isaac.</span>
        </h1>
      </div>

      <section className="dashboard-card attention-card" aria-labelledby="attention-title">
        <div className="dashboard-card-topline">
          <SectionHeading id="attention-title" icon={AlertCircle} tone="attention" title="Atenção" description="Tarefas que precisam da sua atenção agora." />
          <SeeAllLink />
        </div>
        <div className="attention-grid">
          {attentionItems.map((item) => (
            <button className={`attention-item is-${item.tone}`} type="button" key={item.id}>
              <strong>{item.count}</strong>
              <span className="attention-copy">
                <span>{item.label}</span>
                <small>{item.detail}</small>
              </span>
              <span className="attention-arrow" aria-hidden="true"><ChevronRight size={26} /></span>
            </button>
          ))}
        </div>
      </section>

      <div className="dashboard-columns">
        <section className="dashboard-card tasks-card" aria-labelledby="progress-title">
          <div className="dashboard-card-topline">
            <SectionHeading id="progress-title" icon={Play} tone="progress" title="Em andamento" description="Tarefas que você já começou ou marcou como em andamento." />
            <SeeAllLink />
          </div>
          <TaskTable tasks={inProgressTasks} />
        </section>

        <section className="dashboard-card tasks-card" aria-labelledby="upcoming-title">
          <div className="dashboard-card-topline">
            <SectionHeading id="upcoming-title" icon={CalendarDays} tone="upcoming" title="Próximos prazos" description="Tarefas que vencem em breve." />
            <SeeAllLink />
          </div>
          <TaskTable tasks={upcomingTasks} showDeadline />
        </section>
      </div>

      <section className="dashboard-card tasks-card standalone-card" aria-labelledby="standalone-title">
        <div className="dashboard-card-topline">
          <SectionHeading id="standalone-title" icon={FileText} tone="standalone" title="Tarefas avulsas" description="Tarefas que ainda não estão em nenhuma lista." />
          <SeeAllLink />
        </div>
        <div className="standalone-table" role="table">
          <div className="standalone-header" role="row"><span role="columnheader">Tarefa</span><span aria-hidden="true" /></div>
          {standaloneTasks.map((task) => (
            <button className="standalone-row" type="button" role="row" key={task.id}>
              <strong role="cell">{task.title}</strong>
              <ChevronRight size={21} aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>
    </section>
  )
}
