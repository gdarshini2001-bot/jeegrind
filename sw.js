const CACHE = 'jeegrind-v2';
const ASSETS = ['/', '/index.html'];

// Only cache local app assets — never Firebase, Google APIs, or auth
const NEVER_CACHE = [
  'firestore.googleapis.com',
  'firebase.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'gstatic.com',
  'googleapis.com',
  'firebaseio.com',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Never cache Firebase/Google requests
  const url = e.request.url;
  if (NEVER_CACHE.some(domain => url.includes(domain))) return;

  // Only cache same-origin requests (local app files)
  if (!url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Network first, fall back to cache
      return fetch(e.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(cache => cache.put(e.request, clone));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
