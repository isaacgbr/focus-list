import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext'
import { Brand } from '../components/Brand'
import authService, { authErrorMessage, isInvalidPasswordReset } from '../services/authService'
import '../auth.css'

type Field = 'email' | 'password' | 'confirmPassword'

export function PasswordRecoveryPage({ reset = false }: { reset?: boolean }) {
  const { resetPassword } = useAuth()
  const [token, setToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [visible, setVisible] = useState({ password: false, confirmPassword: false })
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const form = useRef<HTMLFormElement>(null)
  const validToken = /^[0-9a-f]{64}$/.test(token)
  const resetComplete = reset && !!success
  const invalidLink = reset && !validToken && !resetComplete

  useEffect(() => {
    const previous = document.title
    document.title = `${reset ? 'Redefinir senha' : 'Recuperar senha'} | FocusList`
    // Remove o segredo da barra de endereço e da entrada atual do histórico.
    if (reset && window.location.hash) window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
    heading.current?.focus({ preventScroll: true })
    return () => { document.title = previous }
  }, [reset])

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [resetComplete, invalidLink])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current || success || (reset && !validToken)) return
    const validation: Partial<Record<Field, string>> = {}
    const normalizedEmail = email.trim().toLowerCase()
    if (reset) {
      if ([...password].length < 8 || [...password].length > 32 || new TextEncoder().encode(password).length > 128) validation.password = 'Use uma senha com 8 a 32 caracteres.'
      if (confirmation !== password) validation.confirmPassword = 'As senhas não conferem.'
    } else if (normalizedEmail.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(normalizedEmail)) {
      validation.email = 'Informe um e-mail válido.'
    }
    setErrors(validation)
    setError('')
    const firstInvalid = Object.keys(validation)[0]
    if (firstInvalid) {
      form.current?.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus()
      return
    }
    submitting.current = true
    setBusy(true)
    try {
      if (reset) {
        await resetPassword({ token, password, confirmPassword: confirmation })
        setToken('')
        setPassword('')
        setConfirmation('')
        setSuccess('Sua senha foi alterada e suas sessões anteriores foram encerradas.')
      } else {
        setSuccess(await authService.forgotPassword(normalizedEmail))
      }
    } catch (cause) {
      if (reset && isInvalidPasswordReset(cause)) {
        setToken('')
        setPassword('')
        setConfirmation('')
      } else setError(authErrorMessage(cause, 'Não foi possível concluir. Tente novamente.'))
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  function field(key: Field, label: string, value: string, onChange: (value: string) => void) {
    const passwordKey = key === 'email' ? null : key
    const shown = passwordKey ? visible[passwordKey] : false
    return (
      <div className="auth-field">
        <label htmlFor={`recovery-${key}`}>{label}</label>
        <div className={passwordKey ? 'auth-input-wrap auth-input-password' : 'auth-input-wrap'}>
          <input id={`recovery-${key}`} name={key} type={passwordKey ? (shown ? 'text' : 'password') : 'email'}
            value={value} onChange={(event) => onChange(event.target.value)} autoComplete={passwordKey ? 'new-password' : 'email'}
            required disabled={busy || !!success || (reset && !validToken)} spellCheck={false} autoCapitalize="none"
            aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `recovery-${key}-error` : key === 'password' ? 'recovery-password-hint' : undefined} />
          {passwordKey ? <button className="auth-password-toggle" type="button" disabled={busy || !validToken}
            aria-label={`${shown ? 'Ocultar' : 'Mostrar'} ${key === 'confirmPassword' ? 'confirmação de senha' : 'senha'}`}
            aria-controls={`recovery-${key}`} aria-pressed={shown} onMouseDown={(event) => event.preventDefault()}
            onClick={() => setVisible((previous) => ({ ...previous, [passwordKey]: !previous[passwordKey] }))}>
            {shown ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button> : null}
        </div>
        {errors[key] ? <span className="auth-field-error" id={`recovery-${key}-error`}>{errors[key]}</span> : null}
      </div>
    )
  }

  return (
    <div className="auth-page">
      <header className="auth-header">
        <Link to="/" aria-label="FocusList — início"><Brand /></Link>
        <Link className="auth-back" to="/login"><ArrowLeft size={16} aria-hidden="true" />Voltar para o Login</Link>
      </header>
      <main className="auth-shell auth-recovery-shell">
        <section className="auth-form-panel auth-form-login is-active" aria-labelledby="recovery-title">
          <div className="auth-form-content">
            <h1 id="recovery-title" ref={heading} tabIndex={-1}>{resetComplete ? 'Senha redefinida.' : invalidLink ? 'Este link não é mais válido.' : reset ? 'Crie uma nova senha.' : success ? 'Confira seu e-mail' : 'Recupere seu acesso.'}</h1>
            <p className="auth-description" role={!reset && success ? 'status' : undefined}>{resetComplete ? success : invalidLink ? 'Solicite um novo link para redefinir sua senha.' : reset ? 'Escolha uma nova senha para acessar seu espaço.' : success ? 'As instruções para redefinir sua senha serão enviadas para o endereço informado.' : 'Informe seu e-mail para receber as instruções de recuperação.'}</p>
            {resetComplete || invalidLink ? (
              <Link className="auth-submit" to={resetComplete ? '/login' : '/recuperar-senha'}>
                {resetComplete ? 'Entrar no FocusList' : 'Solicitar novo link'}<ArrowRight size={17} aria-hidden="true" />
              </Link>
            ) : <>
            <form ref={form} onSubmit={handleSubmit} noValidate aria-busy={busy}>
              {reset ? <>
                {field('password', 'Nova senha', password, setPassword)}
                <p className="auth-password-hint" id="recovery-password-hint">Mínimo de 8 caracteres.</p>
                {field('confirmPassword', 'Confirmar nova senha', confirmation, setConfirmation)}
              </> : field('email', 'E-mail', email, setEmail)}
              <div className="auth-error-slot" aria-live="polite" aria-atomic="true">
                {error ? <p role="alert">{error}</p> : null}
              </div>
              <button className="auth-submit" type="submit" disabled={busy || !!success || (reset && !validToken)}>
                {busy ? <LoaderCircle className="auth-spinner" size={18} aria-hidden="true" /> : null}
                {busy ? (reset ? 'Redefinindo…' : 'Enviando…') : (reset ? 'Redefinir senha' : 'Enviar instruções')}
                {!busy ? <ArrowRight size={17} aria-hidden="true" /> : null}
              </button>
            </form>
            {!reset ? <p className="auth-switch"><Link to="/login">Voltar para o Login</Link></p> : null}
            </>}
          </div>
        </section>
      </main>
      <footer className="auth-footer">Um lugar para organizar o que importa.</footer>
    </div>
  )
}
