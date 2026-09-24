// Kanji Cards service worker - opt-in offline support (see the "Work
// offline" setting in the app; syncServiceWorker() in index.html registers
// and unregisters this to match that toggle).
//
// Strategy: network-first with a 3-second timeout, falling back to the
// cache. Each file is cached separately (not via cache.addAll(), so one
// missing/failing file doesn't sink the whole precache). Navigations that
// don't match a cached file fall back to the cached index.html, so the app
// still opens offline even if the exact URL requested isn't in the cache.
//
// CACHE_VERSION must change whenever this file's contents or PRECACHE_URLS
// change, or an offline install keeps serving a stale copy - bump it
// alongside the app's own vYYMMDD.NNN stamp. The 'kanji-cards-' prefix on
// every cache name is deliberate: this app and its companions (the main
// drill app, Kanji Strokes) each use their own prefix, so if they're ever
// served from the same origin, one app's cache cleanup can never delete
// another's.
const CACHE_VERSION = 'kanji-cards-v260924-002';
const PRECACHE_URLS = [
  './',
  'index.html',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-512-maskable.png',
  'icons/apple-touch-icon.png',
  'fonts/BizUDPGothic-Regular.ttf',
];
const NETWORK_TIMEOUT_MS = 3000;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      Promise.all(PRECACHE_URLS.map(url =>
        cache.add(url).catch(() => {}) // one bad/missing file shouldn't fail the whole install
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name => name.startsWith('kanji-cards-') && name !== CACHE_VERSION)
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    withTimeout(fetch(req), NETWORK_TIMEOUT_MS)
      .then(res => {
        // Refresh the cache with whatever the network gave us, so the next
        // offline session has the latest copy - best-effort, never blocks
        // the response.
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then(cached => {
          if (cached) return cached;
          if (req.mode === 'navigate') return caches.match('index.html');
          return Promise.reject(new Error('offline and not cached'));
        })
      )
  );
});
