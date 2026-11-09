import { useState } from 'react'
import api from '../services/api'

export function UserAvatar({ name, avatarUrl }: { name: string | null; avatarUrl?: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const source = avatarUrl ? `${(api.defaults.baseURL ?? '').replace(/\/$/, '')}${avatarUrl}` : null
  return <span className="user-avatar" aria-hidden="true">
    {source && failedUrl !== source
      ? <img src={source} alt="" crossOrigin="use-credentials" onError={() => setFailedUrl(source)} />
      : [...(name?.trim() || 'F')][0].toLocaleUpperCase('pt-BR')}
  </span>
}
