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
    `${BASE_PATH}/js/utils.js`,
    `${BASE_PATH}/js/config.js`,
    `${BASE_PATH}/js/clock.js`,
    `${BASE_PATH}/js/notification.js`,
    `${BASE_PATH}/js/navigation.js`,
    `${BASE_PATH}/js/cache.js`,
    `${BASE_PATH}/js/performance.js`,
    `${BASE_PATH}/js/script.js`,
    `${BASE_PATH}/js/sw.js`,
    // Outils
    `${BASE_PATH}/js/tools/calculator.js`,
    `${BASE_PATH}/js/tools/timer.js`,
    `${BASE_PATH}/js/tools/stopwatch.js`,
    `${BASE_PATH}/js/tools/notes.js`,
    `${BASE_PATH}/js/tools/todo.js`,
    `${BASE_PATH}/js/tools/translator.js`,
    `${BASE_PATH}/js/tools/color.js`,
    `${BASE_PATH}/js/tools/qrcode.js`,
    `${BASE_PATH}/js/tools/password.js`,
    `${BASE_PATH}/js/tools/styletext.js`,
    `${BASE_PATH}/js/tools/metronome.js`,
    `${BASE_PATH}/js/tools/currency.js`,
    `${BASE_PATH}/js/tools/unit.js`,
    // Pages d'outils
    `${BASE_PATH}/tools/calculator.html`,
    `${BASE_PATH}/tools/timer.html`,
    `${BASE_PATH}/tools/stopwatch.html`,
    `${BASE_PATH}/tools/note.html`,
    `${BASE_PATH}/tools/todo.html`,
    `${BASE_PATH}/tools/translator.html`,
    `${BASE_PATH}/tools/color.html`,
    `${BASE_PATH}/tools/qrcode.html`,
    `${BASE_PATH}/tools/password.html`,
    `${BASE_PATH}/tools/unit.html`,
    `${BASE_PATH}/tools/currency.html`,
    `${BASE_PATH}/tools/metronome.html`,
    `${BASE_PATH}/tools/percentage.html`,
    // Icônes
    `${BASE_PATH}/icons/favicon.ico`,
    `${BASE_PATH}/icons/icon-144x144.png`,
    `${BASE_PATH}/icons/icon-192x192.png`,
    `${BASE_PATH}/icons/icon-512x512.png`
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