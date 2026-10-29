import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import api from '../services/api'
import authService, { authErrorMessage } from '../services/authService'
import type { AuthUser, LoginData, RegisterData, ResetPasswordData } from '../services/authService'

type AuthStatus = 'checking' | 'authenticated' | 'anonymous' | 'error'
type AuthContextValue = {
  user: AuthUser | null
  status: AuthStatus
  error: string
  checkSession: (background?: boolean) => Promise<void>
  login: (payload: LoginData) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (payload: ResetPasswordData) => Promise<void>
  registerFromDemo: (payload: RegisterData) => Promise<void>
  startDemo: () => Promise<void>
  resolveDemo: (action: 'import' | 'discard') => Promise<void>
  demoEnded: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Apenas uma pista visual para a expiração após refresh; nunca autoriza acesso ou importação.
function demoHint(value?: boolean) {
  try {
    if (value !== undefined) {
      if (value) sessionStorage.setItem('focuslist:demo', 'active')
      else sessionStorage.removeItem('focuslist:demo')
    }
    return sessionStorage.getItem('focuslist:demo') === 'active'
  } catch { return false }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('checking')
  const [error, setError] = useState('')
  const [demoEnded, setDemoEnded] = useState(() => demoHint())
  const revision = useRef(0)

  const acceptUser = useCallback((sessionUser: AuthUser) => {
    ++revision.current
    demoHint(sessionUser.type === 'DEMO')
    setDemoEnded(false)
    setUser(sessionUser)
    setError('')
    setStatus('authenticated')
  }, [])

  const checkSession = useCallback(async (background = false) => {
    const current = ++revision.current
    if (!background) setStatus('checking')
    setError('')
    try {
      const sessionUser = await authService.getSession()
      if (revision.current !== current) return
      setUser(sessionUser)
      setStatus(sessionUser ? 'authenticated' : 'anonymous')
      if (sessionUser) {
        demoHint(sessionUser.type === 'DEMO')
        setDemoEnded(false)
      } else setDemoEnded(demoHint())
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
        setDemoEnded(demoHint())
      }
      return Promise.reject(cause)
    })
    void checkSession()
    return () => {
      ++revision.current
      api.interceptors.response.eject(interceptor)
    }
  }, [checkSession])

  useEffect(() => {
    if (user?.type !== 'DEMO' && !user?.demoImport) return
    const refresh = () => { if (document.visibilityState === 'visible') void checkSession(true) }
    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [checkSession, user?.type, user?.demoImport])

  const login = useCallback(async (payload: LoginData) => {
    const sessionUser = await authService.login(payload)
    acceptUser(sessionUser)
  }, [acceptUser])

  const logout = useCallback(async () => {
    if (user?.type === 'DEMO') await authService.exitDemo()
    else await authService.logout()
    ++revision.current
    demoHint(false)
    setDemoEnded(false)
    setUser(null)
    setError('')
    setStatus('anonymous')
  }, [user?.type])

  const startDemo = useCallback(async () => { acceptUser(await authService.startDemo()) }, [acceptUser])
  const registerFromDemo = useCallback(async (payload: RegisterData) => {
    acceptUser(await authService.register({ ...payload, fromDemo: true }))
  }, [acceptUser])
  const resolveDemo = useCallback(async (action: 'import' | 'discard') => {
    await authService.resolveDemo(action)
    await checkSession()
  }, [checkSession])

  useEffect(() => {
    if (user?.type !== 'DEMO' || !user.expiresAt) return
    const timer = window.setTimeout(() => {
      ++revision.current
      setUser(null)
      setDemoEnded(true)
      setStatus('anonymous')
    }, Math.max(0, new Date(user.expiresAt).getTime() - Date.now()))
    return () => window.clearTimeout(timer)
  }, [user?.type, user?.expiresAt])

  const resetPassword = useCallback(async (payload: ResetPasswordData) => {
    await authService.resetPassword(payload)
    ++revision.current
    setUser(null)
    setError('')
    setStatus('anonymous')
  }, [])

  return (
    <AuthContext.Provider value={{ user, status, error, checkSession, login, logout, resetPassword, startDemo, registerFromDemo, resolveDemo, demoEnded }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  return context
}
