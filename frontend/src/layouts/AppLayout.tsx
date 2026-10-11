import { Outlet } from 'react-router-dom'

import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { useSidebar } from '../hooks/useSidebar'

export function AppLayout() {
  const sidebar = useSidebar()

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebar.isOpen} onClose={sidebar.close} />
      <div className="app-workspace">
        <Header onOpenSidebar={sidebar.open} />
        <main className="app-content" key={sidebar.locationKey}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
