import axios from 'axios'

import api from './api'

export type AuthUser = {
  id: number
  name: string | null
  email: string | null
  createdAt: string
  type: 'REAL' | 'DEMO'
  expiresAt: string | null
  demoImport?: 'pending' | 'unavailable' | null
}

export type LoginData = { email: string; password: string }
export type RegisterData = LoginData & { name: string; confirmPassword: string; fromDemo?: boolean }
export type ResetPasswordData = { token: string; password: string; confirmPassword: string }

// Deduplicate the initial session check, including React StrictMode's effect replay.
let sessionRequest: Promise<AuthUser | null> | null = null

const authService = {
  async forgotPassword(email: string) {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email })
    return data.message
  },

  async resetPassword(payload: ResetPasswordData) {
    const { data } = await api.post<{ message: string }>('/auth/reset-password', payload)
    return data.message
  },

  getSession() {
    if (!sessionRequest) {
      sessionRequest = api.get<{ user: AuthUser }>('/auth/session')
        .then(({ data }) => data.user)
        .catch((error: unknown) => {
          if (axios.isAxiosError(error) && error.response?.status === 401) return null
          throw error
        })
        .finally(() => { sessionRequest = null })
    }
    return sessionRequest
  },

  async login(payload: LoginData) {
    const { data } = await api.post<{ user: AuthUser }>('/auth/login', payload)
    return data.user
  },

  async register(payload: RegisterData) {
    const { data } = await api.post<{ user: AuthUser }>('/auth/register', payload)
    return data.user
  },

  async logout() {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // An expired session is already logged out on the server.
      if (!axios.isAxiosError(error) || error.response?.status !== 401) throw error
    }
  },

  async startDemo() {
    const { data } = await api.post<{ user: AuthUser }>('/auth/demo', {})
    return data.user
  },

  async exitDemo() {
    try {
      await api.post('/auth/demo/exit', {})
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 401) throw error
    }
  },

  async resolveDemo(action: 'import' | 'discard') {
    try {
      await api.post('/auth/demo/resolve', { action })
    } catch (error) {
      // Sem contexto (ou escolha já concluída em outra aba), começar do zero
      // apenas continua na conta REAL. Importação duplicada continua sendo erro.
      if (action !== 'discard' || !axios.isAxiosError(error) || error.response?.status !== 409) throw error
    }
  },
}

export function isInvalidPasswordReset(error: unknown) {
  return axios.isAxiosError<{ message?: string }>(error) && error.response?.status === 400 &&
    error.response.data?.message === 'Link inválido ou expirado. Solicite uma nova recuperação de senha.'
}

export function authErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError<{ message?: string }>(error)) return fallback
  if (!error.response) return 'Não foi possível conectar ao FocusList. Verifique sua conexão e tente novamente.'
  if (error.response.status === 429) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  if (error.response.status >= 500) return 'O FocusList está indisponível no momento. Tente novamente em instantes.'
  return error.response.data?.message || fallback
}

export default authService
