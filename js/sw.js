/**
 * Service Worker pour Outils Pratiques
 * Permet l'utilisation hors ligne et améliore les performances
 */

// Nom du cache et ressources à mettre en cache
const CACHE_NAME = 'outils-pratiques-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/css/menu.css',
    '/css/theme-switch.css',
    '/css/tools/calculator.css',
    '/css/tools/color.css',
    '/css/tools/converter.css',
    '/css/tools/metronome.css',
    '/css/tools/notes.css',
    '/css/tools/scheduler.css',
    '/css/tools/stopwatch.css',
    '/css/tools/text.css',
    '/css/tools/timer.css',
    '/css/tools/translator.css',
    '/js/main.js',
    '/js/menu.js',
    '/js/theme.js',
    '/js/clock.js',
    '/js/notification.js',
    '/js/performance.js',
    '/js/cache.js',
    '/js/calculator-global.js',
    '/js/tools/calculator.js',
    '/js/tools/color.js',
    '/js/tools/converter.js',
    '/js/tools/metronome.js',
    '/js/tools/notes.js',
    '/js/tools/scheduler.js',
    '/js/tools/stopwatch.js',
    '/js/tools/text.js',
    '/js/tools/timer.js',
    '/js/tools/translator.js',
    '/icons/favicon.ico',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/manifest.json'
];

// Installation du service worker
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installation');
    
    // Mettre en cache les ressources essentielles
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Mise en cache des ressources');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activation');
    
    // Nettoyer les anciens caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Suppression de l\'ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
    // Stratégie Cache First, puis réseau
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Retourner la réponse du cache si elle existe
                if (response) {
                    return response;
                }
                
                // Sinon, faire la requête au réseau
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Ne pas mettre en cache les requêtes qui ne sont pas GET
                        if (event.request.method !== 'GET') {
                            return networkResponse;
                        }
                        
                        // Mettre en cache la nouvelle ressource
                        return caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, networkResponse.clone());
                                return networkResponse;
                            });
                    })
                    .catch((error) => {
                        console.log('[Service Worker] Erreur de récupération:', error);
                        
                        // Pour les requêtes de pages HTML, retourner une page hors ligne
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/offline.html');
                        }
                        
                        return new Response('Ressource non disponible hors ligne', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Gestion des messages
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
}); 