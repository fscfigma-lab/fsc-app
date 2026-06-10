const CACHE = 'fsc-v4';
const ASSETS = ['/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

// Установка — кэшируем только статику (иконки, манифест)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(['/icon-192.png', '/icon-512.png', '/manifest.json']))
  );
  self.skipWaiting(); // сразу активируем новый SW
});

// Активация — удаляем старые кэши
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // берём контроль над всеми вкладками
});

// Стратегия: для HTML — всегда сеть (свежая версия), для остального — кэш
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // HTML — network first: всегда пробуем получить свежую версию
  if (e.request.destination === 'document' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // Сохраняем свежую версию в кэш
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request)) // если нет сети — из кэша
    );
    return;
  }

  // Остальное — cache first (иконки, шрифты)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// Сообщаем всем вкладкам что есть обновление
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
