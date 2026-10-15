import {
  AlertCircle,
  Archive,
  ChevronRight,
  Folder,
  LayoutGrid,
  List as ListIcon,
  ListPlus,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  X,
} from 'lucide-react'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ArchivedModeBanner } from '../components/ArchivedModeBanner'
import archiveService, { ArchivedAreaDetail } from '../services/archiveService'
import areaService from '../services/areaService'
import listService, { CreateListData, List } from '../services/listService'
import taskService from '../services/taskService'

type ListForm = {
  title: string
  description: string
}

type ViewMode = 'list' | 'cards'

type ListTaskCount = {
  total: number
  pending: number
  completed: number
}

const emptyListForm: ListForm = {
  title: '',
  description: '',
}

export function AreaLists({ archivedMode = false }: { archivedMode?: boolean }) {
  const { areaId } = useParams()
  const selectedAreaId = Number(areaId)
  const [lists, setLists] = useState<List[]>([])
  const [archivedArea, setArchivedArea] = useState<ArchivedAreaDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditingArchivedArea, setIsEditingArchivedArea] = useState(false)
  const [editingList, setEditingList] = useState<List | null>(null)
  const [archiveCandidate, setArchiveCandidate] = useState<List | null>(null)
  const [form, setForm] = useState<ListForm>(emptyListForm)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [taskCounts, setTaskCounts] = useState<Record<number, ListTaskCount>>({})

  const loadLists = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')

    if (!Number.isInteger(selectedAreaId) || selectedAreaId <= 0) {
      setLists([])
      setLoadError('Não foi possível identificar a área selecionada.')
      setIsLoading(false)
      return
    }

    try {
      if (archivedMode) {
        const area = await archiveService.getArea(selectedAreaId)
        setArchivedArea(area)
        setLists(area.lists.map((list) => ({ ...list, areaId: selectedAreaId, createdAt: '', updatedAt: '' })))
      } else {
        const [allLists, allTasks] = await Promise.all([listService.getAll(), taskService.getAll()])
        const areaLists = allLists.filter((list) => list.areaId === selectedAreaId)
        setLists(areaLists)
        setTaskCounts(Object.fromEntries(areaLists.map((list) => {
          const listTasks = allTasks.filter((task) => task.listId === list.id)
          return [list.id, {
            total: listTasks.length,
            pending: listTasks.filter((task) => !task.completed).length,
            completed: listTasks.filter((task) => task.completed).length,
          }]
        })))
      }
    } catch {
      setLists([])
      setArchivedArea(null)
      setLoadError(archivedMode ? 'Não foi possível carregar esta área arquivada.' : 'Não foi possível carregar as listas desta área.')
    } finally {
      setIsLoading(false)
    }
  }, [archivedMode, selectedAreaId])

  useEffect(() => {
    void loadLists()
  }, [loadLists])

  useEffect(() => {
    if (!isModalOpen && !archiveCandidate) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (isModalOpen && !isSaving) setIsModalOpen(false)
      if (archiveCandidate && !isArchiving) setArchiveCandidate(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [archiveCandidate, isArchiving, isModalOpen, isSaving])

  const openCreateModal = () => {
    setIsEditingArchivedArea(false)
    setEditingList(null)
    setForm(emptyListForm)
    setActionError('')
    setIsModalOpen(true)
  }

  const openEditModal = (list: List) => {
    setIsEditingArchivedArea(false)
    setEditingList(list)
    setForm({ title: list.title, description: list.description ?? '' })
    setActionError('')
    setIsModalOpen(true)
  }

  const openArchivedAreaEdit = () => {
    if (!archivedArea) return
    setIsEditingArchivedArea(true)
    setEditingList(null)
    setForm({ title: archivedArea.title, description: archivedArea.description ?? '' })
    setActionError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (!isSaving) setIsModalOpen(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.title.trim() || !Number.isInteger(selectedAreaId)) return

    setIsSaving(true)
    setActionError('')

    const payload: CreateListData = {
      title: form.title.trim(),
      description: form.description.trim(),
      areaId: selectedAreaId,
    }

    try {
      if (isEditingArchivedArea) {
        await areaService.update(selectedAreaId, { title: payload.title, description: payload.description })
      } else if (editingList) {
        await listService.update(editingList.id, { title: payload.title, description: payload.description })
      } else {
        await listService.create(payload)
      }

      setIsModalOpen(false)
      await loadLists()
    } catch {
      setActionError(isEditingArchivedArea ? 'Não foi possível salvar a área.' : `Não foi possível ${editingList ? 'salvar' : 'criar'} a lista.`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleArchive = async () => {
    if (!archiveCandidate) return

    setIsArchiving(true)
    setActionError('')

    try {
      await listService.archive(archiveCandidate.id)
      setArchiveCandidate(null)
      await loadLists()
    } catch {
      setActionError('Não foi possível arquivar a lista.')
    } finally {
      setIsArchiving(false)
    }
  }

  return (
    <section className="lists-page" aria-labelledby="lists-title">
      <div className="lists-page-heading">
        <div>
          <p>Área selecionada</p>
          <h1 id="lists-title">Listas</h1>
          <span>Organize as tarefas desta área em listas.</span>
        </div>
        {!archivedMode ? <button className="primary-action" type="button" onClick={openCreateModal}>
          <Plus size={20} aria-hidden="true" />
          Nova Lista
        </button> : <button className="secondary-action" type="button" onClick={openArchivedAreaEdit}><Pencil size={18} aria-hidden="true" />Editar Área</button>}
      </div>

      {archivedMode && archivedArea ? <ArchivedModeBanner /> : null}

      {actionError && !isModalOpen && !archiveCandidate ? (
        <p className="lists-action-error" role="alert"><AlertCircle size={19} />{actionError}</p>
      ) : null}

      {isLoading ? (
        <div className="lists-state" aria-live="polite">
          <LoaderCircle className="spin" size={32} aria-hidden="true" />
          <h2>Carregando listas...</h2>
          <p>Aguarde enquanto buscamos os dados desta área.</p>
        </div>
      ) : null}

      {!isLoading && loadError ? (
        <div className="lists-state is-error" role="alert">
          <AlertCircle size={36} aria-hidden="true" />
          <h2>Erro ao carregar</h2>
          <p>{loadError}</p>
          <button className="secondary-action" type="button" onClick={() => void loadLists()}>Tentar novamente</button>
        </div>
      ) : null}

      {!isLoading && !loadError && lists.length === 0 ? (
        <div className="lists-state">
          <span className="lists-state-icon" aria-hidden="true"><ListPlus size={38} /></span>
          <h2>Nenhuma lista criada</h2>
          <p>{archivedMode ? 'Esta área não possui listas.' : 'Crie a primeira lista para organizar as tarefas desta área.'}</p>
          {!archivedMode ? <button className="primary-action" type="button" onClick={openCreateModal}>
            <Plus size={20} aria-hidden="true" />
            Criar Lista
          </button> : null}
        </div>
      ) : null}

      {!isLoading && !loadError && lists.length > 0 ? (
        <>
          {!archivedMode ? (
            <div className="view-mode-toolbar">
              <span>Visualização</span>
              <div className="view-mode-toggle" role="group" aria-label="Modo de visualização das listas">
                <button className={viewMode === 'list' ? 'is-active' : ''} type="button" onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'}><ListIcon size={18} />Lista</button>
                <button className={viewMode === 'cards' ? 'is-active' : ''} type="button" onClick={() => setViewMode('cards')} aria-pressed={viewMode === 'cards'}><LayoutGrid size={18} />Cards</button>
              </div>
            </div>
          ) : null}

          {!archivedMode && viewMode === 'cards' ? (
            <div className="list-cards-grid" aria-live="polite">
              {lists.map((list) => {
                const count = taskCounts[list.id] ?? { total: 0, pending: 0, completed: 0 }
                return (
                  <article className="list-summary-card" key={list.id}>
                    <Link className="list-summary-card-link" to={`/areas/${selectedAreaId}/listas/${list.id}`} aria-label={`Abrir lista ${list.title}`}>
                      <span className="list-summary-main">
                        <span className="list-card-icon" aria-hidden="true"><Folder size={23} /></span>
                        <strong>{list.title}</strong>
                      </span>
                      <span className="list-summary-status">
                        <span>{count.total} {count.total === 1 ? 'tarefa' : 'tarefas'}</span>
                        <span>{count.pending} {count.pending === 1 ? 'pendente' : 'pendentes'}</span>
                        <span>{count.completed} {count.completed === 1 ? 'concluída' : 'concluídas'}</span>
                      </span>
                    </Link>
                    <details className="card-actions-menu">
                      <summary aria-label={`Ações de ${list.title}`}><MoreHorizontal size={20} aria-hidden="true" /></summary>
                      <div>
                        <button type="button" onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); openEditModal(list) }}><Pencil size={16} />Editar</button>
                        <button type="button" onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); setActionError(''); setArchiveCandidate(list) }}><Archive size={16} />Arquivar</button>
                      </div>
                    </details>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="lists-grid" aria-live="polite">
              {lists.map((list) => (
                <article className="list-card" key={list.id}>
                  {archivedMode ? <Link className="list-card-content" to={`/arquivados/listas/${list.id}`}>
                    <span className="list-card-icon" aria-hidden="true"><Folder size={26} /></span>
                    <span>
                      <strong>{list.title}</strong>
                      <small>{list.description || 'Sem descrição'}</small>
                    </span>
                    <ChevronRight size={22} aria-hidden="true" />
                  </Link> : <Link className="list-card-content" to={`/areas/${selectedAreaId}/listas/${list.id}`}>
                    <span className="list-card-icon" aria-hidden="true"><Folder size={26} /></span>
                    <span><strong>{list.title}</strong><small>{list.description || 'Sem descrição'}</small></span>
                    <ChevronRight size={22} aria-hidden="true" />
                  </Link>}
                  <div className="list-card-actions">
                    <button type="button" onClick={() => openEditModal(list)} aria-label={`Editar ${list.title}`}>
                      <Pencil size={17} aria-hidden="true" />
                    </button>
                    {!archivedMode ? <button type="button" onClick={() => { setActionError(''); setArchiveCandidate(list) }} aria-label={`Arquivar ${list.title}`}>
                      <Archive size={17} aria-hidden="true" />
                    </button> : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      ) : null}

      {isModalOpen ? (
        <div className="area-modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <section className="area-modal list-modal" role="dialog" aria-modal="true" aria-labelledby="list-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="area-modal-heading">
              <span className="area-modal-heading-icon" aria-hidden="true">
                <Folder size={31} />
                <Plus className="area-modal-heading-plus" size={17} />
              </span>
              <div>
                <h2 id="list-modal-title">{isEditingArchivedArea ? 'Editar Área' : editingList ? 'Editar Lista' : 'Nova Lista'}</h2>
                <p>{isEditingArchivedArea ? 'Atualize os dados desta área.' : editingList ? 'Atualize os dados desta lista.' : 'Crie uma lista para organizar as tarefas desta área.'}</p>
              </div>
              <button className="icon-button area-modal-close" type="button" onClick={closeModal} aria-label="Fechar"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="area-form-field">
                <span>Nome da {isEditingArchivedArea ? 'Área' : 'Lista'} <strong>*</strong></span>
                <input autoFocus maxLength={50} required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Ex.: Estudos, Projetos, Rotina..." />
                <small>{form.title.length}/50</small>
              </label>
              <label className="area-form-field">
                <span>Descrição</span>
                <textarea maxLength={200} rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Ex.: Tarefas relacionadas a esta lista." />
                <small>{form.description.length}/200</small>
              </label>

              {actionError ? <p className="area-form-error" role="alert"><AlertCircle size={18} />{actionError}</p> : null}

              <div className="area-modal-actions">
                <button className="secondary-action" type="button" onClick={closeModal} disabled={isSaving}>Cancelar</button>
                <button className="primary-action" type="submit" disabled={isSaving || !form.title.trim()}>
                  {isSaving ? <LoaderCircle className="spin" size={19} aria-hidden="true" /> : null}
                  {isEditingArchivedArea || editingList ? 'Salvar alterações' : 'Criar Lista'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {!archivedMode && archiveCandidate ? (
        <div className="area-modal-backdrop" role="presentation" onMouseDown={() => !isArchiving && setArchiveCandidate(null)}>
          <section className="area-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="list-archive-title" aria-describedby="list-archive-description" onMouseDown={(event) => event.stopPropagation()}>
            <span className="area-delete-icon archive-confirm-icon" aria-hidden="true"><Archive size={29} /></span>
            <div>
              <h2 id="list-archive-title">Arquivar este item?</h2>
              <p id="list-archive-description">Ele deixará de aparecer normalmente, mas poderá ser restaurado posteriormente.</p>
              {actionError ? <p className="area-form-error" role="alert"><AlertCircle size={18} />{actionError}</p> : null}
            </div>
            <div className="area-modal-actions">
              <button className="secondary-action" type="button" onClick={() => setArchiveCandidate(null)} disabled={isArchiving}>Cancelar</button>
              <button className="primary-action" type="button" onClick={() => void handleArchive()} disabled={isArchiving}>
                {isArchiving ? <LoaderCircle className="spin" size={19} aria-hidden="true" /> : <Archive size={19} aria-hidden="true" />}
                Arquivar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}
