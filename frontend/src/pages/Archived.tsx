import {
  AlertCircle, Archive, CalendarDays, CheckCircle2, ChevronRight, Circle, Folder,
  List, ListChecks, LoaderCircle, RotateCcw, Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import archiveService, { ArchivedAreaDetail, ArchivedItem, ArchivedTaskSummary } from '../services/archiveService'
import areaService from '../services/areaService'

const priorityLabels = { HIGH: 'Alta', MEDIUM: 'Média', LOW: 'Baixa' } as const

function formatArchivedAt(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function formatDueDate(value: string | null) {
  if (!value) return 'Sem prazo'
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value))
}

function ArchivedTaskRow({ task }: { task: ArchivedTaskSummary }) {
  return (
    <li className="archived-detail-task">
      <span className={`archived-task-status${task.completed ? ' is-completed' : ''}`} aria-label={task.completed ? 'Concluída' : 'Pendente'}>{task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}</span>
      <span><strong>{task.title}</strong>{task.description ? <small>{task.description}</small> : null}</span>
      <span className="archived-task-metadata"><span>{task.priority ? priorityLabels[task.priority] : 'Sem prioridade'}</span><span><CalendarDays size={14} />{formatDueDate(task.dueDate)}</span>{task.archivedAt ? <em>Arquivada individualmente</em> : null}</span>
    </li>
  )
}

export function Archived() {
  const [areas, setAreas] = useState<ArchivedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<ArchivedItem | null>(null)
  const [detailItem, setDetailItem] = useState<ArchivedItem | null>(null)
  const [areaDetail, setAreaDetail] = useState<ArchivedAreaDetail | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  const loadAreas = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setLoadError('')
    try {
      setAreas(await archiveService.getAll())
    } catch {
      if (showLoading) {
        setAreas([])
        setLoadError('Não foi possível carregar as Áreas arquivadas.')
      } else {
        setActionError('A Área foi alterada, mas não foi possível atualizar os Arquivados.')
      }
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [])

  useEffect(() => { void loadAreas() }, [loadAreas])
  useEffect(() => {
    if (!deleteCandidate && !detailItem) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || processingId !== null) return
      if (deleteCandidate) setDeleteCandidate(null)
      else setDetailItem(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteCandidate, detailItem, processingId])

  const openDetails = async (item: ArchivedItem) => {
    setDetailItem(item)
    setAreaDetail(null)
    setDetailError('')
    setActionError('')
    setIsDetailLoading(true)
    try {
      setAreaDetail(await archiveService.getArea(item.id))
    } catch {
      setDetailError(`Não foi possível carregar os detalhes de “${item.title}”.`)
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleRestore = async (item: ArchivedItem) => {
    setProcessingId(item.id)
    setActionError('')
    try {
      await areaService.restore(item.id)
      setAreas((current) => current.filter((area) => area.id !== item.id))
      setDetailItem(null)
      await loadAreas(false)
    } catch {
      setActionError(`Não foi possível restaurar “${item.title}”.`)
    } finally {
      setProcessingId(null)
    }
  }

  const handlePermanentDelete = async () => {
    if (!deleteCandidate) return
    const candidate = deleteCandidate
    setProcessingId(candidate.id)
    setActionError('')
    try {
      await areaService.remove(candidate.id)
      setAreas((current) => current.filter((area) => area.id !== candidate.id))
      setDeleteCandidate(null)
      setDetailItem(null)
      await loadAreas(false)
    } catch {
      setActionError(`Não foi possível excluir permanentemente “${candidate.title}”.`)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <section className="archived-page" aria-labelledby="archived-title">
      <div className="lists-page-heading archived-heading">
        <div><p>Organização segura</p><h1 id="archived-title">Arquivados</h1><span>Áreas temporariamente retiradas, com toda a sua estrutura preservada.</span></div>
        <div className="archived-counters" aria-label="Resumo das Áreas arquivadas"><span><strong>{areas.length}</strong> {areas.length === 1 ? 'Área' : 'Áreas'}</span></div>
      </div>

      {actionError && !deleteCandidate ? <p className="lists-action-error" role="alert"><AlertCircle size={19} />{actionError}</p> : null}
      {isLoading ? <div className="lists-state" aria-live="polite"><LoaderCircle className="spin" size={32} /><h2>Carregando Arquivados...</h2><p>Aguarde enquanto buscamos as Áreas arquivadas.</p></div> : null}
      {!isLoading && loadError ? <div className="lists-state is-error" role="alert"><AlertCircle size={36} /><h2>Erro ao carregar</h2><p>{loadError}</p><button className="secondary-action" type="button" onClick={() => void loadAreas()}>Tentar novamente</button></div> : null}
      {!isLoading && !loadError && areas.length === 0 ? <div className="lists-state"><span className="lists-state-icon"><Archive size={38} /></span><h2>Nenhuma Área arquivada</h2><p>As Áreas arquivadas aparecerão aqui com suas Listas e Tarefas preservadas.</p></div> : null}

      {!isLoading && !loadError && areas.length > 0 ? (
        <section className="archived-category is-area" aria-labelledby="archived-areas-title">
          <header className="archived-category-header"><span className="archived-category-icon is-area"><Folder size={22} /></span><div><h2 id="archived-areas-title">Áreas <span>{areas.length}</span></h2><p>Abra uma Área para visualizar sua estrutura completa em modo somente leitura.</p></div></header>
          <div className="archived-category-items">{areas.map((item) => (
            <article className="archived-item is-area" key={item.id}>
              <button className="archived-item-main" type="button" onClick={() => void openDetails(item)} aria-label={`Visualizar Área ${item.title}`}>
                <span className="archived-item-icon is-area"><Folder size={24} /></span>
                <span className="archived-item-copy"><strong>{item.title}</strong><span className="archived-card-summary"><span><List size={14} />{item.listCount ?? 0} {(item.listCount ?? 0) === 1 ? 'Lista' : 'Listas'}</span><span><ListChecks size={14} />{item.taskCount ?? 0} {(item.taskCount ?? 0) === 1 ? 'Tarefa' : 'Tarefas'}</span></span></span>
                <time dateTime={item.archivedAt}><Archive size={14} /><span>Arquivada em</span><strong>{formatArchivedAt(item.archivedAt)}</strong></time><ChevronRight className="archived-open-icon" size={21} />
              </button>
              <div className="archived-actions"><button className="restore-action" type="button" onClick={() => void handleRestore(item)} disabled={processingId !== null}>{processingId === item.id ? <LoaderCircle className="spin" size={17} /> : <RotateCcw size={17} />}Restaurar Área</button><button className="archive-delete-action" type="button" onClick={() => { setActionError(''); setDeleteCandidate(item) }} disabled={processingId !== null}><Trash2 size={16} />Excluir definitivamente</button></div>
            </article>
          ))}</div>
        </section>
      ) : null}

      {detailItem ? (
        <div className="area-modal-backdrop" role="presentation" onMouseDown={() => processingId === null && setDetailItem(null)}>
          <section className="archived-detail-modal" role="dialog" aria-modal="true" aria-labelledby="archived-detail-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className="archived-detail-header"><span className="archived-item-icon is-area"><Folder size={25} /></span><div><span className="archived-type is-area">Área · Somente leitura</span><h2 id="archived-detail-title">{detailItem.title}</h2><p>Arquivada em {formatArchivedAt(detailItem.archivedAt)}</p></div></header>
            {isDetailLoading ? <div className="archived-detail-state"><LoaderCircle className="spin" size={29} /><p>Carregando estrutura...</p></div> : null}
            {!isDetailLoading && detailError ? <div className="archived-detail-state is-error" role="alert"><AlertCircle size={30} /><p>{detailError}</p><button className="secondary-action" type="button" onClick={() => void openDetails(detailItem)}>Tentar novamente</button></div> : null}
            {!isDetailLoading && !detailError && areaDetail ? <AreaDetailContent detail={areaDetail} /> : null}
            {actionError && !deleteCandidate ? <p className="area-form-error" role="alert"><AlertCircle size={18} />{actionError}</p> : null}
            {!isDetailLoading && !detailError ? <div className="archived-detail-actions"><button className="restore-action" type="button" onClick={() => void handleRestore(detailItem)} disabled={processingId !== null}>{processingId !== null ? <LoaderCircle className="spin" size={18} /> : <RotateCcw size={18} />}Restaurar Área</button><button className="danger-action" type="button" onClick={() => { setActionError(''); setDeleteCandidate(detailItem) }} disabled={processingId !== null}><Trash2 size={18} />Excluir definitivamente</button></div> : null}
          </section>
        </div>
      ) : null}

      {deleteCandidate ? (
        <div className="area-modal-backdrop permanent-delete-backdrop" role="presentation" onMouseDown={() => processingId === null && setDeleteCandidate(null)}>
          <section className="area-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="permanent-delete-title" aria-describedby="permanent-delete-description" onMouseDown={(event) => event.stopPropagation()}>
            <span className="area-delete-icon" aria-hidden="true"><Trash2 size={29} /></span><div><h2 id="permanent-delete-title">Excluir permanentemente este item?</h2><p id="permanent-delete-description">Esta ação não poderá ser desfeita.</p>{actionError ? <p className="area-form-error" role="alert"><AlertCircle size={18} />{actionError}</p> : null}</div>
            <div className="area-modal-actions"><button className="secondary-action" type="button" onClick={() => setDeleteCandidate(null)} disabled={processingId !== null}>Cancelar</button><button className="danger-action" type="button" onClick={() => void handlePermanentDelete()} disabled={processingId !== null}>{processingId !== null ? <LoaderCircle className="spin" size={19} /> : <Trash2 size={19} />}Excluir definitivamente</button></div>
          </section>
        </div>
      ) : null}
    </section>
  )
}

function AreaDetailContent({ detail }: { detail: ArchivedAreaDetail }) {
  return <div className="archived-detail-content"><p className="archived-detail-description">{detail.description || 'Sem descrição.'}</p><section className="archived-structure-section"><h3>Listas <span>{detail.lists.length}</span></h3>{detail.lists.length ? <div className="archived-detail-lists">{detail.lists.map((list) => <section className="archived-detail-list" key={list.id}><header><span><List size={18} /><strong>{list.title}</strong>{list.archivedAt ? <em>Arquivada</em> : null}</span><small>{list.description || 'Sem descrição'}</small></header>{list.tasks.length ? <ul className="archived-detail-tasks">{list.tasks.map((task) => <ArchivedTaskRow task={task} key={task.id} />)}</ul> : <p className="archived-structure-empty">Nenhuma tarefa nesta Lista.</p>}</section>)}</div> : <p className="archived-structure-empty">Esta Área não possui Listas.</p>}</section></div>
}
