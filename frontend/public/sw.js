const CACHE = 'focuslist-offline-v2';
const ASSETS = ['/offline.html', '/offline.css', '/offline.js', '/focuslist-mark.png'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('focuslist-offline-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Lista fechada de arquivos públicos; nunca escreve respostas de navegação ou API.
  if (!url.search && ASSETS.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then((cache) => cache.match(url.pathname)).then((cached) => cached || fetch(request)));
    return;
  }
  const appNavigation = url.pathname === '/' || url.pathname === '/app' || url.pathname.startsWith('/app/') || ['/login', '/cadastro', '/recuperar-senha', '/redefinir-senha', '/demo', '/demo/dados'].includes(url.pathname);
  // Requisições HTTP de API/autenticação não são navegações e não são interceptadas.
  if (request.mode !== 'navigate' || !appNavigation) return;
  event.respondWith(fetch(request).catch(() => caches.open(CACHE).then((cache) => cache.match('/offline.html'))));
});
