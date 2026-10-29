import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { authErrorMessage } from '../services/authService'

export function DemoStartButton({ label = 'Ver demonstração', className = 'secondary-action' }: { label?: string; className?: string }) {
  const { startDemo, checkSession, status } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)

  async function start() {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setError('')
    try {
      await startDemo()
      navigate('/app')
    } catch (cause) {
      setError(authErrorMessage(cause, 'Não foi possível iniciar a demonstração. Tente novamente.'))
      // Uma outra aba pode ter iniciado uma sessão REAL desde a última verificação.
      void checkSession()
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return <div className="demo-start">
    <button className={className} type="button" disabled={busy || status === 'checking'} onClick={() => void start()}>
      {busy ? <LoaderCircle className="spin" size={17} aria-hidden="true" /> : null}
      {busy ? 'Abrindo demonstração…' : label}
    </button>
    {error ? <div className="demo-start-error" role="alert"><p>{error}</p><Link to="/app">Voltar ao FocusList</Link></div> : null}
  </div>
}
