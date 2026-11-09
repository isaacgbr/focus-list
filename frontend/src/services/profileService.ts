import api from './api'

export type ViewMode = 'list' | 'cards'
export type UserProfile = {
  name: string | null
  email: string | null
  createdAt: string
  avatarUrl: string | null
  defaultView: ViewMode
}
export type PasswordChange = { currentPassword: string; newPassword: string; confirmPassword: string }

const profileService = {
  async get() {
    return (await api.get<{ profile: UserProfile }>('/profile')).data.profile
  },
  async update(payload: { name?: string; email?: string; currentPassword?: string }) {
    return (await api.patch<{ profile: UserProfile }>('/profile', payload)).data.profile
  },
  async password(payload: PasswordChange) {
    return (await api.post<{ message: string }>('/profile/password', payload)).data.message
  },
  async preferences(defaultView: ViewMode) {
    return (await api.patch<{ profile: UserProfile }>('/profile/preferences', { defaultView })).data.profile
  },
  async avatar(image: string) {
    return (await api.put<{ profile: UserProfile }>('/profile/avatar', { image })).data.profile
  },
  async removeAvatar() {
    return (await api.delete<{ profile: UserProfile }>('/profile/avatar')).data.profile
  },
}
export default profileService
