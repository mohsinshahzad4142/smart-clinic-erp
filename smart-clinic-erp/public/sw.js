// Smart Clinic ERP - Offline Service Worker (Failsafe Caching)
const CACHE_NAME = 'smart-clinic-cache-v2';
const OFFLINE_URLS = [
  '/',
  '/manifest.webmanifest' // Fixed Next.js dynamic build manifest path
];

// Install Event - Pre-cache the main app shell and webmanifest
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event (Cleanup older deprecated caches)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clientsClaim())
  );
});

// Fetch Fallback to Cache
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request);
      })
    );
  }
});