const CACHE_NAME = 'smart-clinic-cache-v15';
const OFFLINE_URLS = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS);
    }).then(() => self.skipWaiting())
  );
});

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
```
eof

```json:PWA Manifest:smart-clinic-erp/public/manifest.json
{
  "name": "Smart Clinic & Diagnostics",
  "short_name": "Smart Clinic",
  "description": "Premium Multi-tenant Clinic ERP Suite & Diagnostics System",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "icons": [
    {
      "src": "https://img.icons8.com/fluency/192/hospital-room.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "https://img.icons8.com/fluency/512/hospital-room.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ]
}