const CACHE = 'bird-bingo-v1';
const SHELL = ['/', '/index.html', '/manifest.json', '/icon.svg'];

// Cache the app shell on install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Clean up old caches on activate
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - App shell → cache first (works offline)
// - eBird / Wikipedia → network first (live data), fall back to cache if available
self.addEventListener('fetch', e => {
  const url = e.request.url;
  const isAPI = url.includes('ebird.org') || url.includes('wikipedia.org') || url.includes('googleapis.com');

  if (isAPI) {
    // Network first for API calls
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache first for app shell
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});
