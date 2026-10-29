import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { authErrorMessage } from '../services/authService'
import '../demo.css'

export function DemoFrame({ children }: { children: ReactNode }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)

  async function exit() {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setError('')
    try { await logout(); navigate('/', { replace: true }) }
    catch (cause) { setError(authErrorMessage(cause, 'Não foi possível sair da demonstração. Tente novamente.')) }
    finally { pending.current = false; setBusy(false) }
  }

  return <div className="demo-stage">
    <div className="demo-window">
      <header className="demo-context" aria-label="Modo Demonstração">
        <div><strong>Demonstração FocusList</strong><p>Seus dados são temporários por 24h.</p></div>
        <nav aria-label="Ações da demonstração">
          <Link className="primary-action" to="/cadastro?origem=demo">Criar conta</Link>
          <button className="secondary-action" type="button" disabled={busy} onClick={() => void exit()}>
            {busy ? <LoaderCircle className="spin" size={16} aria-hidden="true" /> : null}Sair da demonstração
          </button>
        </nav>
        {error ? <p className="demo-error" role="alert">{error}</p> : null}
      </header>
      {children}
    </div>
  </div>
}
