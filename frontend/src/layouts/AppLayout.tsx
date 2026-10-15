import { useCallback, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Breadcrumb, BreadcrumbContext } from '../components/BreadcrumbContext'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { useSidebar } from '../hooks/useSidebar'

export function AppLayout() {
  const sidebar = useSidebar()
  const { pathname } = useLocation()
  const [breadcrumbState, setBreadcrumbState] = useState<{ pathname: string; items: Breadcrumb[] }>({ pathname, items: [] })
  const setBreadcrumbs = useCallback((items: Breadcrumb[]) => {
    setBreadcrumbState({ pathname, items })
  }, [pathname])
  const contextualBreadcrumbs = breadcrumbState.pathname === pathname ? breadcrumbState.items : []

  return (
    <BreadcrumbContext.Provider value={setBreadcrumbs}>
      <div className="app-shell">
        <Sidebar isOpen={sidebar.isOpen} onClose={sidebar.close} />
        <div className="app-workspace">
          <Header contextualBreadcrumbs={contextualBreadcrumbs} onOpenSidebar={sidebar.open} />
          <main className="app-content" key={sidebar.locationKey}>
            <Outlet />
          </main>
        </div>
      </div>
    </BreadcrumbContext.Provider>
  )
}
