import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { SessionGate } from '../auth/AuthGate'
import { AuthScene } from '../auth/AuthScene'
import { useAuth } from '../auth/AuthContext'
import { Brand } from '../components/Brand'
import authService, { authErrorMessage } from '../services/authService'
import '../auth.css'

type Mode = 'login' | 'register'
type Field = 'name' | 'email' | 'password' | 'confirmPassword'
type FieldErrors = Partial<Record<Field, string>>

function AuthVisual({ register }: { register: boolean }) {
  return (
    <div className="auth-visual-content">
      <img className="auth-visual-mark" src="/focuslist-mark.png" width="88" height="88" alt="" />
      <h2>{register ? 'Organize. Acompanhe. Conclua.' : 'Foque no que importa.'}</h2>
      <AuthScene register={register} />
    </div>
  )
}

function AuthForm({ mode, active, email, onEmailChange, success, onRegistered }: {
  mode: Mode
  active: boolean
  email: string
  onEmailChange: (email: string) => void
  success: string
  onRegistered: () => void
}) {
  const register = mode === 'register'
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState({ password: false, confirmPassword: false })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const activeRef = useRef(active)
  activeRef.current = active
  const heading = useRef<HTMLHeadingElement>(null)
  const form = useRef<HTMLFormElement>(null)

  useEffect(() => {
    setPassword('')
    setConfirmation('')
    setVisiblePasswords({ password: false, confirmPassword: false })
    setErrors({})
    setError('')
    if (!active) return
    const frame = requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(frame)
  }, [active])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current || !active) return
    const validation: FieldErrors = {}
    const normalizedEmail = email.trim().toLowerCase()
    if (register && (!name.trim() || [...name.trim()].length > 100 || /[\u0000-\u001f\u007f]/.test(name.trim()))) {
      validation.name = 'Informe seu nome, com até 100 caracteres.'
    }
    if (normalizedEmail.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(normalizedEmail)) {
      validation.email = 'Informe um e-mail válido.'
    }
    if ([...password].length < 8 || [...password].length > 32 || new TextEncoder().encode(password).length > 128) {
      validation.password = 'Use uma senha com 8 a 32 caracteres.'
    }
    if (register && confirmation !== password) validation.confirmPassword = 'As senhas não conferem.'
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
      if (register) {
        await authService.register({ name: name.trim(), email: normalizedEmail, password, confirmPassword: confirmation })
        if (activeRef.current) onRegistered()
      } else {
        await login({ email: normalizedEmail, password })
      }
      setPassword('')
      setConfirmation('')
    } catch (cause) {
      if (activeRef.current) setError(authErrorMessage(cause, register ? 'Não foi possível criar sua conta. Tente novamente.' : 'Não foi possível entrar. Tente novamente.'))
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  const field = (key: Field, label: string, value: string, onChange: (value: string) => void, type: string, autoComplete: string) => {
    const passwordKey = key === 'password' || key === 'confirmPassword' ? key : null
    const visible = passwordKey ? visiblePasswords[passwordKey] : false
    return (
      <div className="auth-field">
        <label htmlFor={`${mode}-${key}`}>{label}</label>
        <div className={passwordKey ? 'auth-input-wrap auth-input-password' : 'auth-input-wrap'}>
          <input id={`${mode}-${key}`} name={key} type={passwordKey && visible ? 'text' : type} value={value} onChange={(event) => onChange(event.target.value)}
            autoComplete={autoComplete} required disabled={busy} spellCheck={false} autoCapitalize={key === 'name' ? 'words' : 'none'}
            aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${mode}-${key}-error` : register && key === 'password' ? 'register-password-hint' : undefined} />
          {passwordKey ? <button className="auth-password-toggle" type="button" disabled={busy}
            aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${key === 'confirmPassword' ? 'confirmação de senha' : 'senha'}`}
            aria-controls={`${mode}-${key}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setVisiblePasswords((previous) => ({ ...previous, [passwordKey]: !previous[passwordKey] }))}>
            {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button> : null}
        </div>
        {errors[key] ? <span className="auth-field-error" id={`${mode}-${key}-error`}>{errors[key]}</span> : null}
      </div>
    )
  }

  return (
    <section className={`auth-form-panel auth-form-${mode}${active ? ' is-active' : ''}`} inert={!active} aria-hidden={!active} aria-labelledby={`${mode}-title`}>
      <div className="auth-form-content">
        <h1 id={`${mode}-title`} ref={heading} tabIndex={-1}>{register ? 'Crie seu espaço.' : 'Acesse seu espaço.'}</h1>
        <p className="auth-description">{register ? 'Organize suas tarefas e mantenha suas prioridades em ordem.' : 'Suas tarefas, projetos e planos em um só lugar.'}</p>
        {success && !register ? <p className="auth-success" role="status">{success}</p> : null}
        <form ref={form} onSubmit={handleSubmit} noValidate aria-busy={busy}>
          {register ? field('name', 'Nome', name, setName, 'text', 'name') : null}
          {field('email', 'E-mail', email, onEmailChange, 'email', 'username')}
          {field('password', 'Senha', password, setPassword, 'password', register ? 'new-password' : 'current-password')}
          {register ? <>
            <p className="auth-password-hint" id="register-password-hint">Mínimo de 8 caracteres.</p>
            {field('confirmPassword', 'Confirmar senha', confirmation, setConfirmation, 'password', 'new-password')}
          </> : null}
          <div className="auth-error-slot" aria-live="polite" aria-atomic="true">{error ? <p role="alert">{error}</p> : null}</div>
          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="auth-spinner" size={18} aria-hidden="true" /> : null}
            {busy ? (register ? 'Criando sua conta…' : 'Entrando…') : (register ? 'Criar minha conta' : 'Entrar')}
            {!busy ? <ArrowRight size={17} aria-hidden="true" /> : null}
          </button>
        </form>
        <p className="auth-switch">{register ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}{' '}
          <Link to={register ? '/login' : '/cadastro'} aria-disabled={busy} onClick={(event) => { if (busy) event.preventDefault() }}>
            {register ? 'Entrar' : 'Criar conta'}
          </Link>
        </p>
      </div>
    </section>
  )
}

export function AuthPage() {
  const { status } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const register = pathname === '/cadastro'
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const previous = document.title
    document.title = `${register ? 'Criar conta' : 'Entrar'} | FocusList`
    return () => { document.title = previous }
  }, [register])

  function onRegistered() {
    setSuccess('Conta criada com sucesso. Entre para começar a organizar seu espaço.')
    navigate('/login', { replace: true })
  }

  return (
    <SessionGate>
      {status === 'authenticated' ? <Navigate to="/app" replace /> : (
        <div className="auth-page">
          <header className="auth-header">
            <Link to="/" aria-label="FocusList — início"><Brand /></Link>
            <Link className="auth-back" to="/"><ArrowLeft size={16} aria-hidden="true" />Voltar para o início</Link>
          </header>
          <main className={`auth-shell${register ? ' is-register' : ''}`}>
            <AuthForm mode="login" active={!register} email={email} onEmailChange={setEmail} success={success} onRegistered={onRegistered} />
            <AuthForm mode="register" active={register} email={email} onEmailChange={setEmail} success="" onRegistered={onRegistered} />
            <aside className="auth-visual" aria-label="Seu foco com o FocusList">
              <div className="auth-visual-login" aria-hidden={register}><AuthVisual register={false} /></div>
              <div className="auth-visual-register" aria-hidden={!register}><AuthVisual register /></div>
            </aside>
          </main>
          <footer className="auth-footer">Um lugar para organizar o que importa.</footer>
        </div>
      )}
    </SessionGate>
  )
}
