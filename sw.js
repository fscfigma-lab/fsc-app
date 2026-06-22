const CACHE = 'fsc-v26';
const BASE = '/fsc-app';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([BASE+'/icon-192.png', BASE+'/icon-512.png', BASE+'/manifest.json']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Внешние запросы (ntfy, Supabase, Google и т.д.) — не трогаем, браузер сам
  if (url.hostname !== 'fscfigma-lab.github.io') return;
  // HTML — всегда с сервера, никогда не кэшируем
  if (e.request.destination === 'document' || url.pathname === BASE+'/' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).catch(() => caches.match(e.request))
    );
    return;
  }
  // Статика — кэш, потом сеть
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'FSC App', {
      body: data.body || '',
      icon: self.location.origin + '/fsc-app/icon-192.png',
      badge: self.location.origin + '/fsc-app/icon-192.png',
      tag: data.tag || 'fsc',
      renotify: true,
      data: { url: self.location.origin + '/fsc-app/' }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(cs => {
      for (const c of cs) if (c.url.includes('/fsc-app') && 'focus' in c) return c.focus();
      if (clients.openWindow) return clients.openWindow('/fsc-app/');
    })
  );
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
