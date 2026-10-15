import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '../layouts/AppLayout'
import { AreaLists } from '../pages/AreaLists'
import { Archived } from '../pages/Archived'
import { ArchivedTask } from '../pages/ArchivedTask'
import { Dashboard } from '../pages/Dashboard'
import { ListTasks } from '../pages/ListTasks'
import { About } from '../pages/About'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="areas/:areaId" element={<AreaLists />} />
        <Route path="areas/:areaId/listas/:listId" element={<ListTasks />} />
        <Route path="arquivados" element={<Archived />} />
        <Route path="arquivados/areas/:areaId" element={<AreaLists archivedMode />} />
        <Route path="arquivados/listas/:listId" element={<ListTasks archivedMode />} />
        <Route path="arquivados/tarefas/:taskId" element={<ArchivedTask />} />
        <Route path="sobre" element={<About />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
