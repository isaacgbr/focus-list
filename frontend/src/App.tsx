import { BrowserRouter } from 'react-router-dom'

import { AppRoutes } from './routes/AppRoutes'
import { AuthProvider } from './auth/AuthContext'
import { ConnectivityGate } from './components/ConnectivityGate'
import { ApiReadinessGate } from './components/ApiReadinessGate'

export function App() {
  return (
    <ConnectivityGate>
      <ApiReadinessGate>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </ApiReadinessGate>
    </ConnectivityGate>
  )
}
