import type { ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Link, Navigate, Outlet } from 'react-router-dom'

import { Brand } from '../components/Brand'
import { useAuth } from './AuthContext'
import '../auth.css'

export function SessionGate({ children }: { children: ReactNode }) {
  const { status, error, checkSession } = useAuth()
  if (status === 'checking' || status === 'error') {
    return (
      <main className="auth-session">
        <Brand />
        {status === 'checking' ? (
          <p role="status"><LoaderCircle className="auth-spinner" size={18} aria-hidden="true" />Verificando sua sessão…</p>
        ) : (
          <>
            <p role="alert">{error}</p>
            <button className="auth-submit" type="button" onClick={() => void checkSession()}>Tentar novamente</button>
            <Link to="/">Voltar para o início</Link>
          </>
        )}
      </main>
    )
  }
  return children
}

export function RequireAuth() {
  const { status, user, demoEnded } = useAuth()
  return <SessionGate>{status === 'authenticated'
    ? user?.demoImport ? <Navigate to="/demo/dados" replace /> : <Outlet />
    : <Navigate to={demoEnded ? '/demo' : '/login'} replace />}</SessionGate>
}
