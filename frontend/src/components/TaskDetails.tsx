import {
  AlertCircle,
  Archive,
  CalendarDays,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Info,
  Link2,
  ListChecks,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useModalFocusTrap } from '../hooks/useModalFocusTrap'
import checklistItemService, { ChecklistItem } from '../services/checklistItemService'
import linkService, { Link } from '../services/linkService'
import taskService, { Task, TaskPriority, UpdateTaskData } from '../services/taskService'
import { ArchivedModeBanner } from './ArchivedModeBanner'

type TaskDetailsProps = {
  task: Task
  listTitle?: string
  archivedMode?: boolean
  onClose: () => void
  onTaskChange?: (task: Task) => void
  onArchived?: () => void
}

type TaskField = 'title' | 'description' | 'status' | 'priority' | 'dueDate'
type PropertyMenu = 'status' | 'priority' | 'dueDate'

const priorityLabels: Record<TaskPriority, string> = { HIGH: 'Alta', MEDIUM: 'Média', LOW: 'Baixa' }

function formatDate(value: string | null, includeTime = false) {
  if (!value) return 'Não definido'
  return new Intl.DateTimeFormat('pt-BR', includeTime
    ? { dateStyle: 'short', timeStyle: 'short' }
    : { timeZone: 'UTC' },
  ).format(new Date(value))
}

function safeUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

function isValidDueDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [, yearText, monthText, dayText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  if (year < 2000 || year > 2100) return false

  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function TaskDetails({ task, listTitle, archivedMode = false, onClose, onTaskChange, onArchived }: TaskDetailsProps) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [isChecklistLoading, setIsChecklistLoading] = useState(true)
  const [isLinksLoading, setIsLinksLoading] = useState(true)
  const [checklistError, setChecklistError] = useState('')
  const [linksError, setLinksError] = useState('')
  const [actionError, setActionError] = useState('')
  const [checklistTitle, setChecklistTitle] = useState('')
  const [editingChecklistId, setEditingChecklistId] = useState<number | null>(null)
  const [checklistEditTitle, setChecklistEditTitle] = useState('')
  const [savingChecklistId, setSavingChecklistId] = useState<number | 'new' | null>(null)
  const [deletingChecklistId, setDeletingChecklistId] = useState<number | null>(null)
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [editingLinkId, setEditingLinkId] = useState<number | null>(null)
  const [linkEditTitle, setLinkEditTitle] = useState('')
  const [linkEditUrl, setLinkEditUrl] = useState('')
  const [savingLinkId, setSavingLinkId] = useState<number | 'new' | null>(null)
  const [deletingLinkId, setDeletingLinkId] = useState<number | null>(null)
  const [savingTaskField, setSavingTaskField] = useState<TaskField | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [openPropertyMenu, setOpenPropertyMenu] = useState<PropertyMenu | null>(null)
  const [isChecklistOpen, setIsChecklistOpen] = useState(true)
  const [isLinksOpen, setIsLinksOpen] = useState(true)
  const [isInformationOpen, setIsInformationOpen] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(task.title)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [descriptionDraft, setDescriptionDraft] = useState(task.description ?? '')
  const [dueDateDraft, setDueDateDraft] = useState(task.dueDate?.slice(0, 10) ?? '')
  const [dueDateError, setDueDateError] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const dateEditedWithKeyboardRef = useRef(false)
  const dueDateErrorRef = useRef(false)
  const detailsModalRef = useModalFocusTrap<HTMLElement>(true)
  const archiveModalRef = useModalFocusTrap<HTMLElement>(isArchiveConfirmOpen)

  const loadChecklist = useCallback(async () => {
    setIsChecklistLoading(true)
    setChecklistError('')
    try {
      const items = await checklistItemService.getAll()
      setChecklistItems(items.filter((item) => item.taskId === task.id))
    } catch {
      setChecklistError('Não foi possível carregar o checklist desta tarefa.')
    } finally {
      setIsChecklistLoading(false)
    }
  }, [task.id])

  const loadLinks = useCallback(async () => {
    setIsLinksLoading(true)
    setLinksError('')
    try {
      const allLinks = await linkService.getAll()
      setLinks(allLinks.filter((link) => link.taskId === task.id))
    } catch {
      setLinksError('Não foi possível carregar os links desta tarefa.')
    } finally {
      setIsLinksLoading(false)
    }
  }, [task.id])

  useEffect(() => { void loadChecklist(); void loadLinks() }, [loadChecklist, loadLinks])
  useEffect(() => { setTitleDraft(task.title) }, [task.title])
  useEffect(() => { setDescriptionDraft(task.description ?? '') }, [task.description])
  useEffect(() => { setDueDateDraft(task.dueDate?.slice(0, 10) ?? '') }, [task.dueDate])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (isArchiveConfirmOpen && !isArchiving) setIsArchiveConfirmOpen(false)
      else if (isMenuOpen) setIsMenuOpen(false)
      else if (openPropertyMenu) setOpenPropertyMenu(null)
      else if (isEditingTitle) { setIsEditingTitle(false); setTitleDraft(task.title) }
      else if (isEditingDescription) { setIsEditingDescription(false); setDescriptionDraft(task.description ?? '') }
      else if (!savingTaskField && savingChecklistId === null && savingLinkId === null) onClose()
    }
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false)
      if (!(event.target instanceof Element) || !event.target.closest('.task-property-dropdown')) {
        if (openPropertyMenu !== 'dueDate' || !dueDateErrorRef.current) setOpenPropertyMenu(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('click', handleOutsideClick)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('click', handleOutsideClick)
    }
  }, [isArchiveConfirmOpen, isArchiving, isEditingDescription, isEditingTitle, isMenuOpen, onClose, openPropertyMenu, savingChecklistId, savingLinkId, savingTaskField, task.description, task.title])

  const completedItems = useMemo(() => checklistItems.filter((item) => item.completed).length, [checklistItems])
  const progress = checklistItems.length ? Math.round((completedItems / checklistItems.length) * 100) : 0

  const updateTaskField = async (field: TaskField, payload: UpdateTaskData, message: string) => {
    setSavingTaskField(field)
    setActionError('')
    try {
      onTaskChange?.(await taskService.update(task.id, payload))
      return true
    } catch {
      setActionError(message)
      return false
    } finally {
      setSavingTaskField(null)
    }
  }

  const handleTitleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = titleDraft.trim()
    if (!title) return
    if (title === task.title || await updateTaskField('title', { title }, 'Não foi possível alterar o título.')) setIsEditingTitle(false)
  }

  const handleDescriptionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const description = descriptionDraft.trim()
    if (description === (task.description ?? '') || await updateTaskField('description', { description: description || null }, 'Não foi possível alterar a descrição.')) setIsEditingDescription(false)
  }

  const handleDescriptionKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || (!event.ctrlKey && !event.metaKey) || event.nativeEvent.isComposing) return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  const handleStatusChange = async (completed: boolean) => {
    setOpenPropertyMenu(null)
    if (completed === task.completed) return
    await updateTaskField('status', { completed, completedAt: completed ? new Date().toISOString() : null }, 'Não foi possível alterar o status.')
  }

  const handlePriorityChange = async (value: string) => {
    setOpenPropertyMenu(null)
    const priority = value ? value as TaskPriority : null
    if (priority === task.priority) return
    await updateTaskField('priority', { priority }, 'Não foi possível alterar a prioridade.')
  }

  const saveDueDate = async (value: string) => {
    if (!isValidDueDate(value)) {
      dueDateErrorRef.current = true
      setDueDateError('Data inválida. Use uma data entre 2000 e 2100.')
      return
    }
    dueDateErrorRef.current = false
    setDueDateError('')
    if ((task.dueDate?.slice(0, 10) ?? '') === value) {
      setOpenPropertyMenu(null)
      return
    }
    if (await updateTaskField('dueDate', { dueDate: `${value}T12:00:00.000Z` }, 'Não foi possível alterar o prazo.')) setOpenPropertyMenu(null)
  }

  const removeDueDate = async () => {
    if (!task.dueDate) return
    if (await updateTaskField('dueDate', { dueDate: null }, 'Não foi possível remover o prazo.')) {
      setDueDateDraft('')
      dueDateErrorRef.current = false
      setDueDateError('')
      setOpenPropertyMenu(null)
    }
  }

  const handleDueDateInput = (value: string, hasNativeError: boolean) => {
    const yearLength = value.split('-')[0]?.length ?? 0
    if (yearLength > 4) {
      dueDateErrorRef.current = true
      setDueDateError('O ano deve ter no máximo 4 dígitos.')
      return
    }

    setDueDateDraft(value)
    if (hasNativeError || !isValidDueDate(value)) {
      dueDateErrorRef.current = true
      setDueDateError('Data inválida. Use uma data entre 2000 e 2100.')
      return
    }

    dueDateErrorRef.current = false
    setDueDateError('')
    if (!dateEditedWithKeyboardRef.current) void saveDueDate(value)
  }

  const handleChecklistCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!checklistTitle.trim()) return
    setSavingChecklistId('new')
    setChecklistError('')
    try {
      await checklistItemService.create({ title: checklistTitle.trim(), taskId: task.id })
      setChecklistTitle('')
      await loadChecklist()
    } catch {
      setChecklistError('Não foi possível adicionar o item.')
    } finally {
      setSavingChecklistId(null)
    }
  }

  const startChecklistEdit = (item: ChecklistItem) => {
    setIsMenuOpen(false)
    setOpenPropertyMenu(null)
    setEditingChecklistId(item.id)
    setChecklistEditTitle(item.title)
    setChecklistError('')
  }

  const handleChecklistEdit = async (event: FormEvent<HTMLFormElement>, item: ChecklistItem) => {
    event.preventDefault()
    if (!checklistEditTitle.trim()) return
    setSavingChecklistId(item.id)
    setChecklistError('')
    try {
      await checklistItemService.update(item.id, { title: checklistEditTitle.trim() })
      setEditingChecklistId(null)
      await loadChecklist()
    } catch {
      setChecklistError('Não foi possível salvar o item.')
    } finally {
      setSavingChecklistId(null)
    }
  }

  const handleChecklistToggle = async (item: ChecklistItem) => {
    setSavingChecklistId(item.id)
    setChecklistError('')
    try {
      await checklistItemService.update(item.id, { completed: !item.completed })
      await loadChecklist()
    } catch {
      setChecklistError(`Não foi possível ${item.completed ? 'desmarcar' : 'concluir'} o item.`)
    } finally {
      setSavingChecklistId(null)
    }
  }

  const handleChecklistDelete = async (item: ChecklistItem) => {
    setDeletingChecklistId(item.id)
    setChecklistError('')
    try {
      await checklistItemService.remove(item.id)
      if (editingChecklistId === item.id) setEditingChecklistId(null)
      await loadChecklist()
    } catch {
      setChecklistError('Não foi possível excluir o item.')
    } finally {
      setDeletingChecklistId(null)
    }
  }

  const handleLinkCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!linkTitle.trim() || !linkUrl.trim()) return
    if (!safeUrl(linkUrl.trim())) { setLinksError('Informe uma URL válida iniciada por http:// ou https://.'); return }
    setSavingLinkId('new')
    setLinksError('')
    try {
      await linkService.create({ title: linkTitle.trim(), url: linkUrl.trim(), taskId: task.id })
      setLinkTitle('')
      setLinkUrl('')
      await loadLinks()
    } catch {
      setLinksError('Não foi possível adicionar o link.')
    } finally {
      setSavingLinkId(null)
    }
  }

  const startLinkEdit = (link: Link) => {
    setIsMenuOpen(false)
    setOpenPropertyMenu(null)
    setEditingLinkId(link.id)
    setLinkEditTitle(link.title)
    setLinkEditUrl(link.url)
    setLinksError('')
  }

  const handleLinkEdit = async (event: FormEvent<HTMLFormElement>, link: Link) => {
    event.preventDefault()
    if (!linkEditTitle.trim() || !linkEditUrl.trim()) return
    if (!safeUrl(linkEditUrl.trim())) { setLinksError('Informe uma URL válida iniciada por http:// ou https://.'); return }
    setSavingLinkId(link.id)
    setLinksError('')
    try {
      await linkService.update(link.id, { title: linkEditTitle.trim(), url: linkEditUrl.trim() })
      setEditingLinkId(null)
      await loadLinks()
    } catch {
      setLinksError('Não foi possível salvar o link.')
    } finally {
      setSavingLinkId(null)
    }
  }

  const handleLinkDelete = async (link: Link) => {
    setDeletingLinkId(link.id)
    setLinksError('')
    try {
      await linkService.remove(link.id)
      if (editingLinkId === link.id) setEditingLinkId(null)
      await loadLinks()
    } catch {
      setLinksError('Não foi possível excluir o link.')
    } finally {
      setDeletingLinkId(null)
    }
  }

  const closeDetails = () => {
    if (!savingTaskField && savingChecklistId === null && savingLinkId === null && deletingChecklistId === null && deletingLinkId === null) onClose()
  }

  const handleArchive = async () => {
    setIsArchiving(true)
    setActionError('')
    try {
      await taskService.archive(task.id)
      onArchived?.()
    } catch {
      setActionError('Não foi possível arquivar a tarefa.')
      setIsArchiveConfirmOpen(false)
    } finally {
      setIsArchiving(false)
    }
  }

  return (
    <div className="area-modal-backdrop task-details-backdrop" role="presentation" onMouseDown={closeDetails}>
      <section ref={detailsModalRef} className={`task-details-modal${task.completed ? ' is-completed' : ''}${archivedMode ? ' is-archived' : ''}`} role="dialog" aria-modal="true" aria-label={task.title} tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
        <header className="task-details-header">
          <button className={`task-complete-button${task.completed ? ' is-completed' : ''}`} type="button" onClick={() => void handleStatusChange(!task.completed)} disabled={savingTaskField === 'status'} aria-label={task.completed ? 'Reabrir tarefa' : 'Concluir tarefa'}>
            {savingTaskField === 'status' ? <LoaderCircle className="spin" size={19} /> : task.completed ? <Check size={18} /> : null}
          </button>
          <div className="task-title-area">
            {isEditingTitle ? (
              <form className="task-title-form" onSubmit={handleTitleSubmit}>
                <input autoFocus maxLength={100} required value={titleDraft} onChange={(event) => setTitleDraft(event.target.value)} aria-label="Título da tarefa" />
                <button type="submit" disabled={!titleDraft.trim() || savingTaskField === 'title'} aria-label="Salvar título">{savingTaskField === 'title' ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />}</button>
                <button type="button" onClick={() => { setIsEditingTitle(false); setTitleDraft(task.title) }} disabled={savingTaskField === 'title'} aria-label="Cancelar edição do título"><X size={18} /></button>
              </form>
            ) : (
              <button className="task-title-button" type="button" onClick={() => setIsEditingTitle(true)} aria-label="Editar título da tarefa"><h2 id="task-details-title">{task.title}</h2><Pencil size={16} /></button>
            )}
            <div className="task-title-context">
              <span><ListChecks size={16} />Lista: <strong>{listTitle ?? `#${task.listId}`}</strong></span>
              <span className={`task-status-badge${task.completed ? ' is-completed' : ''}`}><i />{task.completed ? 'Concluída' : 'A fazer'}</span>
            </div>
          </div>
          {!archivedMode ? <div className="task-actions-menu" ref={menuRef}>
            <button className="icon-button task-details-more" type="button" onClick={() => { setOpenPropertyMenu(null); setIsMenuOpen((current) => !current) }} aria-expanded={isMenuOpen} aria-haspopup="menu" aria-label="Mais ações"><MoreHorizontal size={24} /></button>
            {isMenuOpen ? (
              <div className="task-actions-popover" role="menu">
                <button type="button" role="menuitem" onClick={() => { setIsMenuOpen(false); setIsArchiveConfirmOpen(true) }}><Archive size={17} />Arquivar</button>
              </div>
            ) : null}
          </div> : null}
          <button className="icon-button task-details-close" type="button" onClick={closeDetails} aria-label="Voltar para a lista" data-modal-initial-focus><X size={25} /></button>
        </header>

        {archivedMode ? <ArchivedModeBanner /> : null}

        {actionError ? <p className="area-form-error" role="alert"><AlertCircle size={18} />{actionError}</p> : null}

        <div className="task-details-grid">
          <div className="task-details-main">
            <section className={`task-detail-card task-description-card${isEditingDescription ? ' is-editing' : ''}`}>
              <h3><FileText size={20} />Descrição</h3>
              {isEditingDescription ? (
                <form className="task-description-form" onSubmit={handleDescriptionSubmit}>
                  <textarea autoFocus maxLength={500} rows={5} value={descriptionDraft} onChange={(event) => setDescriptionDraft(event.target.value)} onKeyDown={handleDescriptionKeyDown} placeholder="Adicione uma descrição..." aria-label="Descrição da tarefa" aria-keyshortcuts="Control+Enter Meta+Enter" />
                  <div><button className="primary-action" type="submit" disabled={savingTaskField === 'description'}>{savingTaskField === 'description' ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}Salvar</button><button className="secondary-action" type="button" onClick={() => { setIsEditingDescription(false); setDescriptionDraft(task.description ?? '') }} disabled={savingTaskField === 'description'}>Cancelar</button></div>
                </form>
              ) : (
                <button className="task-description-button" type="button" onClick={() => setIsEditingDescription(true)}><span>{task.description || 'Adicione uma descrição...'}</span><Pencil size={16} /></button>
              )}
            </section>

            <section className="task-detail-card">
              <button className="task-detail-section-heading" type="button" onClick={() => setIsChecklistOpen((current) => !current)} aria-expanded={isChecklistOpen}>
                <span><CheckSquare size={21} /><strong>Checklist</strong></span><span className="task-detail-heading-meta">{checklistItems.length ? `${completedItems}/${checklistItems.length} concluídos` : 'Opcional'}{isChecklistOpen ? <ChevronUp size={19} /> : <ChevronDown size={19} />}</span>
              </button>
              {checklistItems.length ? <div className="checklist-progress" aria-label={`${progress}% do checklist concluído`}><span><i style={{ width: `${progress}%` }} /></span><strong>{progress}%</strong></div> : null}
              {isChecklistOpen ? (
                <div className="task-detail-section-body">
                  <form className="checklist-form" onSubmit={handleChecklistCreate}>
                    <input maxLength={100} value={checklistTitle} onChange={(event) => setChecklistTitle(event.target.value)} placeholder="Adicionar item ao checklist" aria-label="Novo item do checklist" />
                    <button className="primary-action" type="submit" disabled={!checklistTitle.trim() || savingChecklistId !== null}>{savingChecklistId === 'new' ? <LoaderCircle className="spin" size={18} /> : <Plus size={18} />}Adicionar item</button>
                  </form>
                  {checklistError ? <p className="area-form-error" role="alert"><AlertCircle size={18} />{checklistError}</p> : null}
                  {isChecklistLoading ? <div className="task-inline-state"><LoaderCircle className="spin" size={24} />Carregando checklist...</div> : null}
                  {!isChecklistLoading && !checklistError && checklistItems.length === 0 ? <div className="task-inline-state"><ListChecks size={25} />Nenhum item adicionado.</div> : null}
                  {!isChecklistLoading && checklistItems.length > 0 ? (
                    <div className="checklist-items">
                      {checklistItems.map((item) => editingChecklistId === item.id ? (
                        <form className="checklist-item checklist-item-edit" key={item.id} onSubmit={(event) => void handleChecklistEdit(event, item)}>
                          <span className="task-complete-button is-placeholder" aria-hidden="true" />
                          <input autoFocus maxLength={100} required value={checklistEditTitle} onChange={(event) => setChecklistEditTitle(event.target.value)} aria-label={`Editar ${item.title}`} />
                          <div className="inline-edit-actions"><button type="submit" disabled={!checklistEditTitle.trim() || savingChecklistId === item.id} aria-label={`Salvar ${item.title}`}>{savingChecklistId === item.id ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}</button><button type="button" onClick={() => setEditingChecklistId(null)} disabled={savingChecklistId === item.id} aria-label="Cancelar edição"><X size={16} /></button></div>
                        </form>
                      ) : (
                        <div className={`checklist-item${item.completed ? ' is-completed' : ''}`} key={item.id}>
                          <button className="task-complete-button" type="button" onClick={() => void handleChecklistToggle(item)} disabled={savingChecklistId === item.id || deletingChecklistId === item.id} aria-label={item.completed ? `Desmarcar ${item.title}` : `Concluir ${item.title}`}>{savingChecklistId === item.id ? <LoaderCircle className="spin" size={17} /> : item.completed ? <Check size={16} /> : null}</button>
                          <span>{item.title}</span>
                          <div className="task-item-actions"><button type="button" onClick={() => startChecklistEdit(item)} disabled={savingChecklistId !== null || deletingChecklistId !== null} aria-label={`Editar ${item.title}`}><Pencil size={15} /></button><button type="button" onClick={() => void handleChecklistDelete(item)} disabled={savingChecklistId !== null || deletingChecklistId !== null} aria-label={`Excluir ${item.title}`}>{deletingChecklistId === item.id ? <LoaderCircle className="spin" size={15} /> : <Trash2 size={15} />}</button></div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>

            <section className="task-detail-card">
              <button className="task-detail-section-heading" type="button" onClick={() => setIsLinksOpen((current) => !current)} aria-expanded={isLinksOpen}>
                <span><Link2 size={21} /><strong>Links e referências</strong></span><span className="task-detail-heading-meta">{links.length} {links.length === 1 ? 'link' : 'links'}{isLinksOpen ? <ChevronUp size={19} /> : <ChevronDown size={19} />}</span>
              </button>
              {isLinksOpen ? (
                <div className="task-detail-section-body">
                  <form className="link-form" onSubmit={handleLinkCreate}>
                    <input maxLength={100} required value={linkTitle} onChange={(event) => setLinkTitle(event.target.value)} placeholder="Título do link" aria-label="Título do novo link" />
                    <input type="url" required value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://exemplo.com" aria-label="URL do novo link" />
                    <button className="primary-action" type="submit" disabled={!linkTitle.trim() || !linkUrl.trim() || savingLinkId !== null}>{savingLinkId === 'new' ? <LoaderCircle className="spin" size={18} /> : <Plus size={18} />}Adicionar link</button>
                  </form>
                  {linksError ? <p className="area-form-error" role="alert"><AlertCircle size={18} />{linksError}</p> : null}
                  {isLinksLoading ? <div className="task-inline-state"><LoaderCircle className="spin" size={24} />Carregando links...</div> : null}
                  {!isLinksLoading && !linksError && links.length === 0 ? <div className="task-inline-state"><Link2 size={24} />Nenhum link adicionado.</div> : null}
                  {!isLinksLoading && links.length > 0 ? (
                    <div className="links-items">
                      {links.map((link) => editingLinkId === link.id ? (
                        <form className="link-item link-item-edit" key={link.id} onSubmit={(event) => void handleLinkEdit(event, link)}>
                          <span className="link-edit-context"><Pencil size={14} />Editando link</span>
                          <input autoFocus maxLength={100} required value={linkEditTitle} onChange={(event) => setLinkEditTitle(event.target.value)} aria-label={`Título de ${link.title}`} />
                          <input type="url" required value={linkEditUrl} onChange={(event) => setLinkEditUrl(event.target.value)} aria-label={`URL de ${link.title}`} />
                          <div className="inline-edit-actions"><button type="submit" disabled={savingLinkId === link.id} aria-label={`Salvar ${link.title}`}>{savingLinkId === link.id ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}</button><button type="button" onClick={() => setEditingLinkId(null)} disabled={savingLinkId === link.id} aria-label="Cancelar edição"><X size={16} /></button></div>
                        </form>
                      ) : (
                        <div className="link-item" key={link.id}>
                          <a className="link-item-open" href={safeUrl(link.url) ?? undefined} target="_blank" rel="noreferrer" aria-label={`Abrir ${link.title} em nova aba`}><Link2 size={18} /><span><strong>{link.title}</strong><small>{link.url}</small></span><ExternalLink size={16} /></a>
                          <div className="task-item-actions"><button type="button" onClick={() => startLinkEdit(link)} disabled={savingLinkId !== null || deletingLinkId !== null} aria-label={`Editar ${link.title}`}><Pencil size={15} /></button><button type="button" onClick={() => void handleLinkDelete(link)} disabled={savingLinkId !== null || deletingLinkId !== null} aria-label={`Excluir ${link.title}`}>{deletingLinkId === link.id ? <LoaderCircle className="spin" size={15} /> : <Trash2 size={15} />}</button></div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          </div>

          <aside className="task-details-aside">
            <section className="task-detail-card task-properties-card" aria-label="Propriedades da tarefa">
              <h3>Detalhes</h3>
              <div className="task-property-row">
                <span className="task-property-label">Status</span>
                <div className="task-property-dropdown">
                  <button className="task-property-control" type="button" onClick={() => { setIsMenuOpen(false); setOpenPropertyMenu((current) => current === 'status' ? null : 'status') }} disabled={savingTaskField !== null} aria-haspopup="menu" aria-expanded={openPropertyMenu === 'status'}>
                    <i className={task.completed ? 'is-completed' : ''} />{savingTaskField === 'status' ? <LoaderCircle className="spin" size={17} /> : null}<span>{task.completed ? 'Concluída' : 'A fazer'}</span><ChevronDown size={17} />
                  </button>
                  {openPropertyMenu === 'status' ? <div className="task-property-popover" role="menu"><button type="button" role="menuitem" onClick={() => void handleStatusChange(false)}><i className="status-dot" />A fazer{!task.completed ? <Check size={16} /> : null}</button><button type="button" role="menuitem" onClick={() => void handleStatusChange(true)}><i className="status-dot is-completed" />Concluída{task.completed ? <Check size={16} /> : null}</button></div> : null}
                </div>
              </div>
              <div className="task-property-row">
                <span className="task-property-label">Prioridade</span>
                <div className="task-property-dropdown">
                  <button className={`task-property-control task-priority${task.priority ? ` is-${task.priority.toLowerCase()}` : ''}`} type="button" onClick={() => { setIsMenuOpen(false); setOpenPropertyMenu((current) => current === 'priority' ? null : 'priority') }} disabled={savingTaskField !== null} aria-haspopup="menu" aria-expanded={openPropertyMenu === 'priority'}>
                    {savingTaskField === 'priority' ? <LoaderCircle className="spin" size={17} /> : null}<span>{task.priority ? priorityLabels[task.priority] : 'Sem prioridade'}</span><ChevronDown size={17} />
                  </button>
                  {openPropertyMenu === 'priority' ? <div className="task-property-popover" role="menu">{[['', 'Sem prioridade'], ...Object.entries(priorityLabels)].map(([value, label]) => <button type="button" role="menuitem" key={value || 'none'} onClick={() => void handlePriorityChange(value)}><i className={`priority-mark${value ? ` is-${value.toLowerCase()}` : ''}`} />{label}{(task.priority ?? '') === value ? <Check size={16} /> : null}</button>)}</div> : null}
                </div>
              </div>
              <div className="task-property-row">
                <span className="task-property-label"><CalendarDays size={16} />Prazo</span>
                <div className="task-property-dropdown">
                  <button className="task-property-control" type="button" onClick={() => { setIsMenuOpen(false); setDueDateDraft(task.dueDate?.slice(0, 10) ?? ''); dueDateErrorRef.current = false; setDueDateError(''); dateEditedWithKeyboardRef.current = false; setOpenPropertyMenu((current) => current === 'dueDate' ? null : 'dueDate') }} disabled={savingTaskField !== null} aria-haspopup="dialog" aria-expanded={openPropertyMenu === 'dueDate'}>
                    {savingTaskField === 'dueDate' ? <LoaderCircle className="spin" size={17} /> : <CalendarDays size={17} />}<span>{formatDate(task.dueDate)}</span><ChevronDown size={17} />
                  </button>
                  {openPropertyMenu === 'dueDate' ? <div className="task-property-popover task-date-popover" role="dialog" aria-label="Selecionar prazo"><input autoFocus className={dueDateError ? 'is-error' : ''} type="date" min="2000-01-01" max="2100-12-31" value={dueDateDraft} onPointerDown={() => { dateEditedWithKeyboardRef.current = false }} onKeyDown={(event) => { dateEditedWithKeyboardRef.current = true; if (event.key === 'Enter') { event.preventDefault(); void saveDueDate(event.currentTarget.value) } }} onInput={(event) => handleDueDateInput(event.currentTarget.value, !event.currentTarget.validity.valid)} onBlur={(event) => void saveDueDate(event.currentTarget.value)} disabled={savingTaskField !== null} aria-label="Data do prazo" aria-invalid={Boolean(dueDateError)} aria-describedby={dueDateError ? 'task-due-date-error' : undefined} />{dueDateError ? <span className="task-date-error" id="task-due-date-error" role="alert"><AlertCircle size={14} />{dueDateError}</span> : null}{task.dueDate ? <button className="task-date-clear" type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => void removeDueDate()} disabled={savingTaskField !== null}><X size={16} />Sem prazo</button> : null}</div> : null}
                </div>
              </div>
            </section>
            <section className="task-detail-card task-information-card">
              <button type="button" onClick={() => setIsInformationOpen((current) => !current)} aria-expanded={isInformationOpen}><span><Info size={20} />Informações</span>{isInformationOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
              {isInformationOpen ? <dl><div><dt>Criada em</dt><dd>{formatDate(task.createdAt, true)}</dd></div><div><dt>Última edição</dt><dd>{formatDate(task.updatedAt, true)}</dd></div>{task.completedAt ? <div><dt>Concluída em</dt><dd>{formatDate(task.completedAt, true)}</dd></div> : null}</dl> : null}
            </section>
          </aside>
        </div>
      </section>
      {!archivedMode && isArchiveConfirmOpen ? (
        <div className="area-modal-backdrop nested-confirm-backdrop" role="presentation" onMouseDown={(event) => { event.stopPropagation(); if (!isArchiving) setIsArchiveConfirmOpen(false) }}>
          <section ref={archiveModalRef} className="area-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="task-archive-title" aria-describedby="task-archive-description" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
            <span className="area-delete-icon archive-confirm-icon" aria-hidden="true"><Archive size={29} /></span>
            <div><h2 id="task-archive-title">Arquivar este item?</h2><p id="task-archive-description">Ele deixará de aparecer normalmente, mas poderá ser restaurado posteriormente.</p></div>
            <div className="area-modal-actions"><button className="secondary-action" type="button" onClick={() => setIsArchiveConfirmOpen(false)} disabled={isArchiving} data-modal-initial-focus>Cancelar</button><button className="primary-action" type="button" onClick={() => void handleArchive()} disabled={isArchiving}>{isArchiving ? <LoaderCircle className="spin" size={19} /> : <Archive size={19} />}Arquivar</button></div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
