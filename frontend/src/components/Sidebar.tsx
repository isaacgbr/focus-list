import {
  FileText,
  Home,
  Plus,
  Settings,
  Trash2,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { Brand } from './Brand'

type SidebarProps = {
  isOpen: boolean
  onClose: () => void
}

const primaryItems = [
  { label: 'Dashboard', icon: Home, to: '/' },
  { label: 'Avulsas', icon: FileText, to: '/avulsas' },
]

const utilityItems = [
  { label: 'Lixeira', icon: Trash2, to: '/lixeira' },
  { label: 'Configurações', icon: Settings, to: '/configuracoes' },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <button
        className={`sidebar-backdrop ${isOpen ? 'is-visible' : ''}`}
        type="button"
        aria-label="Fechar menu"
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? 'is-open' : ''}`} aria-label="Navegação principal">
        <div className="sidebar-heading">
          <Brand />
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
            <button className="icon-button" type="button" aria-label="Adicionar área">
              <Plus size={21} />
            </button>
          </div>

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
    </>
  )
}
