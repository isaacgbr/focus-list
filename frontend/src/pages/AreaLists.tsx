import {
  AlertCircle,
  Archive,
  ChevronRight,
  Folder,
  ListPlus,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ArchivedListDetails } from '../components/ArchivedItemDetails'
import archiveService, { ArchivedListSummary } from '../services/archiveService'
import listService, { CreateListData, List } from '../services/listService'

type ListForm = {
  title: string
  description: string
}

const emptyListForm: ListForm = {
  title: '',
  description: '',
}

export function AreaLists() {
  const { areaId } = useParams()
  const selectedAreaId = Number(areaId)
  const [lists, setLists] = useState<List[]>([])
  const [archivedLists, setArchivedLists] = useState<ArchivedListSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingList, setEditingList] = useState<List | null>(null)
  const [archiveCandidate, setArchiveCandidate] = useState<List | null>(null)
  const [selectedArchivedList, setSelectedArchivedList] = useState<ArchivedListSummary | null>(null)
  const [form, setForm] = useState<ListForm>(emptyListForm)

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
      const [allLists, archived] = await Promise.all([listService.getAll(), archiveService.getListsByArea(selectedAreaId)])
      setLists(allLists.filter((list) => list.areaId === selectedAreaId))
      setArchivedLists(archived)
    } catch {
      setLists([])
      setArchivedLists([])
      setLoadError('Não foi possível carregar as listas desta área.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedAreaId])

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
    setEditingList(null)
    setForm(emptyListForm)
    setActionError('')
    setIsModalOpen(true)
  }

  const openEditModal = (list: List) => {
    setEditingList(list)
    setForm({ title: list.title, description: list.description ?? '' })
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
      if (editingList) {
        await listService.update(editingList.id, payload)
      } else {
        await listService.create(payload)
      }

      setIsModalOpen(false)
      await loadLists()
    } catch {
      setActionError(`Não foi possível ${editingList ? 'salvar' : 'criar'} a lista.`)
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
        <button className="primary-action" type="button" onClick={openCreateModal}>
          <Plus size={20} aria-hidden="true" />
          Nova Lista
        </button>
      </div>

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
          <p>Crie a primeira lista para organizar as tarefas desta área.</p>
          <button className="primary-action" type="button" onClick={openCreateModal}>
            <Plus size={20} aria-hidden="true" />
            Criar Lista
          </button>
        </div>
      ) : null}

      {!isLoading && !loadError && lists.length > 0 ? (
        <div className="lists-grid" aria-live="polite">
          {lists.map((list) => (
            <article className="list-card" key={list.id}>
              <Link className="list-card-content" to={`/areas/${selectedAreaId}/listas/${list.id}`}>
                <span className="list-card-icon" aria-hidden="true"><Folder size={26} /></span>
                <span>
                  <strong>{list.title}</strong>
                  <small>{list.description || 'Sem descrição'}</small>
                </span>
                <ChevronRight size={22} aria-hidden="true" />
              </Link>
              <div className="list-card-actions">
                <button type="button" onClick={() => openEditModal(list)} aria-label={`Editar ${list.title}`}>
                  <Pencil size={17} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => { setActionError(''); setArchiveCandidate(list) }} aria-label={`Arquivar ${list.title}`}>
                  <Archive size={17} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {!isLoading && !loadError && archivedLists.length > 0 ? (
        <section className="context-archived-section" aria-labelledby="archived-lists-title">
          <header><span className="archived-category-icon is-list"><Archive size={21} /></span><div><h2 id="archived-lists-title">Arquivadas <span>{archivedLists.length}</span></h2><p>Listas preservadas nesta Área. Abra para visualizar as Tarefas.</p></div></header>
          <div className="context-archived-items">
            {archivedLists.map((list) => (
              <button className="context-archived-card" type="button" onClick={() => setSelectedArchivedList(list)} key={list.id}>
                <span className="archived-item-icon is-list"><Folder size={22} /></span><span><strong>{list.title}</strong><small>{list._count.tasks} {list._count.tasks === 1 ? 'Tarefa' : 'Tarefas'} · Arquivada em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(list.archivedAt))}</small></span><RotateCcw size={18} aria-label="Pode ser restaurada" />
              </button>
            ))}
          </div>
        </section>
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
                <h2 id="list-modal-title">{editingList ? 'Editar Lista' : 'Nova Lista'}</h2>
                <p>{editingList ? 'Atualize os dados desta lista.' : 'Crie uma lista para organizar as tarefas desta área.'}</p>
              </div>
              <button className="icon-button area-modal-close" type="button" onClick={closeModal} aria-label="Fechar"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="area-form-field">
                <span>Nome da Lista <strong>*</strong></span>
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
                  {editingList ? 'Salvar alterações' : 'Criar Lista'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {archiveCandidate ? (
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

      {selectedArchivedList ? <ArchivedListDetails item={selectedArchivedList} onClose={() => setSelectedArchivedList(null)} onChanged={loadLists} /> : null}
    </section>
  )
}
