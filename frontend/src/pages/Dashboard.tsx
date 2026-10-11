import { ArrowRight, Check, FolderPlus, ListPlus, Sparkles, SquarePlus } from 'lucide-react'

type MockTask = {
  id: string
}

type MockList = {
  id: string
  tasks: MockTask[]
}

type MockArea = {
  id: string
  lists: MockList[]
}

type EmptyState = {
  eyebrow: string
  title: string
  description: string
  action: string
  icon: typeof FolderPlus
  completedSteps: number
}

// Altere somente este mock para visualizar os demais estágios do estado vazio.
const mockAreas: MockArea[] = []

function getEmptyState(areas: MockArea[]): EmptyState {
  if (areas.length === 0) {
    return {
      eyebrow: 'Seu espaço começa aqui',
      title: 'Crie sua primeira Área',
      description: 'Áreas separam os contextos da sua vida e mantêm tudo organizado. Comece por algo importante para você.',
      action: 'Criar primeira Área',
      icon: FolderPlus,
      completedSteps: 0,
    }
  }

  const lists = areas.flatMap((area) => area.lists)

  if (lists.length === 0) {
    return {
      eyebrow: 'Sua primeira Área está pronta',
      title: 'Agora crie uma Lista',
      description: 'Use Listas para reunir tarefas que fazem parte do mesmo objetivo, projeto ou rotina.',
      action: 'Criar primeira Lista',
      icon: ListPlus,
      completedSteps: 1,
    }
  }

  return {
    eyebrow: 'Sua organização ganhou forma',
    title: 'Adicione sua primeira Tarefa',
    description: 'Registre o próximo passo que você quer realizar. Depois disso, seu Dashboard estará pronto para acompanhar seu progresso.',
    action: 'Criar primeira Tarefa',
    icon: SquarePlus,
    completedSteps: 2,
  }
}

const setupSteps = ['Área', 'Lista', 'Tarefa']

export function Dashboard() {
  const emptyState = getEmptyState(mockAreas)
  const EmptyStateIcon = emptyState.icon
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date())

  return (
    <section className="dashboard-empty" aria-labelledby="dashboard-title">
      <div className="dashboard-intro">
        <p className="dashboard-date">{formattedDate}</p>
        <h1 id="dashboard-title">Bem-vindo ao FocusList.</h1>
        <p>Vamos preparar seu espaço para você focar no que realmente importa.</p>
      </div>

      <div className="empty-state-card">
        <div className="empty-state-glow" aria-hidden="true" />
        <div className="empty-state-icon" aria-hidden="true">
          <EmptyStateIcon size={34} strokeWidth={1.8} />
        </div>

        <div className="empty-state-copy">
          <span className="empty-state-eyebrow">
            <Sparkles size={15} aria-hidden="true" />
            {emptyState.eyebrow}
          </span>
          <h2>{emptyState.title}</h2>
          <p>{emptyState.description}</p>
        </div>

        <button className="primary-action" type="button">
          {emptyState.action}
          <ArrowRight size={19} aria-hidden="true" />
        </button>

        <ol className="setup-progress" aria-label="Etapas da configuração inicial">
          {setupSteps.map((step, index) => {
            const isComplete = index < emptyState.completedSteps
            const isCurrent = index === emptyState.completedSteps

            return (
              <li className={isComplete ? 'is-complete' : isCurrent ? 'is-current' : ''} key={step}>
                <span className="setup-step-marker" aria-hidden="true">
                  {isComplete ? <Check size={14} strokeWidth={3} /> : index + 1}
                </span>
                <span>{step}</span>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
