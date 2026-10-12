import {
  AlertCircle,
  ChevronRight,
  Folder,
  ListPlus,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

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
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingList, setEditingList] = useState<List | null>(null)
  const [deleteCandidate, setDeleteCandidate] = useState<List | null>(null)
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
      const allLists = await listService.getAll()
      setLists(allLists.filter((list) => list.areaId === selectedAreaId))
    } catch {
      setLists([])
      setLoadError('Não foi possível carregar as listas desta área.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedAreaId])

  useEffect(() => {
    void loadLists()
  }, [loadLists])

  useEffect(() => {
    if (!isModalOpen && !deleteCandidate) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (isModalOpen && !isSaving) setIsModalOpen(false)
      if (deleteCandidate && !isDeleting) setDeleteCandidate(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteCandidate, isDeleting, isModalOpen, isSaving])

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

  const handleDelete = async () => {
    if (!deleteCandidate) return

    setIsDeleting(true)
    setActionError('')

    try {
      await listService.remove(deleteCandidate.id)
      setDeleteCandidate(null)
      await loadLists()
    } catch {
      setActionError('Não foi possível excluir a lista.')
    } finally {
      setIsDeleting(false)
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

      {actionError && !isModalOpen && !deleteCandidate ? (
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
                <button type="button" onClick={() => { setActionError(''); setDeleteCandidate(list) }} aria-label={`Excluir ${list.title}`}>
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
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

      {deleteCandidate ? (
        <div className="area-modal-backdrop" role="presentation" onMouseDown={() => !isDeleting && setDeleteCandidate(null)}>
          <section className="area-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="list-delete-title" aria-describedby="list-delete-description" onMouseDown={(event) => event.stopPropagation()}>
            <span className="area-delete-icon" aria-hidden="true"><Trash2 size={29} /></span>
            <div>
              <h2 id="list-delete-title">Excluir Lista</h2>
              <p id="list-delete-description">Tem certeza de que deseja excluir “{deleteCandidate.title}”? Esta ação não pode ser desfeita.</p>
              {actionError ? <p className="area-form-error" role="alert"><AlertCircle size={18} />{actionError}</p> : null}
            </div>
            <div className="area-modal-actions">
              <button className="secondary-action" type="button" onClick={() => setDeleteCandidate(null)} disabled={isDeleting}>Cancelar</button>
              <button className="danger-action" type="button" onClick={() => void handleDelete()} disabled={isDeleting}>
                {isDeleting ? <LoaderCircle className="spin" size={19} aria-hidden="true" /> : <Trash2 size={19} aria-hidden="true" />}
                Excluir Lista
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}
