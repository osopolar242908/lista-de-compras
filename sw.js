/* Service worker: guarda la app para que abra sin internet */
const CACHE = 'mi-lista-v2';
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icono-192.png',
  './icono-512.png',
  './icono-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ns => Promise.all(ns.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

/* primero la copia guardada; si no está, la red (y se guarda para la próxima) */
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;

  /* la página se pide primero a internet, para que las mejoras lleguen solas;
     si no hay conexión, se usa la copia guardada */
  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(req).then(res => {
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copia)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(guardado => {
      if(guardado) return guardado;
      return fetch(req).then(res => {
        if(res && res.status === 200 && res.type === 'basic'){
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
        }
        return res;
      }).catch(() => guardado);
    })
  );
});
