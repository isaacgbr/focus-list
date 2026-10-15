import { ChevronRight, Home, Menu } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'

type HeaderProps = {
  onOpenSidebar: () => void
}

type Breadcrumb = {
  label: string
  to?: string
}

function formatSegment(value: string) {
  return decodeURIComponent(value)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function Header({ onOpenSidebar }: HeaderProps) {
  const { pathname } = useLocation()
  const { areaId, listId } = useParams()

  const breadcrumbs: Breadcrumb[] = (() => {
    if (pathname === '/') return [{ label: 'Dashboard' }]
    if (pathname === '/arquivados') return [{ label: 'Arquivados' }]
    if (pathname === '/sobre') return [{ label: 'Sobre' }]

    const items: Breadcrumb[] = [{ label: 'Áreas', to: '/' }]
    if (areaId) items.push({ label: formatSegment(areaId), to: listId ? `/areas/${areaId}` : undefined })
    if (listId) items.push({ label: formatSegment(listId) })
    return items
  })()

  return (
    <header className="header">
      <button className="icon-button menu-button" type="button" onClick={onOpenSidebar} aria-label="Abrir menu">
        <Menu size={24} />
      </button>

      <nav className="breadcrumbs" aria-label="Caminho de navegação">
        <Link className="breadcrumb-home" to="/" aria-label="Dashboard">
          <Home size={22} />
        </Link>
        {breadcrumbs.map((item, index) => (
          <span className="breadcrumb-item" key={`${item.label}-${index}`}>
            {index > 0 || pathname !== '/' ? <ChevronRight className="breadcrumb-separator" size={18} /> : null}
            {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </span>
        ))}
      </nav>
    </header>
  )
}
