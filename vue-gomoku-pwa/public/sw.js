const CACHE_NAME = 'gomoku-pwa-v1.0.0';
const urlsToCache = [
  '/',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Ö»´¦Àí http/https ÇëÇó£¬ºöÂÔ chrome-extension µÈÆäËûÐ­Òé
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // »º´æÃüÖÐ£¬·µ»Ø»º´æÄÚÈÝ
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // ¼ì²éÊÇ·ñÊÇÓÐÐ§ÏìÓ¦
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // ¿ËÂ¡ÏìÓ¦
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              // Ö»»º´æ http/https ÇëÇó
              if (event.request.url.startsWith('http')) {
                cache.put(event.request, responseToCache);
              }
            });

          return response;
        }).catch(() => {
          // ÍøÂçÇëÇóÊ§°Ü£¬·µ»ØÀëÏßÒ³Ãæ
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});