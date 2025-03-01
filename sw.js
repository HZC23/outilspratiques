const CACHE_NAME = 'outils-pratiques-v1';
const BASE_URL = 'https://hzc23.github.io/outilspratiques.github.io';
const ASSETS = [
    `${BASE_URL}/`,
    `${BASE_URL}/index.html`,
    `${BASE_URL}/styles.css`,
    `${BASE_URL}/scripts.js`,
    `${BASE_URL}/manifest.json`,
    `${BASE_URL}/offline.html`,
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
];

// Installation du Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
});

// Interception des requêtes
self.addEventListener('fetch', event => {
    // Vérifier si la requête est pour notre domaine
    if (event.request.url.startsWith(BASE_URL)) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    // Cache-first strategy
                    if (response) {
                        return response;
                    }

                    // Si la ressource n'est pas en cache, on la récupère depuis le réseau
                    return fetch(event.request).then(response => {
                        // On ne met en cache que les requêtes GET
                        if (event.request.method !== 'GET') {
                            return response;
                        }

                        // On clone la réponse car elle ne peut être utilisée qu'une fois
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    });
                })
                .catch(() => {
                    // Si la requête échoue (pas de connexion), on retourne la page offline
                    if (event.request.mode === 'navigate') {
                        return caches.match(`${BASE_URL}/offline.html`);
                    }
                })
        );
    }
}); 