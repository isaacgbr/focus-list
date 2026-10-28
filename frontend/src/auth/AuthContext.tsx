import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import api from '../services/api'
import authService, { authErrorMessage } from '../services/authService'
import type { AuthUser, LoginData, ResetPasswordData } from '../services/authService'

type AuthStatus = 'checking' | 'authenticated' | 'anonymous' | 'error'
type AuthContextValue = {
  user: AuthUser | null
  status: AuthStatus
  error: string
  checkSession: () => Promise<void>
  login: (payload: LoginData) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (payload: ResetPasswordData) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('checking')
  const [error, setError] = useState('')
  const revision = useRef(0)

  const checkSession = useCallback(async () => {
    const current = ++revision.current
    setStatus('checking')
    setError('')
    try {
      const sessionUser = await authService.getSession()
      if (revision.current !== current) return
      setUser(sessionUser)
      setStatus(sessionUser ? 'authenticated' : 'anonymous')
    } catch (cause) {
      if (revision.current !== current) return
      setError(authErrorMessage(cause, 'Não foi possível verificar sua sessão. Tente novamente.'))
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    const interceptor = api.interceptors.response.use(undefined, (cause) => {
      const path = cause.config?.url as string | undefined
      if (cause.response?.status === 401 && path && !path.startsWith('/auth/')) {
        ++revision.current
        setUser(null)
        setStatus('anonymous')
      }
      return Promise.reject(cause)
    })
    void checkSession()
    return () => {
      ++revision.current
      api.interceptors.response.eject(interceptor)
    }
  }, [checkSession])

  const login = useCallback(async (payload: LoginData) => {
    const sessionUser = await authService.login(payload)
    ++revision.current
    setUser(sessionUser)
    setError('')
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    ++revision.current
    setUser(null)
    setError('')
    setStatus('anonymous')
  }, [])

  const resetPassword = useCallback(async (payload: ResetPasswordData) => {
    await authService.resetPassword(payload)
    ++revision.current
    setUser(null)
    setError('')
    setStatus('anonymous')
  }, [])

  return (
    <AuthContext.Provider value={{ user, status, error, checkSession, login, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  return context
}
