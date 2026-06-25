const CACHE = 'fsc-v43';
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
    ).then(() => {
      self.clients.claim();
      return self.clients.matchAll({type:'window'}).then(clients => {
        clients.forEach(c => c.postMessage('SW_UPDATED'));
      });
    })
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname !== 'fscfigma-lab.github.io') return;
  if (e.request.destination === 'document' || url.pathname === BASE+'/' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

self.addEventListener('push', e => {
  let data = {title: 'FSC', body: 'Новое уведомление', tag: 'fsc'};
  try { data = e.data.json(); } catch(_) {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: BASE + '/icon-192.png',
      badge: BASE + '/icon-192.png',
      tag: data.tag || 'fsc',
      renotify: true,
      data: {url: 'https://fscfigma-lab.github.io/fsc-app/'}
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({type:'window'}).then(list => {
      for (const c of list) {
        if (c.url.includes('fsc-app') && 'focus' in c) return c.focus();
      }
      return clients.openWindow('https://fscfigma-lab.github.io/fsc-app/');
    })
  );
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
