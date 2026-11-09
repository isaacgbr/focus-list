import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { LoaderCircle, Pencil } from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import { cropRectangle } from '../utils/profile'
import type { UserProfile } from '../services/profileService'
import profileService from '../services/profileService'

type Selection = { url: string; image: HTMLImageElement }
export function ProfileAvatarEditor({ name, avatarUrl, children, busy, run }: {
  name: string | null
  avatarUrl?: string | null
  children: ReactNode
  busy: boolean
  run: (action: () => Promise<UserProfile>, message: string, done?: () => void) => Promise<void>
}) {
  const [selection, setSelection] = useState<Selection | null>(null)
  const [zoom, setZoom] = useState(1)
  const [horizontal, setHorizontal] = useState(50)
  const [vertical, setVertical] = useState(50)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null)
  const picker = useRef<HTMLInputElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const revision = useRef(0)
  const url = selection?.url
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  useEffect(() => () => { ++revision.current }, [])

  useEffect(() => {
    const context = canvas.current?.getContext('2d')
    if (!selection || !context) return
    const image = selection.image
    const crop = cropRectangle(image.naturalWidth, image.naturalHeight, zoom, horizontal, vertical)
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, 256, 256)
    context.drawImage(image, crop.x, crop.y, crop.size, crop.size, 0, 0, 256, 256)
  }, [selection, zoom, horizontal, vertical])

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const current = ++revision.current
    setError('')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Escolha uma imagem JPG, PNG ou WebP de até 5 MB.')
      return
    }
    setLoading(true)
    const nextUrl = URL.createObjectURL(file)
    try {
      const image = new Image()
      image.src = nextUrl
      await image.decode()
      if (current !== revision.current) { URL.revokeObjectURL(nextUrl); return }
      if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 20_000_000) throw new Error()
      setSelection({ image, url: nextUrl })
      setZoom(1)
      setHorizontal(50)
      setVertical(50)
    } catch {
      URL.revokeObjectURL(nextUrl)
      if (current === revision.current) setError('Não foi possível abrir esta imagem. Use uma foto de até 20 megapixels.')
    } finally { if (current === revision.current) setLoading(false) }
  }

  function save() {
    const data = canvas.current?.toDataURL('image/jpeg', 0.85).split(',')[1]
    if (data) void run(() => profileService.avatar(data), 'Foto atualizada.', closeCrop)
  }

  function closeCrop() {
    setSelection(null)
    requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true }))
  }

  return <div className="profile-photo-editor">
    <div className="profile-identity">
      <button ref={trigger} className="profile-avatar-trigger" type="button" aria-label="Alterar foto" title="Alterar foto"
        disabled={busy || loading} aria-busy={loading} onClick={() => picker.current?.click()}>
        <UserAvatar name={name} avatarUrl={avatarUrl} />
        <span className={`profile-avatar-overlay${loading ? ' is-loading' : ''}`} aria-hidden="true">
          {loading ? <LoaderCircle className="spin" size={20} /> : <Pencil size={20} />}
        </span>
      </button>
      <input ref={picker} type="file" hidden accept="image/jpeg,image/png,image/webp" disabled={busy || loading} onChange={(event) => void choose(event)} />
      <div>{children}
        {avatarUrl ? <button className="profile-text-button profile-remove-photo" type="button" disabled={busy || loading}
          onClick={() => void run(profileService.removeAvatar, 'Foto removida.', closeCrop)}>Remover foto</button> : null}
      </div>
    </div>
    {loading ? <span className="sr-only" role="status">Abrindo foto…</span> : null}
    {error ? <p className="profile-error" role="alert">{error}</p> : null}
    {selection ? <div className="profile-crop">
      <canvas ref={canvas} width={256} height={256} role="img" aria-label="Pré-visualização do recorte da foto" />
      <div className="profile-crop-controls">
        <p>Ajuste o recorte da sua foto.</p>
        <label>Zoom<input type="range" min="1" max="3" step="0.05" value={zoom} disabled={busy} autoFocus onChange={(event) => setZoom(Number(event.target.value))} /></label>
        <label>Posição horizontal<input type="range" min="0" max="100" value={horizontal} disabled={busy} onChange={(event) => setHorizontal(Number(event.target.value))} /></label>
        <label>Posição vertical<input type="range" min="0" max="100" value={vertical} disabled={busy} onChange={(event) => setVertical(Number(event.target.value))} /></label>
        <div className="profile-actions">
          <button className="primary-action" type="button" disabled={busy} onClick={save}>Salvar foto</button>
          <button className="profile-text-button" type="button" disabled={busy} onClick={closeCrop}>Cancelar recorte</button>
        </div>
      </div>
    </div> : null}
  </div>
}
