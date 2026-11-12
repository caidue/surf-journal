/* Surf Journal service worker.
 * The build (see vite.config.ts) fills in VERSION (a content hash) and PRECACHE (every built file),
 * so after the first visit the whole app opens without a connection.
 *
 * - App files: served from the precache; a new build installs in the background and the page
 *   offers "Reload" (the app sends SKIP_WAITING).
 * - Map (OpenFreeMap): tiles, fonts and sprites cache-first (their URLs are versioned or stable),
 *   style and tile index network-first with a cached fallback. Capped so it can't grow forever.
 * - Spot photos (Wikimedia Commons): cache-first, kept for offline use.
 * - Conditions (Open-Meteo) and place search are not touched here: the app keeps them in IndexedDB.
 */
const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const SHELL = `shell-${VERSION}`;
const MAP_TILES = 'map-tiles';
const MAP_META = 'map-meta';
const PHOTOS = 'spot-photos';
const MAX_TILES = 1500;

// Static servers often send `Vary: Origin`; module scripts are requested with an Origin header and
// the precache requests without one, so ignore Vary or nothing would match offline.
const MATCH = { cacheName: SHELL, ignoreSearch: true, ignoreVary: true };

const scopeUrl = new URL(self.registration.scope);
const indexUrl = new URL('index.html', scopeUrl).href;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE.map((p) => new Request(new URL(p, scopeUrl), { cache: 'reload' })))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key.startsWith('shell-') && key !== SHELL) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === scopeUrl.origin && url.pathname.startsWith(scopeUrl.pathname)) {
    if (req.mode === 'navigate') {
      event.respondWith(caches.match(indexUrl, MATCH).then((hit) => hit || fetch(req)));
    } else {
      event.respondWith(caches.match(req, MATCH).then((hit) => hit || fetch(req)));
    }
    return;
  }

  // Spot photos from Wikimedia Commons: keep the ones you've seen for offline use.
  if (url.hostname === 'upload.wikimedia.org' || url.hostname === 'thumb.wikimedia.org') {
    event.respondWith(cacheFirst(req, PHOTOS));
    return;
  }

  if (url.hostname === 'tiles.openfreemap.org') {
    const immutable = /\.(pbf|mvt|png|webp|jpg)$/.test(url.pathname) || url.pathname.includes('/sprites/');
    event.respondWith(immutable ? cacheFirst(req, MAP_TILES) : networkFirst(req, MAP_META));
  }
});

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req, { ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone()).then(() => trim(cache));
  return res;
}

/** Network first; if the network hasn't answered in a few seconds and we have a copy, use the copy. */
async function networkFirst(req, name, waitMs = 4000) {
  const cache = await caches.open(name);
  const net = fetch(req).then((res) => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  });
  const first = await Promise.race([net.catch(() => null), new Promise((r) => setTimeout(r, waitMs, null))]);
  if (first) return first;
  return (await cache.match(req, { ignoreVary: true })) || net;
}

let puts = 0;
async function trim(cache) {
  if (++puts % 50) return;
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_TILES; i++) await cache.delete(keys[i]);
}
