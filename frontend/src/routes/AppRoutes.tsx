import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '../layouts/AppLayout'
import { AreaLists } from '../pages/AreaLists'
import { Archived } from '../pages/Archived'
import { Dashboard } from '../pages/Dashboard'
import { ListTasks } from '../pages/ListTasks'
import { RoutePlaceholder } from '../pages/RoutePlaceholder'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="avulsas" element={<RoutePlaceholder />} />
        <Route path="areas/:areaId" element={<AreaLists />} />
        <Route path="areas/:areaId/listas/:listId" element={<ListTasks />} />
        <Route path="arquivados" element={<Archived />} />
        <Route path="configuracoes" element={<RoutePlaceholder />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
