import {
  Archive, ArrowUpRight, CalendarDays, Check, CheckCircle2, ChevronRight,
  FileText, Folder, Home, Info, LayoutDashboard, LayoutGrid, Link2, List, ListChecks, MoreHorizontal, Plus, X,
} from 'lucide-react'

import { Brand } from '../Brand'
import { LandingScene, LandingStarfield } from './LandingScene'
import { galaxySystems } from './landingGalaxy'

const studyTasks = galaxySystems[0].ideas
const tasks = [studyTasks[2], studyTasks[0], studyTasks[1]].map((idea) => idea.text)

function DemoDashboard() {
  return (
    <div className="lp-demo-dashboard">
      <div className="lp-demo-greeting"><small><CalendarDays size={13} />FocusList</small><strong>Seu espaço de organização.</strong></div>
      <div className="lp-demo-dashboard-columns">
        <div className="lp-demo-panel"><strong>Em andamento</strong><small>Tarefa <span>Lista</span></small>{tasks.map((task, index) => <div className={`lp-demo-dashboard-row${index === 0 ? ' lp-demo-bridge-target' : ''}`} key={task}><b>{task}</b><span>Concurso público</span></div>)}</div>
        <div className="lp-demo-panel"><strong>Próximos prazos</strong><div className="lp-demo-dashboard-row">Fazer simulado<span>Hoje</span></div></div>
      </div>
      <div className="lp-demo-dashboard-insights">
        <div className="lp-demo-panel"><strong>Visão geral</strong><div className="lp-demo-mini-overview"><b>3 <span>tarefas</span></b><span>0 concluídas</span></div></div>
        <div className="lp-demo-panel lp-demo-area-target"><strong>Áreas e listas</strong><div className="lp-demo-area-row"><Folder size={22} /><div><b>Estudos</b><small>1 lista · 3 tarefas</small></div><ChevronRight size={18} /></div></div>
      </div>
    </div>
  )
}

// A local presentation of Dashboard, AreaLists, ListTasks and TaskDetails.
// No app component is mounted: opening the landing must never fetch or mutate user data.
function DemoWorkspace() {
  return (
    <div className="lp-demo-window" aria-hidden="true">
      <aside className="lp-demo-sidebar">
        <Brand />
        <div className="lp-demo-nav-item lp-demo-nav-dashboard"><LayoutDashboard size={17} /><span>Dashboard</span></div>
        <div className="lp-demo-nav-item"><Archive size={17} />Arquivados</div>
        <div className="lp-demo-nav-heading">Áreas<Plus size={15} /></div>
        <div className="lp-demo-nav-item lp-demo-nav-area"><Folder size={17} /><span>Estudos</span></div>
        <div className="lp-demo-nav-bottom"><Info size={17} />Sobre</div>
      </aside>

      <div className="lp-demo-workspace">
        <div className="lp-demo-breadcrumb">
          <Home size={15} />
          <div className="lp-demo-breadcrumb-steps">
            <span className="lp-demo-breadcrumb-dashboard">Dashboard</span>
            <span className="lp-demo-breadcrumb-area">Áreas<ChevronRight size={13} />Estudos</span>
            <span className="lp-demo-breadcrumb-list">Áreas<ChevronRight size={13} />Estudos<ChevronRight size={13} />Concurso público</span>
          </div>
        </div>
        <div className="lp-demo-viewport">
          <DemoDashboard />

          <div className="lp-demo-area-view">
            <div className="lp-demo-page-heading"><div><small>Área</small><strong>Estudos</strong></div><span><Plus size={14} />Nova Lista</span></div>
            <p>Um espaço para aprender e evoluir.</p>
            <div className="lp-demo-list-target"><ListChecks size={28} /><div><b>Concurso público</b><small>Preparação para o concurso público</small></div><span>3 tarefas</span><ChevronRight size={17} /></div>
          </div>

          <div className="lp-demo-list-view">
            <div className="lp-demo-page-heading"><div><small>Estudos</small><strong>Concurso público</strong></div><span><Plus size={14} />Nova Tarefa</span></div>
            <p>Preparação para o concurso público</p>
            <div className="lp-demo-task-summary">
              <span>3 pendentes <span>0 concluídas</span></span>
              <span className="lp-demo-view-toggle"><span><List size={12} />Lista</span><span><LayoutGrid size={12} />Cards</span></span>
            </div>
            <div className="lp-demo-task-list">
              {tasks.map((task, index) => (
                <div className={`lp-demo-task-row${index === 0 ? ' lp-demo-task-target' : ''}`} key={task}>
                  <i className="lp-demo-checkbox" />
                  <div className="lp-demo-task-copy">
                    <b>{task}</b>
                    {index === 0 ? <><small>Resolver o simulado e revisar os erros.</small><span><ListChecks size={11} />2/3 <Link2 size={11} />1</span></> : null}
                  </div>
                  <div className="lp-demo-task-metadata">
                    <span className={index === 0 ? 'lp-demo-priority' : ''}>{index === 0 ? 'Alta' : 'Sem prioridade'}</span>
                    <span><CalendarDays size={11} />{index === 0 ? 'Hoje' : 'Sem prazo'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-demo-detail-shade" />
          <div className="lp-demo-details">
            <div className="lp-demo-details-title"><span className="lp-demo-complete"><Check size={17} /></span><div><strong>Fazer simulado</strong><small><ListChecks size={13} />Lista: <b>Concurso público</b><span className="lp-demo-status"><span>A fazer</span><span>Concluída</span></span></small></div><MoreHorizontal size={18} /><X size={18} /></div>
            <div className="lp-demo-details-grid">
              <div className="lp-demo-details-main">
                <div className="lp-demo-detail-card"><strong><FileText size={16} />Descrição</strong><p>Fazer o simulado e revisar os erros.</p></div>
                <div className="lp-demo-detail-card lp-demo-checklist"><strong><ListChecks size={16} />Checklist<span className="lp-demo-checklist-count"><span>2/3</span><span>3/3</span></span></strong><div className="lp-demo-progress"><i /></div><div><span className="lp-demo-checkbox is-checked"><Check size={11} /></span>Português</div><div><span className="lp-demo-checkbox is-checked"><Check size={11} /></span>Raciocínio Lógico</div><div><span className="lp-demo-checkbox lp-demo-check-last"><Check size={11} /></span>Informática</div></div>
                <div className="lp-demo-detail-card lp-demo-links"><strong><Link2 size={16} />Links e referências</strong><div><Link2 size={14} /><span>Questões e simulados</span><ArrowUpRight size={14} /></div></div>
              </div>
              <div className="lp-demo-detail-card lp-demo-properties"><strong>Detalhes</strong><div><span>Status</span><b className="lp-demo-status"><span>A fazer</span><span>Concluída</span></b></div><div className="lp-demo-priority-focus"><span>Prioridade</span><b className="lp-demo-priority">Alta</b></div><div className="lp-demo-deadline-focus"><span>Prazo</span><b><CalendarDays size={12} />Hoje</b></div></div>
            </div>
            <div className="lp-demo-completion-note"><CheckCircle2 size={16} />Tarefa concluída</div>
          </div>
        </div>
        <div className="lp-demo-reset">
        <div className="lp-demo-breadcrumb"><Home size={15} /><span>Dashboard</span></div>
          <div className="lp-demo-viewport"><DemoDashboard /></div>
        </div>
      </div>
    </div>
  )
}

export function LandingProductDemo() {
  return (
    <LandingScene id="produto" className="lp-product" titleId="lp-product-title">
      <LandingStarfield />
      <div className="lp-product-nebula" aria-hidden="true"><i /><i /></div>
      <div className="lp-product-heading lp-plane-copy">
        <h2 id="lp-product-title" className="sr-only">Organize, priorize e conclua com o FocusList.</h2>
        <div className="lp-demo-narratives" aria-hidden="true">
          <div className="lp-demo-story">
            <div className="lp-demo-narrative lp-demo-narrative-organize"><strong>Organize.</strong><p>Transforme tarefas soltas em uma estrutura clara.</p></div>
            <div className="lp-demo-narrative lp-demo-narrative-prioritize"><strong>Priorize.</strong><p>Saiba o que merece sua atenção agora.</p></div>
            <div className="lp-demo-narrative lp-demo-narrative-complete"><strong>Conclua.</strong><p>Transforme planejamento em progresso.</p></div>
          </div>
          <div className="lp-demo-narrative-reset"><strong>Organize.</strong><p>Transforme tarefas soltas em uma estrutura clara.</p></div>
        </div>
      </div>
      <figure className="lp-product-figure lp-plane-main" aria-describedby="lp-demo-description">
        <div className="lp-demo-float"><div className="lp-demo-camera"><DemoWorkspace /></div></div>
        <figcaption id="lp-demo-description">Demonstração com dados ilustrativos da interface do FocusList.</figcaption>
        <p className="sr-only">O Dashboard abre automaticamente a área Estudos, a lista Concurso público e a tarefa Fazer simulado. São destacados descrição, prioridade alta e prazo para hoje; o checklist passa de 2/3 para 3/3, os links de referência aparecem e a tarefa é concluída. A demonstração repete automaticamente após um breve respiro e uma transição suave ao Dashboard. Pausa ao sair da seção e retoma do mesmo ponto ao voltar. Você pode continuar a rolagem a qualquer momento. Com redução de movimento, os detalhes são apresentados em um estado estável e concluído.</p>
      </figure>
    </LandingScene>
  )
}
