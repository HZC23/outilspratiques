const CACHE_NAME = 'outilspratiques-v2';
const BASE_PATH = '/outilspratiques.github.io';

// Liste des ressources à mettre en cache
const RESOURCES_TO_CACHE = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/outils.html`,
    // Styles
    `${BASE_PATH}/styles/variables.css`,
    `${BASE_PATH}/styles/main.css`,
    `${BASE_PATH}/styles/menu.css`,
    `${BASE_PATH}/styles/tools-cards.css`,
    `${BASE_PATH}/styles/home.css`,
    `${BASE_PATH}/styles/notification.css`,
    `${BASE_PATH}/styles/theme-switch.css`,
    `${BASE_PATH}/styles/components/color.css`,
    `${BASE_PATH}/styles/components/calculator.css`,
    `${BASE_PATH}/styles/components/unit.css`,
    `${BASE_PATH}/styles/components/text.css`,
    `${BASE_PATH}/styles/components/styletext.css`,
    `${BASE_PATH}/styles/components/timer.css`,
    `${BASE_PATH}/styles/components/stopwatch.css`,
    `${BASE_PATH}/styles/components/notes.css`,
    `${BASE_PATH}/styles/components/translator.css`,
    `${BASE_PATH}/styles/components/scheduler.css`,
    `${BASE_PATH}/styles/components/metronome.css`,
    `${BASE_PATH}/styles/components/qrcode.css`,
    // Scripts principaux
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
    `${BASE_PATH}/icons/icon-1024x1024.png`
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

// Intercepter les requêtes réseau et répondre depuis le cache si disponible
self.addEventListener('fetch', (event) => {
    // Ne pas intercepter les requêtes vers d'autres domaines ou les appels d'API
    if (!event.request.url.startsWith(self.location.origin) || 
        event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Retourner du cache si trouvé
                if (response) {
                    return response;
                }

                // Sinon, faire la requête réseau
                return fetch(event.request)
                    .then(networkResponse => {
                        // Ne mettre en cache que les requêtes réussies
                        if (!networkResponse || networkResponse.status !== 200 || 
                            networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Mettre en cache la nouvelle ressource
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(() => {
                        // Renvoyer une page d'erreur hors ligne pour les requêtes HTML
                        if (event.request.headers.get('Accept').includes('text/html')) {
                            return caches.match('offline.html');
                        }
                        
                        // Pour les autres requêtes échouées, revenir à une ressource par défaut
                        if (event.request.url.endsWith('.jpg') || 
                            event.request.url.endsWith('.png') ||
                            event.request.url.endsWith('.svg')) {
                            return caches.match('images/offline-placeholder.png');
                        }
                        
                        return new Response('Connexion hors ligne', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Écouter les événements de synchronisation en arrière-plan
self.addEventListener('sync', event => {
    if (event.tag === 'sync-todo-data') {
        event.waitUntil(syncTodoData());
    }
});

// Fonction pour synchroniser les données de la liste de tâches
async function syncTodoData() {
    // Logique de synchronisation des tâches lorsque la connexion est rétablie
    console.log('Synchronisation des données de tâches en cours...');
    
    // Cette fonction serait implémentée si nous avions un backend pour la synchronisation
    return Promise.resolve();
} 