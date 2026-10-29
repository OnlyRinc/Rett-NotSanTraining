/* Service Worker: App offline nutzbar machen.
   App-Dateien: aus dem Cache, im Hintergrund aktualisiert. Inhalte (data/*.json): erst Netz, sonst Cache.
   VERSION wird beim Build ersetzt – jede neue Version räumt alte Caches auf. */
const VERSION = '__VERSION__';
const CACHE = 'wachenalarm-' + VERSION;
const SHELL = ['./', 'index.html', 'src/styles.css', 'src/store.js', 'src/app.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'data/faelle.json', 'data/wissen.json'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('wachenalarm-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isData = url.origin === location.origin && url.pathname.includes('/data/');
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !isFont) return;
  if (isData) {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); return r; }).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
