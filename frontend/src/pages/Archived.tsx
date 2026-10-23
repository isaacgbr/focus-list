import { AlertCircle, Archive, CalendarDays, ChevronRight, Folder, List, ListChecks, LoaderCircle, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useModalFocusTrap } from '../hooks/useModalFocusTrap'
import { MotionPresence } from '../components/MotionPresence'
import archiveService, { ArchivedItem } from '../services/archiveService'
import areaService from '../services/areaService'
import listService from '../services/listService'
import taskService from '../services/taskService'

const typeLabels = { area: 'Área', list: 'Lista', task: 'Tarefa' } as const

const formatArchivedAt = (value: string) => new Intl.DateTimeFormat('pt-BR').format(new Date(value))
const itemKey = (item: ArchivedItem) => `${item.type}-${item.id}`
const itemPath = (item: ArchivedItem) => `/app/arquivados/${item.type === 'area' ? 'areas' : item.type === 'list' ? 'listas' : 'tarefas'}/${item.id}`

function ArchivedItemIcon({ type }: { type: ArchivedItem['type'] }) {
  if (type === 'area') return <Folder size={24} />
  if (type === 'list') return <List size={24} />
  return <ListChecks size={24} />
}

export function Archived() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ArchivedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [processingKey, setProcessingKey] = useState<string | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<ArchivedItem | null>(null)
  const deleteModalRef = useModalFocusTrap<HTMLElement>(deleteCandidate !== null)
  const counts = useMemo(() => ({ area: items.filter((item) => item.type === 'area').length, list: items.filter((item) => item.type === 'list').length, task: items.filter((item) => item.type === 'task').length }), [items])

  const loadItems = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setLoadError('')
    try { setItems(await archiveService.getAll()) }
    catch {
      if (showLoading) { setItems([]); setLoadError('Não foi possível carregar os itens arquivados.') }
      else setActionError('O item foi alterado, mas não foi possível atualizar os Arquivados.')
    } finally { if (showLoading) setIsLoading(false) }
  }, [])

  useEffect(() => { void loadItems() }, [loadItems])
  useEffect(() => {
    if (!deleteCandidate) return
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && processingKey === null) setDeleteCandidate(null) }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteCandidate, processingKey])

  const restoreItem = async (item: ArchivedItem) => {
    const key = itemKey(item)
    setProcessingKey(key); setActionError('')
    try {
      if (item.type === 'area') await areaService.restore(item.id)
      else if (item.type === 'list') await listService.restore(item.id)
      else await taskService.restore(item.id)
      setItems((current) => current.filter((entry) => itemKey(entry) !== key))
      await loadItems(false)
    } catch { setActionError(`Não foi possível restaurar “${item.title}”.`) }
    finally { setProcessingKey(null) }
  }

  const permanentlyDeleteItem = async () => {
    if (!deleteCandidate) return
    const candidate = deleteCandidate
    const key = itemKey(candidate)
    setProcessingKey(key); setActionError('')
    try {
      if (candidate.type === 'area') await areaService.remove(candidate.id)
      else if (candidate.type === 'list') await listService.remove(candidate.id)
      else await taskService.remove(candidate.id)
      setItems((current) => current.filter((entry) => itemKey(entry) !== key))
      setDeleteCandidate(null)
      await loadItems(false)
    } catch { setActionError(`Não foi possível excluir permanentemente “${candidate.title}”.`) }
    finally { setProcessingKey(null) }
  }

  const cardSummary = (item: ArchivedItem) => {
    if (item.type === 'area') return <span className="archived-card-summary"><span><List size={14} />{item.listCount ?? 0} {(item.listCount ?? 0) === 1 ? 'lista' : 'listas'}</span><span><ListChecks size={14} />{item.taskCount ?? 0} {(item.taskCount ?? 0) === 1 ? 'tarefa' : 'tarefas'}</span></span>
    if (item.type === 'list') return <span className="archived-card-summary"><span className="archived-origin"><span className="archived-origin-label">Área</span><Folder size={14} /><strong>{item.areaTitle}</strong></span><span><ListChecks size={14} />{item.taskCount ?? 0} {(item.taskCount ?? 0) === 1 ? 'tarefa' : 'tarefas'}</span></span>
    return <span className="archived-origin"><span className="archived-origin-label">Origem</span><Folder size={14} /><strong>{item.areaTitle}</strong><ChevronRight size={13} /><List size={14} /><strong>{item.listTitle}</strong></span>
  }

  return <section className="archived-page" aria-labelledby="archived-title">
    <div className="lists-page-heading archived-heading">
      <div className="lists-page-heading-copy archived-heading-copy">
        <h1 id="archived-title">Arquivados</h1>
        <span>Consulte, edite, restaure ou exclua definitivamente os itens arquivados.</span>
      </div>
      <div className="archived-counters" aria-label="Resumo dos itens arquivados">
        <span className="is-area"><strong>{counts.area}</strong>{counts.area === 1 ? 'Área' : 'Áreas'}</span>
        <span className="is-list"><strong>{counts.list}</strong>{counts.list === 1 ? 'Lista' : 'Listas'}</span>
        <span className="is-task"><strong>{counts.task}</strong>{counts.task === 1 ? 'Tarefa' : 'Tarefas'}</span>
      </div>
    </div>
    {actionError && !deleteCandidate ? <p className="lists-action-error" role="alert"><AlertCircle size={19} />{actionError}</p> : null}
    {isLoading ? <div className="lists-state" aria-live="polite"><LoaderCircle className="spin" size={32} /><h2>Carregando Arquivados...</h2><p>Aguarde enquanto buscamos os itens arquivados.</p></div> : null}
    {!isLoading && loadError ? <div className="lists-state is-error" role="alert"><AlertCircle size={36} /><h2>Erro ao carregar</h2><p>{loadError}</p><button className="secondary-action" type="button" onClick={() => void loadItems()}>Tentar novamente</button></div> : null}
    {!isLoading && !loadError && items.length === 0 ? <div className="lists-state"><span className="lists-state-icon"><Archive size={38} /></span><h2>Nenhum item arquivado</h2><p>Áreas, Listas e Tarefas arquivadas diretamente aparecerão aqui, com seu contexto preservado.</p></div> : null}
    {!isLoading && !loadError && items.length > 0 ? <div className="archived-collection">
      <div className="archived-collection-heading"><div><h2>Itens arquivados</h2><span>{items.length} {items.length === 1 ? 'item' : 'itens'} · mais recentes primeiro</span></div><Archive size={18} aria-hidden="true" /></div>
      <div className="archived-category-items archived-all-items">{items.map((item) => {
        const key = itemKey(item)
        return <article className={`archived-item is-${item.type}`} key={key}>
          <button className="archived-item-main" type="button" onClick={() => navigate(itemPath(item))} aria-label={`Visualizar ${typeLabels[item.type]} ${item.title}`}>
            <span className={`archived-item-icon is-${item.type}`}><ArchivedItemIcon type={item.type} /></span>
            <span className="archived-item-copy"><span className={`archived-type is-${item.type}`}>{typeLabels[item.type]}</span><strong>{item.title}</strong>{cardSummary(item)}</span>
          </button>
          <div className="archived-actions">
            <time dateTime={item.archivedAt}><CalendarDays size={15} /><span>Arquivada em</span><strong>{formatArchivedAt(item.archivedAt)}</strong></time>
            <button className="restore-action" type="button" onClick={() => void restoreItem(item)} disabled={processingKey !== null}>{processingKey === key ? <LoaderCircle className="spin" size={17} /> : <RotateCcw size={17} />}Restaurar</button>
            <details className="archived-actions-menu" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.removeAttribute('open') }} onKeyDown={(event) => { if (event.key === 'Escape') { event.currentTarget.removeAttribute('open'); event.currentTarget.querySelector('summary')?.focus() } }}>
              <summary aria-label={`Mais ações para ${typeLabels[item.type]} ${item.title}`}><MoreHorizontal size={19} aria-hidden="true" /></summary>
              <div role="menu"><button className="archive-delete-action" type="button" role="menuitem" onClick={(event) => { const menu = event.currentTarget.closest('details'); menu?.removeAttribute('open'); menu?.querySelector<HTMLElement>('summary')?.focus(); setActionError(''); setDeleteCandidate(item) }} disabled={processingKey !== null}><Trash2 size={16} />Excluir definitivamente</button></div>
            </details>
          </div>
        </article>
      })}</div>
    </div> : null}
    <MotionPresence present={Boolean(deleteCandidate)}>
      {deleteCandidate ? <div className="area-modal-backdrop permanent-delete-backdrop" role="presentation" onMouseDown={() => processingKey === null && setDeleteCandidate(null)}><section ref={deleteModalRef} className="area-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="permanent-delete-title" aria-describedby="permanent-delete-description" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}><span className="area-delete-icon" aria-hidden="true"><Trash2 size={29} /></span><div><h2 id="permanent-delete-title">Excluir esta {typeLabels[deleteCandidate.type].toLowerCase()} definitivamente?</h2><p id="permanent-delete-description">“{deleteCandidate.title}” e todo o conteúdo associado serão removidos. Esta ação não poderá ser desfeita.</p>{actionError ? <p className="area-form-error" role="alert"><AlertCircle size={18} />{actionError}</p> : null}</div><div className="area-modal-actions"><button className="secondary-action" type="button" onClick={() => setDeleteCandidate(null)} disabled={processingKey !== null} data-modal-initial-focus>Cancelar</button><button className="danger-action" type="button" onClick={() => void permanentlyDeleteItem()} disabled={processingKey !== null}>{processingKey !== null ? <LoaderCircle className="spin" size={19} /> : <Trash2 size={19} />}Excluir definitivamente</button></div></section></div> : null}
    </MotionPresence>
  </section>
}
