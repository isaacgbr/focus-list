import {
  AlertCircle,
  Archive,
  BriefcaseBusiness,
  ChevronDown,
  ChevronUp,
  Folder,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Info,
  Users,
  X,
} from 'lucide-react'
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { useModalFocusTrap } from '../hooks/useModalFocusTrap'
import areaService, { Area, CreateAreaData } from '../services/areaService'
import { Brand } from './Brand'

type SidebarProps = {
  isOpen: boolean
  onClose: () => void
}

const primaryItems = [
  { label: 'Dashboard', icon: Home, to: '/' },
]

const utilityItems = [
  { label: 'Arquivados', icon: Archive, to: '/arquivados' },
  { label: 'Sobre', icon: Info, to: '/sobre' },
]

const SIDEBAR_AREA_LIMIT = 6
const sidebarFocusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const areaIcons = {
  briefcase: BriefcaseBusiness,
  folder: Folder,
  'graduation-cap': GraduationCap,
  heart: Heart,
  home: Home,
  laptop: Laptop,
  users: Users,
} as const

type AreaIcon = keyof typeof areaIcons

type AreaForm = {
  title: string
  description: string
  color: string
  icon: AreaIcon
}

const emptyAreaForm: AreaForm = {
  title: '',
  description: '',
  color: '#0b79ff',
  icon: 'folder',
}

function toAreaPayload(form: AreaForm): CreateAreaData {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    color: form.color,
    icon: form.icon,
  }
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const sidebarRef = useRef<HTMLElement>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [areAreasExpanded, setAreAreasExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isArchiving, setIsArchiving] = useState<number | null>(null)
  const [archiveCandidate, setArchiveCandidate] = useState<Area | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [form, setForm] = useState<AreaForm>(emptyAreaForm)
  const isSidebarModalOpenRef = useRef(false)
  isSidebarModalOpenRef.current = isModalOpen || archiveCandidate !== null
  const areaModalRef = useModalFocusTrap<HTMLElement>(isModalOpen)
  const archiveModalRef = useModalFocusTrap<HTMLElement>(archiveCandidate !== null)

  const loadAreas = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      setAreas(await areaService.getAll())
    } catch {
      setLoadError('Não foi possível carregar as áreas.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAreas()
  }, [loadAreas])

  useEffect(() => {
    if (areas.length <= SIDEBAR_AREA_LIMIT) setAreAreasExpanded(false)
  }, [areas.length])

  useEffect(() => {
    const handleDataChanged = () => void loadAreas()
    window.addEventListener('focuslist:data-changed', handleDataChanged)
    return () => window.removeEventListener('focuslist:data-changed', handleDataChanged)
  }, [loadAreas])

  useEffect(() => {
    const openAreaForm = () => {
      setEditingArea(null)
      setForm(emptyAreaForm)
      setActionError('')
      setIsModalOpen(true)
    }
    window.addEventListener('focuslist:open-area-form', openAreaForm)
    return () => window.removeEventListener('focuslist:open-area-form', openAreaForm)
  }, [])

  useEffect(() => {
    if (!isModalOpen && !archiveCandidate) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (archiveCandidate && isArchiving === null) setArchiveCandidate(null)
      else if (isModalOpen && !isSaving) setIsModalOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [archiveCandidate, isArchiving, isModalOpen, isSaving])

  useEffect(() => {
    if (!isOpen || !sidebarRef.current) return

    const sidebar = sidebarRef.current
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const getFocusableElements = () => Array.from(sidebar.querySelectorAll<HTMLElement>(sidebarFocusableSelector))
      .filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0)
    const closeButton = sidebar.querySelector<HTMLElement>('.sidebar-close')

    closeButton?.focus({ preventScroll: true })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isSidebarModalOpenRef.current) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) {
        event.preventDefault()
        sidebar.focus({ preventScroll: true })
        return
      }

      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus({ preventScroll: true })
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus({ preventScroll: true })
      }
    }

    const handleFocusIn = (event: FocusEvent) => {
      if (!isSidebarModalOpenRef.current && !sidebar.contains(event.target as Node)) closeButton?.focus({ preventScroll: true })
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocusIn)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocusIn)
      queueMicrotask(() => {
        if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
      })
    }
  }, [isOpen, onClose])

  const openCreateModal = () => {
    setEditingArea(null)
    setForm(emptyAreaForm)
    setActionError('')
    setIsModalOpen(true)
  }

  const openEditModal = (area: Area) => {
    const savedIcon = area.icon && area.icon in areaIcons ? area.icon as AreaIcon : 'folder'

    setEditingArea(area)
    setForm({
      title: area.title,
      description: area.description ?? '',
      color: area.color ?? emptyAreaForm.color,
      icon: savedIcon,
    })
    setActionError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (!isSaving) setIsModalOpen(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.title.trim()) return

    setIsSaving(true)
    setActionError('')

    try {
      if (editingArea) {
        await areaService.update(editingArea.id, toAreaPayload(form))
      } else {
        await areaService.create(toAreaPayload(form))
      }

      setIsModalOpen(false)
      await loadAreas()
    } catch {
      setActionError(`Não foi possível ${editingArea ? 'salvar' : 'criar'} a área.`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleArchive = async (area: Area) => {
    setIsArchiving(area.id)
    setActionError('')

    try {
      await areaService.archive(area.id)
      setArchiveCandidate(null)
      await loadAreas()
      navigate('/')
    } catch {
      setActionError('Não foi possível arquivar a área.')
    } finally {
      setIsArchiving(null)
    }
  }

  const visibleAreas = areAreasExpanded ? areas : areas.slice(0, SIDEBAR_AREA_LIMIT)

  return (
    <>
      <button
        className={`sidebar-backdrop ${isOpen ? 'is-visible' : ''}`}
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
      />

      <aside ref={sidebarRef} className={`sidebar ${isOpen ? 'is-open' : ''}`} id="focuslist-sidebar" aria-label="Navegação principal" tabIndex={-1}>
        <div className="sidebar-heading">
          <Brand markSrc="/focuslist-mark-sidebar.png" />
          <button className="icon-button sidebar-close" type="button" onClick={onClose} aria-label="Fechar menu">
            <X size={22} />
          </button>
        </div>

        <nav className="sidebar-navigation">
          <div className="nav-group">
            {primaryItems.map((item) => (
              <NavLink
                className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                end={item.to === '/'}
                key={item.to}
                onClick={onClose}
                to={item.to}
              >
                <item.icon aria-hidden="true" size={23} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="nav-section-heading">
            <span>Áreas</span>
            <button className="icon-button" type="button" aria-label="Adicionar área" onClick={openCreateModal}>
              <Plus size={21} />
            </button>
          </div>

          <div className={`area-nav-shell ${areAreasExpanded ? 'is-expanded' : ''}`}>
            <div className="nav-group area-nav" aria-live="polite">
              {isLoading ? (
                <div className="area-nav-state">
                  <LoaderCircle className="spin" size={18} aria-hidden="true" />
                  <span>Carregando áreas...</span>
                </div>
              ) : null}

              {!isLoading && loadError ? (
                <div className="area-nav-error" role="alert">
                  <AlertCircle size={18} aria-hidden="true" />
                  <span>{loadError}</span>
                  <button type="button" onClick={() => void loadAreas()}>Tentar novamente</button>
                </div>
              ) : null}

              {!isLoading && !loadError && areas.length === 0 ? (
                <div className="area-nav-state area-nav-empty">
                  <Folder size={18} aria-hidden="true" />
                  <span>Nenhuma área criada.</span>
                </div>
              ) : null}

              {!isLoading && !loadError ? visibleAreas.map((area) => {
                const Icon = area.icon && area.icon in areaIcons ? areaIcons[area.icon as AreaIcon] : Folder

                return (
                  <div className="area-nav-item" key={area.id}>
                    <NavLink
                      className={({ isActive }) => `nav-link area-nav-link ${isActive ? 'is-active' : ''}`}
                      onClick={onClose}
                      to={`/areas/${area.id}`}
                    >
                      <Icon aria-hidden="true" size={22} style={{ color: area.color ?? undefined }} />
                      <span>{area.title}</span>
                    </NavLink>
                    <div className="area-nav-actions">
                      <button type="button" onClick={() => openEditModal(area)} aria-label={`Editar ${area.title}`}>
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setArchiveCandidate(area)}
                        aria-label={`Arquivar ${area.title}`}
                        disabled={isArchiving === area.id}
                      >
                        {isArchiving === area.id ? <LoaderCircle className="spin" size={16} aria-hidden="true" /> : <Archive size={16} aria-hidden="true" />}
                      </button>
                    </div>
                  </div>
                )
              }) : null}
            </div>

            {!isLoading && !loadError && areas.length > SIDEBAR_AREA_LIMIT ? (
              <button className="area-nav-toggle" type="button" aria-expanded={areAreasExpanded} onClick={() => setAreAreasExpanded((current) => !current)}>
                {areAreasExpanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                {areAreasExpanded ? 'Recolher' : 'Ver todas'}
                <span>{areas.length}</span>
              </button>
            ) : null}
          </div>

          {actionError && !isModalOpen ? <p className="sidebar-action-error" role="alert">{actionError}</p> : null}

          <div className="sidebar-spacer" />

          <div className="nav-group nav-group-utility">
            {utilityItems.map((item) => (
              <NavLink
                className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                key={item.to}
                onClick={onClose}
                to={item.to}
              >
                <item.icon aria-hidden="true" size={23} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>

      {isModalOpen ? (
        <div className="area-modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <section
            ref={areaModalRef}
            className="area-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="area-modal-title"
            tabIndex={-1}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="area-modal-heading">
              <span className="area-modal-heading-icon" aria-hidden="true">
                <Folder size={31} />
                <Plus className="area-modal-heading-plus" size={17} />
              </span>
              <div>
                <h2 id="area-modal-title">{editingArea ? 'Editar Área' : 'Nova Área'}</h2>
                <p>{editingArea ? 'Atualize os dados desta área.' : 'Crie uma área para organizar suas listas e tarefas.'}</p>
              </div>
              <button className="icon-button area-modal-close" type="button" onClick={closeModal} aria-label="Fechar">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="area-form-field">
                <span>Nome da Área <strong>*</strong></span>
                <input
                  data-modal-initial-focus
                  maxLength={50}
                  required
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Ex.: Faculdade, Trabalho, Projetos..."
                />
                <small>{form.title.length}/50</small>
              </label>

              <label className="area-form-field">
                <span>Descrição</span>
                <textarea
                  maxLength={200}
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Ex.: Área para organizar matérias, estudos e trabalhos."
                />
                <small>{form.description.length}/200</small>
              </label>

              <fieldset className="area-icon-picker">
                <legend>Ícone</legend>
                <p>Escolha um ícone para identificar a área.</p>
                <div>
                  {Object.entries(areaIcons).map(([name, Icon]) => (
                    <button
                      className={form.icon === name ? 'is-selected' : ''}
                      type="button"
                      key={name}
                      onClick={() => setForm((current) => ({ ...current, icon: name as AreaIcon }))}
                      aria-label={`Selecionar ícone ${name}`}
                      aria-pressed={form.icon === name}
                    >
                      <Icon size={24} aria-hidden="true" />
                    </button>
                  ))}
                  <label className="area-color-picker" title="Cor da área">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
                      aria-label="Cor da área"
                    />
                  </label>
                  <MoreHorizontal size={24} aria-hidden="true" />
                </div>
              </fieldset>

              {actionError ? <p className="area-form-error" role="alert"><AlertCircle size={18} />{actionError}</p> : null}

              <div className="area-modal-actions">
                <button className="secondary-action" type="button" onClick={closeModal} disabled={isSaving}>Cancelar</button>
                <button className="primary-action" type="submit" disabled={isSaving || !form.title.trim()}>
                  {isSaving ? <LoaderCircle className="spin" size={19} aria-hidden="true" /> : null}
                  {editingArea ? 'Salvar alterações' : 'Criar Área'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {archiveCandidate ? (
        <div className="area-modal-backdrop" role="presentation" onMouseDown={() => !isArchiving && setArchiveCandidate(null)}>
          <section
            ref={archiveModalRef}
            className="area-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="area-archive-title"
            aria-describedby="area-archive-description"
            tabIndex={-1}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="area-delete-icon archive-confirm-icon" aria-hidden="true"><Archive size={29} /></span>
            <div>
              <h2 id="area-archive-title">Arquivar este item?</h2>
              <p id="area-archive-description">Ele deixará de aparecer normalmente, mas poderá ser restaurado posteriormente.</p>
            </div>
            <div className="area-modal-actions">
              <button className="secondary-action" type="button" onClick={() => setArchiveCandidate(null)} disabled={isArchiving !== null} data-modal-initial-focus>Cancelar</button>
              <button className="primary-action" type="button" onClick={() => void handleArchive(archiveCandidate)} disabled={isArchiving !== null}>
                {isArchiving !== null ? <LoaderCircle className="spin" size={19} aria-hidden="true" /> : <Archive size={19} aria-hidden="true" />}
                Arquivar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}
