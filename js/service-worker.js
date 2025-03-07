const CACHE_NAME = 'outilspratiques-v1';
const BASE_PATH = '/outilspratiques.github.io';

// Liste des ressources à mettre en cache
const RESOURCES_TO_CACHE = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/styles.css`,
    `${BASE_PATH}/css/menu.css`,
    `${BASE_PATH}/css/theme-switch.css`,
    `${BASE_PATH}/css/notification.css`,
    `${BASE_PATH}/js/main.js`,
    `${BASE_PATH}/js/menu.js`,
    `${BASE_PATH}/js/theme.js`,
    `${BASE_PATH}/js/utils.js`
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(RESOURCES_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName !== CACHE_NAME)
                        .map(cacheName => caches.delete(cacheName))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
    // Ne pas intercepter les requêtes vers d'autres domaines
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }

                return fetch(event.request)
                    .then(response => {
                        // Ne mettre en cache que les requêtes réussies
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    });
            })
    );
}); 