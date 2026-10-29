import { useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { SessionGate } from '../auth/AuthGate'
import { Brand } from '../components/Brand'
import { authErrorMessage } from '../services/authService'
import '../demo.css'

export function DemoImportPage() {
  const { user, resolveDemo, checkSession } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const pending = useRef(false)

  async function choose(action: 'import' | 'discard') {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setError('')
    try { await resolveDemo(action); navigate('/app', { replace: true }) }
    catch (cause) {
      setError(authErrorMessage(cause, 'Não foi possível confirmar sua escolha. Tente novamente.'))
      // Reconsulta o vínculo após expiração, escolha em outra aba ou resposta perdida.
      try { await checkSession() } catch { /* O estado de erro global oferece nova tentativa. */ }
      setUnavailable(true)
    } finally { pending.current = false; setBusy(false) }
  }

  const contextMissing = !user?.demoImport
  return <SessionGate>
    {user?.type !== 'REAL' ? <Navigate to={user ? '/app' : '/login'} replace /> : <main className="demo-message">
      <Brand />
      <h1>{state?.registered ? 'Conta criada!' : 'Seus dados da demonstração'}</h1>
      <p>O que deseja fazer com os dados da demonstração?</p>
      {user.demoImport === 'unavailable' || contextMissing ? <p role="status">A demonstração expirou ou seu contexto não está mais disponível. Sua conta está pronta para começar do zero.</p> : null}
      {error ? <p className="demo-error" role="alert">{error}</p> : null}
      <div className="demo-message-actions" aria-busy={busy}>
        {!contextMissing ? <>
          <button className="primary-action" type="button" disabled={busy || user.demoImport !== 'pending'} onClick={() => void choose('import')}>Importar meus dados</button>
          <button className="secondary-action" type="button" disabled={busy} onClick={() => void choose('discard')}>Começar do zero</button>
        </> : <Link className="primary-action" to="/app">{unavailable ? 'Continuar no FocusList' : 'Começar do zero'}</Link>}
      </div>
    </main>}
  </SessionGate>
}
