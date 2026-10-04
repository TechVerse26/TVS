/**
 * Tech Verse — Service Worker
 * Cache-first for assets, Network-first for pages
 */
const CACHE     = 'tv-v2';
const CACHE_URLS = [
  '/',
  '/style/main.css',
  '/style/components.css',
  '/src/app.js',
  '/src/firebase/config.js',
  '/src/components/navbar.js',
  '/src/components/footer.js',
  '/src/components/search.js',
  '/src/components/toast.js',
  '/src/components/auth.js',
  '/src/components/postcard.js',
  '/src/pages/home.js',
  '/src/pages/blog.js',
  '/src/pages/auth.js',
  '/src/pages/404.js',
  '/manifest.json',
];

// Install — pre-cache shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CACHE_URLS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — stale-while-revalidate for assets, network-first for API
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and external
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) return;

  // Firebase & CDN — network only
  if (url.hostname.includes('firebasejs') || url.hostname.includes('googleapis') || url.hostname.includes('jsdelivr')) return;

  e.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request).then(res => {
        if (res.ok && res.status < 400) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return res;
      });
      return cached || network;
    })
  );
});
