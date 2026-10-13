import {
  AlertCircle, CalendarDays, CheckCircle2, Circle, ExternalLink, Folder, Link2,
  List, ListChecks, LoaderCircle, RotateCcw, Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import archiveService, { ArchivedListDetail, ArchivedListSummary, ArchivedTaskDetail, ArchivedTaskSummary } from '../services/archiveService'
import listService from '../services/listService'
import taskService from '../services/taskService'

type CommonProps = { onClose: () => void; onChanged: () => void | Promise<void> }

const priorityLabels = { HIGH: 'Alta', MEDIUM: 'Média', LOW: 'Baixa' } as const

function formatDate(value: string | null, includeTime = false) {
  if (!value) return 'Não definido'
  return new Intl.DateTimeFormat('pt-BR', includeTime ? { dateStyle: 'short', timeStyle: 'short' } : { timeZone: 'UTC' }).format(new Date(value))
}

function safeUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}

function ArchivedTaskRow({ task }: { task: ArchivedTaskSummary }) {
  return <li className="archived-detail-task"><span className={`archived-task-status${task.completed ? ' is-completed' : ''}`}>{task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}</span><span><strong>{task.title}</strong>{task.description ? <small>{task.description}</small> : null}</span><span className="archived-task-metadata"><span>{task.priority ? priorityLabels[task.priority] : 'Sem prioridade'}</span><span><CalendarDays size={14} />{formatDate(task.dueDate)}</span>{task.archivedAt ? <em>Arquivada</em> : null}</span></li>
}

export function ArchivedListDetails({ item, onClose, onChanged }: CommonProps & { item: ArchivedListSummary }) {
  const [detail, setDetail] = useState<ArchivedListDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const loadDetail = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try { setDetail(await archiveService.getList(item.id)) } catch { setError('Não foi possível carregar esta Lista arquivada.') } finally { setIsLoading(false) }
  }, [item.id])

  useEffect(() => { void loadDetail() }, [loadDetail])
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || isProcessing) return
      if (isDeleteOpen) setIsDeleteOpen(false)
      else onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDeleteOpen, isProcessing, onClose])

  const restore = async () => {
    setIsProcessing(true); setError('')
    try { await listService.restore(item.id); await onChanged(); onClose() } catch { setError('Não foi possível restaurar esta Lista.') } finally { setIsProcessing(false) }
  }
  const remove = async () => {
    setIsProcessing(true); setError('')
    try { await listService.remove(item.id); await onChanged(); onClose() } catch { setError('Não foi possível excluir esta Lista definitivamente.') } finally { setIsProcessing(false) }
  }

  return <div className="area-modal-backdrop" role="presentation" onMouseDown={() => !isProcessing && onClose()}><section className="archived-detail-modal" role="dialog" aria-modal="true" aria-labelledby="archived-list-title" onMouseDown={(event) => event.stopPropagation()}><header className="archived-detail-header"><span className="archived-item-icon is-list"><List size={25} /></span><div><span className="archived-type is-list">Lista · Somente leitura</span><h2 id="archived-list-title">{item.title}</h2><p>Arquivada em {formatDate(item.archivedAt, true)}</p></div></header>{isLoading ? <div className="archived-detail-state"><LoaderCircle className="spin" size={29} />Carregando estrutura...</div> : null}{!isLoading && error && !detail ? <div className="archived-detail-state is-error"><AlertCircle size={29} /><p>{error}</p><button className="secondary-action" type="button" onClick={() => void loadDetail()}>Tentar novamente</button></div> : null}{detail ? <div className="archived-detail-content"><p className="archived-detail-description">{detail.description || 'Sem descrição.'}</p><span className="archived-detail-context"><Folder size={16} />Área: {detail.area.title}</span><section className="archived-structure-section"><h3>Tarefas <span>{detail.tasks.length}</span></h3>{detail.tasks.length ? <ul className="archived-detail-tasks">{detail.tasks.map((task) => <ArchivedTaskRow task={task} key={task.id} />)}</ul> : <p className="archived-structure-empty">Esta Lista não possui Tarefas.</p>}</section></div> : null}{error && detail ? <p className="area-form-error" role="alert"><AlertCircle size={18} />{error}</p> : null}{detail ? <div className="archived-detail-actions"><button className="restore-action" type="button" onClick={() => void restore()} disabled={isProcessing}>{isProcessing && !isDeleteOpen ? <LoaderCircle className="spin" size={18} /> : <RotateCcw size={18} />}Restaurar Lista</button><button className="danger-action" type="button" onClick={() => { setError(''); setIsDeleteOpen(true) }} disabled={isProcessing}><Trash2 size={18} />Excluir definitivamente</button></div> : null}</section>{isDeleteOpen ? <PermanentDeleteConfirm isProcessing={isProcessing} error={error} onCancel={() => setIsDeleteOpen(false)} onConfirm={remove} /> : null}</div>
}

export function ArchivedTaskDetails({ task, onClose, onChanged }: CommonProps & { task: ArchivedTaskSummary }) {
  const [detail, setDetail] = useState<ArchivedTaskDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const loadDetail = useCallback(async () => {
    setIsLoading(true); setError('')
    try { setDetail(await archiveService.getTask(task.id)) } catch { setError('Não foi possível carregar esta Tarefa arquivada.') } finally { setIsLoading(false) }
  }, [task.id])
  useEffect(() => { void loadDetail() }, [loadDetail])
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || isProcessing) return
      if (isDeleteOpen) setIsDeleteOpen(false)
      else onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDeleteOpen, isProcessing, onClose])

  const restore = async () => {
    setIsProcessing(true); setError('')
    try { await taskService.restore(task.id); await onChanged(); onClose() } catch { setError('Não foi possível restaurar esta Tarefa.') } finally { setIsProcessing(false) }
  }
  const remove = async () => {
    setIsProcessing(true); setError('')
    try { await taskService.remove(task.id); await onChanged(); onClose() } catch { setError('Não foi possível excluir esta Tarefa definitivamente.') } finally { setIsProcessing(false) }
  }

  return <div className="area-modal-backdrop" role="presentation" onMouseDown={() => !isProcessing && onClose()}><section className="archived-detail-modal archived-task-detail-modal" role="dialog" aria-modal="true" aria-labelledby="archived-task-title" onMouseDown={(event) => event.stopPropagation()}><header className="archived-detail-header"><span className="archived-item-icon is-task"><ListChecks size={25} /></span><div><span className="archived-type is-task">Tarefa · Somente leitura</span><h2 id="archived-task-title">{task.title}</h2><p>Arquivada em {formatDate(task.archivedAt, true)}</p></div></header>{isLoading ? <div className="archived-detail-state"><LoaderCircle className="spin" size={29} />Carregando conteúdo...</div> : null}{!isLoading && error && !detail ? <div className="archived-detail-state is-error"><AlertCircle size={29} /><p>{error}</p><button className="secondary-action" type="button" onClick={() => void loadDetail()}>Tentar novamente</button></div> : null}{detail ? <div className="archived-detail-content"><p className="archived-detail-description">{detail.description || 'Sem descrição.'}</p><span className="archived-detail-context"><Folder size={16} />{detail.list.area.title}<ChevronRightInline /><List size={16} />{detail.list.title}</span><dl className="archived-task-properties"><div><dt>Status</dt><dd>{detail.completed ? 'Concluída' : 'A fazer'}</dd></div><div><dt>Prioridade</dt><dd>{detail.priority ? priorityLabels[detail.priority] : 'Sem prioridade'}</dd></div><div><dt>Prazo</dt><dd>{formatDate(detail.dueDate)}</dd></div></dl><section className="archived-structure-section"><h3>Checklist <span>{detail.checklist.length}</span></h3>{detail.checklist.length ? <ul className="archived-readonly-list">{detail.checklist.map((item) => <li key={item.id}>{item.completed ? <CheckCircle2 size={17} /> : <Circle size={17} />}<span>{item.title}</span></li>)}</ul> : <p className="archived-structure-empty">Nenhum item no checklist.</p>}</section><section className="archived-structure-section"><h3>Links <span>{detail.links.length}</span></h3>{detail.links.length ? <ul className="archived-readonly-list">{detail.links.map((link) => <li key={link.id}><Link2 size={17} />{safeUrl(link.url) ? <a href={safeUrl(link.url)} target="_blank" rel="noreferrer">{link.title}<ExternalLink size={14} /></a> : <span>{link.title}</span>}</li>)}</ul> : <p className="archived-structure-empty">Nenhum link adicionado.</p>}</section></div> : null}{error && detail ? <p className="area-form-error" role="alert"><AlertCircle size={18} />{error}</p> : null}{detail ? <div className="archived-detail-actions"><button className="restore-action" type="button" onClick={() => void restore()} disabled={isProcessing}>{isProcessing && !isDeleteOpen ? <LoaderCircle className="spin" size={18} /> : <RotateCcw size={18} />}Restaurar</button><button className="danger-action" type="button" onClick={() => { setError(''); setIsDeleteOpen(true) }} disabled={isProcessing}><Trash2 size={18} />Excluir definitivamente</button></div> : null}</section>{isDeleteOpen ? <PermanentDeleteConfirm isProcessing={isProcessing} error={error} onCancel={() => setIsDeleteOpen(false)} onConfirm={remove} /> : null}</div>
}

function ChevronRightInline() { return <span aria-hidden="true">›</span> }

function PermanentDeleteConfirm({ isProcessing, error, onCancel, onConfirm }: { isProcessing: boolean; error: string; onCancel: () => void; onConfirm: () => Promise<void> }) {
  return <div className="area-modal-backdrop permanent-delete-backdrop" role="presentation" onMouseDown={() => !isProcessing && onCancel()}><section className="area-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="context-delete-title" aria-describedby="context-delete-description" onMouseDown={(event) => event.stopPropagation()}><span className="area-delete-icon" aria-hidden="true"><Trash2 size={29} /></span><div><h2 id="context-delete-title">Excluir permanentemente este item?</h2><p id="context-delete-description">Esta ação não poderá ser desfeita.</p>{error ? <p className="area-form-error" role="alert"><AlertCircle size={18} />{error}</p> : null}</div><div className="area-modal-actions"><button className="secondary-action" type="button" onClick={onCancel} disabled={isProcessing}>Cancelar</button><button className="danger-action" type="button" onClick={() => void onConfirm()} disabled={isProcessing}>{isProcessing ? <LoaderCircle className="spin" size={19} /> : <Trash2 size={19} />}Excluir definitivamente</button></div></section></div>
}
