/* Service Worker: App offline nutzbar machen.
   Erst Netz, sonst Cache: Neue Versionen erscheinen sofort, offline bleibt die letzte Version nutzbar.
   VERSION wird beim Build ersetzt – jede neue Version räumt alte Caches auf. */
const VERSION = '__VERSION__';
const CACHE = 'wachenalarm-' + VERSION;
const SHELL = ['./', 'index.html', 'src/styles.css', 'src/store.js', 'src/app.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'data/faelle.json', 'data/wissen.json'];

// cache: 'reload' umgeht den Browser-Cache, damit wirklich die neuen Dateien gespeichert werden
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('wachenalarm-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !isFont) return;
  if (isFont) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); return r; })));
    return;
  }
  e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: true })));
});
