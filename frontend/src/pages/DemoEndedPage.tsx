import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { SessionGate } from '../auth/AuthGate'
import { Brand } from '../components/Brand'
import { DemoStartButton } from '../components/DemoStartButton'
import '../demo.css'

export function DemoEndedPage() {
  const { user } = useAuth()
  return <SessionGate>
    {user?.type === 'DEMO' ? <Navigate to="/app" replace /> : <main className="demo-message">
      <Brand />
      <h1>{user ? 'Você já possui uma sessão ativa.' : 'A demonstração terminou.'}</h1>
      <p>{user ? 'Volte ao FocusList para continuar com sua conta.' : 'Sua sessão de demonstração expirou ou não está mais disponível. Você pode iniciar uma nova demonstração vazia.'}</p>
      <div className="demo-message-actions">
        <Link className="secondary-action" to="/">Voltar ao início</Link>
        {user ? <Link className="primary-action" to="/app">Voltar ao FocusList</Link> : <DemoStartButton label="Ver nova demonstração" className="primary-action" />}
      </div>
    </main>}
  </SessionGate>
}
