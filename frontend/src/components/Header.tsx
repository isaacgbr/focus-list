import { ChevronRight, Home, Menu } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Breadcrumb } from './BreadcrumbContext'

type HeaderProps = {
  contextualBreadcrumbs: Breadcrumb[]
  isSidebarOpen: boolean
  onOpenSidebar: () => void
}

export function Header({ contextualBreadcrumbs, isSidebarOpen, onOpenSidebar }: HeaderProps) {
  const { pathname } = useLocation()

  const breadcrumbs: Breadcrumb[] = (() => {
    if (pathname === '/') return [{ label: 'Dashboard' }]
    if (pathname === '/arquivados') return [{ label: 'Arquivados' }]
    if (pathname === '/sobre') return [{ label: 'Sobre' }]
    if (pathname.startsWith('/arquivados/')) {
      return [{ label: 'Arquivados', to: '/arquivados' }, ...contextualBreadcrumbs]
    }

    return [{ label: 'Áreas', to: '/' }, ...contextualBreadcrumbs]
  })()

  return (
    <header className="header">
      <button className="icon-button menu-button" type="button" onClick={onOpenSidebar} aria-controls="focuslist-sidebar" aria-expanded={isSidebarOpen} aria-label="Abrir menu">
        <Menu size={24} />
      </button>

      <nav className="breadcrumbs" aria-label="Caminho de navegação">
        <Link className="breadcrumb-home" to="/" aria-label="Dashboard">
          <Home size={22} />
        </Link>
        {breadcrumbs.map((item, index) => (
          <span className="breadcrumb-item" key={`${item.label}-${index}`}>
            {index > 0 || pathname !== '/' ? <ChevronRight className="breadcrumb-separator" size={18} /> : null}
            {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}>{item.label}</span>}
          </span>
        ))}
      </nav>
    </header>
  )
}
