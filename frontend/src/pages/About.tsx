import { Archive, ArrowRight, CalendarDays, CheckSquare2, Folder, Link2, ListChecks, ListTodo } from 'lucide-react'

import { Brand } from '../components/Brand'

const structure = [
  { title: 'Área', description: 'Um contexto da sua vida, como Trabalho ou Estudos.', icon: Folder },
  { title: 'Lista', description: 'Um projeto ou grupo de atividades dentro de uma área.', icon: ListTodo },
  { title: 'Tarefa', description: 'O que precisa ser feito, com os detalhes que você precisa.', icon: CheckSquare2 },
]

const resources = [
  { title: 'Prioridades e prazos', description: 'Saiba o que merece atenção e acompanhe as entregas.', icon: CalendarDays },
  { title: 'Checklists', description: 'Divida suas tarefas em etapas e acompanhe o progresso.', icon: ListChecks },
  { title: 'Links', description: 'Mantenha as referências junto de cada tarefa.', icon: Link2 },
  { title: 'Arquivo', description: 'Retire conteúdos da rotina e restaure quando precisar.', icon: Archive },
]

export function About() {
  return (
    <div className="about-page">
      <h1 className="about-page-title">Sobre</h1>
      <div className="about-panel">
        <section className="about-introduction" aria-labelledby="about-title">
          <Brand />
          <h2 id="about-title">Organize. Acompanhe. <span>Conclua.</span></h2>
          <p>O FocusList reúne seus projetos, tarefas e referências em um único lugar, para transformar prioridades em progresso com clareza, foco e simplicidade.</p>
        </section>
        <section className="about-structure" aria-labelledby="about-structure-title">
          <h2 id="about-structure-title">Do contexto ao próximo passo.</h2>
          <ol>
            {structure.map(({ title, description, icon: Icon }, index) => <li key={title}>
              <div><Icon size={21} aria-hidden="true" /><h3>{title}</h3>{index < structure.length - 1 ? <ArrowRight size={17} className="about-structure-arrow" aria-hidden="true" /> : null}</div>
              <p>{description}</p>
            </li>)}
          </ol>
        </section>
        <section className="about-features" aria-labelledby="about-features-title">
          <h2 id="about-features-title">O essencial para manter o foco.</h2>
          <ul>
            {resources.map(({ title, description, icon: Icon }) => <li key={title}>
              <Icon size={20} aria-hidden="true" /><div><h3>{title}</h3><p>{description}</p></div>
            </li>)}
          </ul>
        </section>
      </div>
    </div>
  )
}
