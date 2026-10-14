import {
  Archive,
  ArrowRight,
  Check,
  CheckSquare2,
  CircleUserRound,
  ExternalLink,
  Folder,
  Github,
  Layers3,
  Link2,
  Linkedin,
  ListChecks,
  ListTodo,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from 'lucide-react'

const steps = [
  { label: 'Área', description: 'Crie um espaço.', icon: Folder, tone: 'blue' },
  { label: 'Lista', description: 'Agrupe suas tarefas.', icon: ListTodo, tone: 'purple' },
  { label: 'Tarefa', description: 'Registre atividades.', icon: CheckSquare2, tone: 'green' },
  { label: 'Organizar', description: 'Defina prioridades.', icon: SlidersHorizontal, tone: 'orange' },
  { label: 'Arquivar', description: 'Preserve conteúdos.', icon: Archive, tone: 'slate' },
] as const

const resources = [
  { label: 'Áreas', description: 'Organize projetos.', icon: Folder, tone: 'blue' },
  { label: 'Listas', description: 'Agrupe tarefas.', icon: ListTodo, tone: 'purple' },
  { label: 'Tarefas', description: 'Acompanhe atividades.', icon: CheckSquare2, tone: 'green' },
  { label: 'Checklists', description: 'Divida em etapas.', icon: ListChecks, tone: 'orange' },
  { label: 'Links', description: 'Guarde referências.', icon: Link2, tone: 'slate' },
  { label: 'Arquivados', description: 'Preserve conteúdos.', icon: Archive, tone: 'slate' },
] as const

export function About() {
  return (
    <div className="about-page">
      <h1 className="about-page-title">Sobre</h1>

      <section className="about-hero about-panel" aria-labelledby="about-title">
        <div className="about-hero-copy">
          <span className="about-logo" aria-hidden="true"><Check size={48} strokeWidth={3.2} /></span>
          <h2 id="about-title">Focus <span>List</span></h2>
          <strong>Organize tudo em um único lugar.</strong>
          <p>Transforme prioridades em progresso com clareza, foco e simplicidade.</p>
        </div>

        <div className="about-hero-art" aria-hidden="true">
          <div className="about-orbit about-orbit-one" />
          <div className="about-orbit about-orbit-two" />
          <div className="about-app-window">
            <span className="about-window-dots"><i /><i /><i /></span>
            <div className="about-window-content">
              <span /><span /><span className="is-active" /><span />
            </div>
          </div>
          <div className="about-floating-card">
            <span><i className="is-green" /><b /></span>
            <span><i className="is-orange" /><b /></span>
            <span><i className="is-blue" /><b /></span>
          </div>
          <span className="about-art-icon is-check"><Check size={34} strokeWidth={3} /></span>
          <span className="about-art-icon is-list"><ListTodo size={31} /></span>
          <span className="about-art-icon is-folder"><Folder size={31} /></span>
        </div>
      </section>

      <section className="about-panel about-intro" aria-labelledby="what-is-focuslist">
        <div>
          <h2 id="what-is-focuslist">O que é o FocusList?</h2>
          <p>O FocusList ajuda você a manter o foco no que importa, com clareza e simplicidade.</p>
        </div>
        <div className="about-principles" aria-label="Princípios do FocusList">
          <span><Zap className="is-orange" size={25} /><b>Simples</b><small>Fácil de usar</small></span>
          <span><Layers3 className="is-blue" size={25} /><b>Organizado</b><small>Tudo no seu lugar</small></span>
          <span><Sparkles className="is-green" size={25} /><b>Produtivo</b><small>Foco no que importa</small></span>
        </div>
      </section>

      <section className="about-panel" aria-labelledby="how-it-works">
        <header className="about-section-heading">
          <h2 id="how-it-works">Como funciona?</h2>
          <p>Veja como é simples começar a usar o FocusList.</p>
        </header>
        <div className="about-steps">
          {steps.map((step, index) => (
            <div className="about-step-group" key={step.label}>
              <article className={`about-step is-${step.tone}`}>
                <span className="about-step-number">{index + 1}</span>
                <span className="about-icon"><step.icon size={29} /></span>
                <h3>{step.label}</h3>
                <p>{step.description}</p>
              </article>
              {index < steps.length - 1 ? <ArrowRight className="about-step-arrow" size={22} aria-hidden="true" /> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="about-panel" aria-labelledby="main-resources">
        <header className="about-section-heading">
          <h2 id="main-resources">Recursos principais</h2>
          <p>O essencial para manter sua organização em dia.</p>
        </header>
        <div className="about-resources">
          {resources.map((resource) => (
            <article className={`about-resource is-${resource.tone}`} key={resource.label}>
              <span className="about-icon"><resource.icon size={27} /></span>
              <div><h3>{resource.label}</h3><p>{resource.description}</p></div>
            </article>
          ))}
        </div>
      </section>

      <footer className="about-panel about-footer">
        <CircleUserRound className="about-author-icon" size={39} aria-hidden="true" />
        <small>Desenvolvido por</small>
        <h2>Isaac Gabriel</h2>
        <p>Estudante de Análise e Desenvolvimento de Sistemas</p>
        <div className="about-social-links">
          <a href="https://github.com/isaacgbr" target="_blank" rel="noreferrer">
            <Github size={21} /> GitHub <ExternalLink size={15} />
          </a>
          <a href="https://www.linkedin.com/in/isaacgbr" target="_blank" rel="noreferrer">
            <Linkedin size={21} /> LinkedIn <ExternalLink size={15} />
          </a>
        </div>
        <span className="about-version">Versão 1.0.0</span>
      </footer>
    </div>
  )
}
