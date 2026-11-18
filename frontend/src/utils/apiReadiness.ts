export async function waitForApi(url: string, options: {
  signal: AbortSignal; onSlow: () => void; request?: typeof fetch;
  timeout?: number; retryDelay?: number; grace?: number;
}): Promise<'ready' | 'error' | 'cancelled'> {
  const { signal, onSlow, request = fetch, timeout = 90000, retryDelay = 2500, grace = 800 } = options
  const deadline = AbortSignal.timeout(timeout)
  const combined = AbortSignal.any([signal, deadline])
  const slow = setTimeout(() => { if (!combined.aborted) onSlow() }, grace)
  try {
    while (!combined.aborted) {
      try {
        // Deployment Protection da Vercel pode exigir o cookie de acesso à própria origem.
        const response = await request(url, { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.any([combined, AbortSignal.timeout(6000)]) })
        if (response.ok && (await response.json()).status === 'OK' && !combined.aborted) return 'ready'
      } catch { /* Uma resposta HTML do proxy ou erro de rede não confirma a saúde da API. */ }
      if (!combined.aborted) await new Promise<void>((resolve) => {
        const done = () => { clearTimeout(timer); combined.removeEventListener('abort', done); resolve() }
        const timer = setTimeout(done, retryDelay)
        combined.addEventListener('abort', done, { once: true })
      })
    }
    return signal.aborted ? 'cancelled' : 'error'
  } finally { clearTimeout(slow) }
}
