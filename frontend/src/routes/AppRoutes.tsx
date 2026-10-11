import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '../layouts/AppLayout'
import { RoutePlaceholder } from '../pages/RoutePlaceholder'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<RoutePlaceholder />} />
        <Route path="avulsas" element={<RoutePlaceholder />} />
        <Route path="areas/:areaId" element={<RoutePlaceholder />} />
        <Route path="areas/:areaId/listas/:listId" element={<RoutePlaceholder />} />
        <Route path="lixeira" element={<RoutePlaceholder />} />
        <Route path="configuracoes" element={<RoutePlaceholder />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
