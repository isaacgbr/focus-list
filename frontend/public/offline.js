const button = document.getElementById('retry');
const status = document.getElementById('status');
let checking = false;
async function retry() {
  if (checking) return;
  checking = true; button.disabled = true; status.textContent = 'Verificando conexão…';
  try {
    // Query não atendida pelo cache do SW: só uma resposta da rede permite retornar.
    const response = await fetch('/offline.html?connection-check', { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('unavailable');
    (window.top || window).location.reload();
  } catch { status.textContent = 'Ainda não foi possível conectar. Verifique sua conexão e tente novamente.'; }
  finally { checking = false; button.disabled = false; }
}
button.addEventListener('click', retry);
window.addEventListener('online', retry);
document.addEventListener('visibilitychange', () => { if (!document.hidden && navigator.onLine) void retry(); });
document.getElementById('offline-title').focus({ preventScroll: true });
