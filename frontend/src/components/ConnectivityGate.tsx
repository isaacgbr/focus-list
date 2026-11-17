import { useEffect, useState, type ReactNode } from 'react'

export function ConnectivityGate({ children }: { children: ReactNode }) {
  const [offline, setOffline] = useState(() => !navigator.onLine)
  useEffect(() => {
    let disposed = false
    const disconnected = () => setOffline(true)
    const check = async () => {
      if (document.hidden || !navigator.onLine) return
      try {
        // navigator.onLine indica a rede local, não garante acesso ao site.
        const response = await fetch('/offline.html?connection-check', { method: 'HEAD', cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(8000) })
        if (!disposed && response.ok && offline) window.location.reload()
      } catch { if (!disposed && !navigator.onLine) setOffline(true) }
    }
    window.addEventListener('offline', disconnected)
    document.addEventListener('visibilitychange', check)
    const timer = window.setInterval(check, 30000)
    void check()
    return () => {
      disposed = true
      window.clearInterval(timer)
      window.removeEventListener('offline', disconnected)
      document.removeEventListener('visibilitychange', check)
    }
  }, [offline])
  // Uma página compartilhada também funciona sem React ao abrir a PWA offline.
  if (offline) return <iframe title="FocusList — sem conexão" src="/offline.html" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, background: '#07111c', zIndex: 1000 }} />
  return children
}
