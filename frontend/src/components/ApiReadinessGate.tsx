import { useEffect, useState, type ReactNode } from 'react'
import { Brand } from './Brand'
import api from '../services/api'
import { waitForApi } from '../utils/apiReadiness'
import '../preparation.css'

export function ApiReadinessGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'preparing' | 'ready' | 'error'>('checking')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setState('checking')
    // api usa a origem da página em produção e mantém o backend separado em desenvolvimento.
    void waitForApi(`${api.defaults.baseURL}/health`, {
      signal: controller.signal, onSlow: () => setState('preparing'),
    }).then((result) => { if (result !== 'cancelled' && !controller.signal.aborted) setState(result) })
    return () => controller.abort()
  }, [attempt])
  if (state === 'ready') return children
  return <main className="api-preparation" aria-busy={state !== 'error'}>
    <Brand />
    <section className={state === 'checking' ? 'api-preparation-copy is-checking' : 'api-preparation-copy'} aria-live="polite" aria-atomic="true">
      {state === 'error' ? <>
        <h1>Não conseguimos conectar ao FocusList.</h1>
        <p>A conexão está demorando mais que o esperado. Tente novamente em instantes.</p>
        <button type="button" onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</button>
      </> : <>
        <span className="preparation-loader" aria-hidden="true" />
        <h1>Preparando seu espaço...</h1>
        <p>O primeiro acesso pode levar alguns segundos.<br />Estamos preparando tudo para você.</p>
      </>}
    </section>
    <footer>Organize. Acompanhe. Conclua.</footer>
  </main>
}
