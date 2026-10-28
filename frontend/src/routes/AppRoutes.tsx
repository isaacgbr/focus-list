import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { AppLayout } from '../layouts/AppLayout'
import { AreaLists } from '../pages/AreaLists'
import { Archived } from '../pages/Archived'
import { ArchivedTask } from '../pages/ArchivedTask'
import { Dashboard } from '../pages/Dashboard'
import { ListTasks } from '../pages/ListTasks'
import { About } from '../pages/About'
import { LandingPage } from '../pages/LandingPage'
import { AuthPage } from '../pages/AuthPage'
import { PasswordRecoveryPage } from '../pages/PasswordRecoveryPage'
import { RequireAuth } from '../auth/AuthGate'

function LegacyAppRedirect() {
  const location = useLocation()
  return <Navigate to={`/app${location.pathname}${location.search}${location.hash}`} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route index element={<LandingPage />} />
      <Route path="login" element={<AuthPage />} />
      <Route path="cadastro" element={<AuthPage />} />
      <Route path="recuperar-senha" element={<PasswordRecoveryPage key="forgot" />} />
      <Route path="redefinir-senha" element={<PasswordRecoveryPage key="reset" reset />} />
      <Route element={<RequireAuth />}>
        <Route path="app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="areas/:areaId" element={<AreaLists />} />
          <Route path="areas/:areaId/listas/:listId" element={<ListTasks />} />
          <Route path="arquivados" element={<Archived />} />
          <Route path="arquivados/areas/:areaId" element={<AreaLists archivedMode />} />
          <Route path="arquivados/listas/:listId" element={<ListTasks archivedMode />} />
          <Route path="arquivados/tarefas/:taskId" element={<ArchivedTask />} />
          <Route path="sobre" element={<About />} />
        </Route>
      </Route>
      <Route path="areas/*" element={<LegacyAppRedirect />} />
      <Route path="arquivados/*" element={<LegacyAppRedirect />} />
      <Route path="sobre" element={<LegacyAppRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
