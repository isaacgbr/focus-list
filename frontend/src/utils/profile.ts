import type { PasswordChange, ViewMode } from '../services/profileService'

export function profileEditState(saved: { name: string | null; email: string | null } | null, name: string, email: string) {
  const normalizedName = name.trim()
  const normalizedEmail = email.trim().toLowerCase()
  const emailChanged = normalizedEmail !== saved?.email
  const valid = !!normalizedName && [...normalizedName].length <= 100 && !/[\u0000-\u001f\u007f]/.test(normalizedName)
    && normalizedEmail.length <= 254 && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(normalizedEmail)
  return { valid, changed: normalizedName !== saved?.name || emailChanged, emailChanged }
}

export function defaultView(user: { type: string; defaultView?: ViewMode } | null): ViewMode {
  return user?.type === 'REAL' && user.defaultView === 'cards' ? 'cards' : 'list'
}

export function passwordChangeError(payload: PasswordChange) {
  const length = [...payload.newPassword].length
  if (length < 8 || length > 32 || new TextEncoder().encode(payload.newPassword).length > 128) return 'A nova senha deve ter entre 8 e 32 caracteres.'
  if (payload.newPassword !== payload.confirmPassword) return 'A confirmação da senha não confere.'
  if (!payload.currentPassword) return 'Informe sua senha atual.'
  return ''
}

// A validação usada pelo formulário ocorre antes de qualquer chamada HTTP.
export async function submitPasswordChange<T>(payload: PasswordChange, send: (payload: PasswordChange) => Promise<T>) {
  const error = passwordChangeError(payload)
  if (error) throw new Error(error)
  return send(payload)
}

export function cropRectangle(width: number, height: number, zoom: number, horizontal: number, vertical: number) {
  const size = Math.min(width, height) / zoom
  return { size, x: (width - size) * horizontal / 100, y: (height - size) * vertical / 100 }
}
