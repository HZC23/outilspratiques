importScripts('js/dependencies/cache-polyfill.js');

// Installation - mise en cache initiale
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('demo-cache').then(function(cache) {
      return cache.put('/', new Response("From the cache!"));
    })
  );
});

// Stratégie cache-first avec fallback réseau
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Si trouvé dans le cache, renvoyer la réponse mise en cache
        if (response) {
          return response;
        }
        
        // Sinon, effectuer la requête réseau
        return fetch(event.request)
          .then(function(networkResponse) {
            // Mise en cache de la nouvelle réponse pour les futures requêtes
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open('demo-cache').then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(function() {
            // Si le réseau échoue aussi, renvoyer une réponse de secours
            return new Response("Impossible d'accéder à cette ressource");
          });
      })
  );
}); 