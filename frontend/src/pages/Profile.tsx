import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, LoaderCircle, LogOut } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ProfileAvatarEditor } from '../components/ProfileAvatarEditor'
import { authErrorMessage } from '../services/authService'
import profileService from '../services/profileService'
import type { PasswordChange, UserProfile, ViewMode } from '../services/profileService'
import { passwordChangeError, profileEditState, submitPasswordChange } from '../utils/profile'
import '../profile.css'

function PasswordField({ label, value, onChange, disabled, newPassword = false, autoFocus = false }: {
  label: string; value: string; onChange: (value: string) => void; disabled: boolean; newPassword?: boolean; autoFocus?: boolean
}) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  return <div className="area-form-field">
    <label htmlFor={id}>{label}</label>
    <div className="profile-password-input">
      <input id={id} type={visible ? 'text' : 'password'} autoComplete={newPassword ? 'new-password' : 'current-password'}
        value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} autoFocus={autoFocus} required />
      <button type="button" className="icon-button" disabled={disabled} aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLocaleLowerCase('pt-BR')}`}
        aria-controls={id} aria-pressed={visible} onClick={() => setVisible((current) => !current)}>
        {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
      </button>
    </div>
  </div>
}

const emptyPasswords: PasswordChange = { currentPassword: '', newPassword: '', confirmPassword: '' }

function RealProfile() {
  const { user, logout, updateProfile } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [editingAccount, setEditingAccount] = useState(false)
  const [confirmingEmail, setConfirmingEmail] = useState(false)
  const [editingPassword, setEditingPassword] = useState(false)
  const [passwords, setPasswords] = useState(emptyPasswords)
  const [view, setView] = useState<ViewMode>('list')
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const [notice, setNotice] = useState({ error: '', success: '' })
  const [passwordError, setPasswordError] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const editAccountButton = useRef<HTMLButtonElement>(null)
  const editPasswordButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.title
    document.title = 'Perfil | FocusList'
    heading.current?.focus({ preventScroll: true })
    return () => { document.title = previous }
  }, [])

  useEffect(() => {
    let active = true
    setLoadError('')
    profileService.get().then((data) => {
      if (!active) return
      setProfile(data)
      setName(data.name ?? '')
      setEmail(data.email ?? '')
      setView(data.defaultView)
      updateProfile(data)
    }).catch((error: unknown) => {
      if (active) setLoadError(authErrorMessage(error, 'Não foi possível carregar seu perfil.'))
    })
    return () => { active = false }
  }, [attempt, updateProfile])

  async function run(action: () => Promise<void>, message: string) {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setNotice({ error: '', success: '' })
    try { await action(); setNotice({ error: '', success: message }) }
    catch (error) { setNotice({ success: '', error: authErrorMessage(error, 'Não foi possível salvar. Tente novamente.') }) }
    finally { pending.current = false; setBusy(false) }
  }

  function saveProfile(action: () => Promise<UserProfile>, message: string, done?: () => void) {
    return run(async () => {
      const data = await action()
      setProfile(data)
      updateProfile(data)
      done?.()
    }, message)
  }

  function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = passwordChangeError(passwords)
    setPasswordError(validation)
    if (validation) return
    void run(async () => {
      await submitPasswordChange(passwords, profileService.password)
      closePassword()
    }, 'Senha alterada. Você continua conectado e as outras sessões foram encerradas.')
  }

  function closeAccount() {
    setEditingAccount(false)
    setConfirmingEmail(false)
    setEmailPassword('')
    requestAnimationFrame(() => editAccountButton.current?.focus({ preventScroll: true }))
  }

  function closePassword() {
    setEditingPassword(false)
    setPasswords(emptyPasswords)
    setPasswordError('')
    requestAnimationFrame(() => editPasswordButton.current?.focus({ preventScroll: true }))
  }

  const accountEdit = profileEditState(profile, name, email)

  function changeAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !accountEdit.valid || !accountEdit.changed) return
    if (accountEdit.emailChanged && !confirmingEmail) {
      setConfirmingEmail(true)
      setNotice({ error: '', success: '' })
      return
    }
    void saveProfile(() => profileService.update({ name: name.trim(), ...(accountEdit.emailChanged ? { email: email.trim().toLowerCase(), currentPassword: emailPassword } : {}) }), 'Dados da conta atualizados.', closeAccount)
  }

  return <div className="profile-page">
    <h1 ref={heading} tabIndex={-1}>Perfil</h1>
    <ProfileAvatarEditor name={user?.name ?? null} avatarUrl={user?.avatarUrl} busy={busy || !profile} run={saveProfile}>
      <h2>{user?.name}</h2>
        <small>Conta FocusList{profile ? ` · Membro desde ${new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(profile.createdAt))}` : ''}</small>
    </ProfileAvatarEditor>
    {loadError ? <div role="alert"><p className="profile-error">{loadError}</p><button className="secondary-action" type="button" onClick={() => setAttempt((current) => current + 1)}>Tentar novamente</button></div>
      : !profile ? <p className="profile-loading" role="status"><LoaderCircle className="spin" size={18} aria-hidden="true" />Carregando perfil…</p> : <>
    <div className="profile-notice" aria-live="polite" aria-atomic="true">
      {notice.error ? <p className="profile-error" role="alert">{notice.error}</p> : null}
      {notice.success ? <p className="profile-success" role="status">{notice.success}</p> : null}
    </div>
    <section className="profile-panel" aria-labelledby="profile-account">
      <h2 id="profile-account">Dados da conta</h2>
      {editingAccount ? <form id="profile-account-form" aria-busy={busy} onSubmit={changeAccount}>
        <div className="profile-fields">
          <label className="area-form-field"><span>Nome</span><input name="name" autoComplete="name" autoFocus required maxLength={200} disabled={busy} value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="area-form-field"><span>E-mail</span><input name="email" type="email" autoComplete="email" required maxLength={254} disabled={busy} value={email} onChange={(event) => {
            setEmail(event.target.value)
            setConfirmingEmail(false)
            setEmailPassword('')
          }} /></label>
        </div>
        {accountEdit.emailChanged && confirmingEmail ? <>
          <p className="profile-hint">Confirme sua senha atual para alterar o e-mail.</p>
          <PasswordField label="Senha atual para alterar e-mail" value={emailPassword} onChange={setEmailPassword} disabled={busy} autoFocus />
        </> : null}
        <div className="profile-actions profile-form-actions">
          <button className="profile-text-button" type="button" disabled={busy} onClick={() => {
            setName(profile.name ?? '')
            setEmail(profile.email ?? '')
            setNotice({ error: '', success: '' })
            closeAccount()
          }}>Cancelar</button>
          <button className="primary-action" type="submit" disabled={busy || !accountEdit.valid || !accountEdit.changed}>
            {busy ? <><LoaderCircle className="spin" size={16} aria-hidden="true" />Salvando…</> : 'Salvar alterações'}
          </button>
        </div>
      </form> : <>
        <dl className="profile-fields profile-account-details">
          <div><dt>Nome</dt><dd>{profile.name}</dd></div>
          <div><dt>E-mail</dt><dd>{profile.email}</dd></div>
        </dl>
        <button ref={editAccountButton} className="secondary-action" type="button" disabled={busy} onClick={() => {
          setName(profile.name ?? '')
          setEmail(profile.email ?? '')
          setNotice({ error: '', success: '' })
          setEditingAccount(true)
        }}>Editar perfil</button>
      </>}
    </section>
    <section className="profile-panel" aria-labelledby="profile-security">
      <h2 id="profile-security">Segurança</h2>
      {editingPassword ? <>
      <p className="profile-hint" id="profile-password-hint">Use de 8 a 32 caracteres. Ao alterar a senha, suas outras sessões serão encerradas.</p>
      <form id="profile-password-form" aria-busy={busy} aria-describedby="profile-password-hint" onSubmit={changePassword}>
        <PasswordField label="Senha atual" value={passwords.currentPassword} disabled={busy} autoFocus onChange={(currentPassword) => setPasswords((current) => ({ ...current, currentPassword }))} />
        <div className="profile-fields">
          <PasswordField label="Nova senha" value={passwords.newPassword} newPassword disabled={busy} onChange={(newPassword) => setPasswords((current) => ({ ...current, newPassword }))} />
          <PasswordField label="Confirmar nova senha" value={passwords.confirmPassword} newPassword disabled={busy} onChange={(confirmPassword) => setPasswords((current) => ({ ...current, confirmPassword }))} />
        </div>
        {passwordError ? <p className="profile-error" role="alert">{passwordError}</p> : null}
        <div className="profile-actions profile-form-actions">
          <button className="profile-text-button" type="button" disabled={busy} onClick={() => {
            setNotice({ error: '', success: '' })
            closePassword()
          }}>Cancelar</button>
          <button className="primary-action" type="submit" disabled={busy}>
            {busy ? <><LoaderCircle className="spin" size={16} aria-hidden="true" />Salvando…</> : 'Alterar senha'}
          </button>
        </div>
      </form>
      </> : <>
        <h3 className="profile-password-label">Senha</h3>
        <p className="profile-hint">Altere sua senha caso queira reforçar a segurança da sua conta.</p>
        <button ref={editPasswordButton} className="secondary-action" type="button" disabled={busy} onClick={() => {
          setNotice({ error: '', success: '' })
          setEditingPassword(true)
        }}>Alterar senha</button>
      </>}
    </section>
    <section className="profile-panel" aria-labelledby="profile-preferences">
      <h2 id="profile-preferences">Preferências</h2>
      <form aria-busy={busy} onSubmit={(event) => {
        event.preventDefault()
        void saveProfile(() => profileService.preferences(view), 'Visualização padrão atualizada.')
      }}>
        <label className="area-form-field"><span>Visualização padrão</span>
          <select value={view} disabled={busy} onChange={(event) => setView(event.target.value as ViewMode)}>
            <option value="list">Lista</option><option value="cards">Cards</option>
          </select>
        </label>
        <p className="profile-hint">Suas listas e tarefas abrem nesta visualização. Você pode alternar durante o uso.</p>
        <button className="primary-action" type="submit" disabled={busy || view === profile.defaultView}>Salvar preferência</button>
      </form>
    </section>
    <section className="profile-panel profile-session" aria-labelledby="profile-session">
      <div><h2 id="profile-session">Sessão</h2><p className="profile-hint">Encerre sua sessão neste dispositivo.</p></div>
      <button className="secondary-action" type="button" disabled={busy} onClick={() => void run(logout, '')}><LogOut size={18} aria-hidden="true" />Sair da conta</button>
    </section>
    </>}
  </div>
}

export function Profile() {
  const { user } = useAuth()
  return user?.type === 'REAL' ? <RealProfile /> : <Navigate to="/app" replace />
}
