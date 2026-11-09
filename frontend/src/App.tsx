import { BrowserRouter } from 'react-router-dom'

import { AppRoutes } from './routes/AppRoutes'
import { AuthProvider } from './auth/AuthContext'
import { ConnectivityGate } from './components/ConnectivityGate'

export function App() {
  return (
    <ConnectivityGate>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ConnectivityGate>
  )
}
