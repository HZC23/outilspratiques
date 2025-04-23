/**
 * Service Worker pour Outils Pratiques
 * Permet l'utilisation hors ligne et améliore les performances
 */

// Configuration du cache
const CONFIG = {
    CACHE_STATIC_NAME: 'outils-pratiques-static-v2',
    CACHE_DYNAMIC_NAME: 'outils-pratiques-dynamic-v2',
    CACHE_IMMUTABLE_NAME: 'outils-pratiques-immutable-v2',
    MAX_DYNAMIC_CACHE_ITEMS: 50,
    OFFLINE_PAGE: '/offline.html',
    ROUTES_CACHE_STRATEGY: {
        // Ressources statiques à mettre en cache immédiatement et mettre à jour en arrière-plan (Cache First, puis mise à jour)
        STATIC: [
            '/',
            '/index.html',
            '/outils.html',
            '/manifest.json',
            '/styles/variables.css',
            '/styles/main.css',
            '/styles/menu.css',
            '/styles/tools-cards.css',
            '/styles/home.css',
            '/styles/notification.css',
            '/styles/theme-switch.css',
            '/js/main.js',
            '/js/menu.js',
            '/js/theme.js',
            '/js/utils.js',
            '/js/config.js',
            '/js/clock.js',
            '/js/cache.js',
            '/js/sw.js',
            '/js/script.js',
            '/js/tools/todo.js'
        ],
        // Ressources immuables jamais mises à jour (Cache Only après mise en cache initiale, expiration longue)
        IMMUTABLE: [
            '/icons/favicon.ico',
            '/icons/icon-144x144.png',
            '/icons/icon-192x192.png',
            '/icons/icon-512x512.png',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css',
            'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
        ],
        // Ressources à pré-charger mais qui pourraient être mises à jour fréquemment
        DYNAMIC: [
            '/js/tools',
            '/tools',
            '/styles/components'
        ],
        // Routes qui nécessitent des données fraîches (Network First puis fallback cache)
        NETWORK_FIRST: [
            '/api/'
        ]
    }
};

// Installation du Service Worker
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installation en cours...');
    
    // Mise en cache des ressources statiques et immuables
    event.waitUntil(
        Promise.all([
            // Mise en cache des ressources statiques
            caches.open(CONFIG.CACHE_STATIC_NAME).then(cache => {
                console.log('[Service Worker] Mise en cache des ressources statiques');
                return cache.addAll(CONFIG.ROUTES_CACHE_STRATEGY.STATIC);
            }),
            
            // Mise en cache des ressources immuables
            caches.open(CONFIG.CACHE_IMMUTABLE_NAME).then(cache => {
                console.log('[Service Worker] Mise en cache des ressources immuables');
                return cache.addAll(CONFIG.ROUTES_CACHE_STRATEGY.IMMUTABLE);
            }),
            
            // Création du cache dynamique
            caches.open(CONFIG.CACHE_DYNAMIC_NAME).then(cache => {
                console.log('[Service Worker] Cache dynamique créé');
                // Pré-chargement de certaines ressources dynamiques
                const dynamicPreloadUrls = [];
                CONFIG.ROUTES_CACHE_STRATEGY.DYNAMIC.forEach(pattern => {
                    if (pattern === '/tools') {
                        // Précharger les principaux outils
                        dynamicPreloadUrls.push(
                            '/tools/calculator.html', 
                            '/tools/todo.html',
                            '/tools/timer.html'
                        );
                    }
                });
                return cache.addAll(dynamicPreloadUrls);
            })
        ]).then(() => self.skipWaiting())
    );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activation');
    
    // Nettoyage des anciens caches
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    const isStaticCache = cacheName.startsWith('outils-pratiques-static-') && 
                                        cacheName !== CONFIG.CACHE_STATIC_NAME;
                    const isDynamicCache = cacheName.startsWith('outils-pratiques-dynamic-') && 
                                        cacheName !== CONFIG.CACHE_DYNAMIC_NAME;
                    const isImmutableCache = cacheName.startsWith('outils-pratiques-immutable-') && 
                                           cacheName !== CONFIG.CACHE_IMMUTABLE_NAME;
                    
                    if (isStaticCache || isDynamicCache || isImmutableCache) {
                        console.log('[Service Worker] Suppression de l\'ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                    return Promise.resolve();
                })
            );
        }).then(() => {
            console.log('[Service Worker] Revendication des clients');
            return self.clients.claim();
        })
    );
});

// Fetch event - Intercepte les requêtes réseau 
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Ne pas intercepter les requêtes non-GET ou cross-origin (API externes)
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Stratégie Cache First avec mise à jour en arrière-plan pour les ressources statiques
    if (isMatchingPattern(url.pathname, CONFIG.ROUTES_CACHE_STRATEGY.STATIC)) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    // Retourner le cache si disponible
                    const fetchPromise = fetch(event.request)
                        .then(networkResponse => {
                            // Mettre à jour le cache avec la nouvelle version
                            caches.open(CONFIG.CACHE_STATIC_NAME)
                                .then(cache => cache.put(event.request, networkResponse.clone()));
                            return networkResponse.clone();
                        })
                        .catch(error => {
                            console.log('[SW] Erreur réseau pour', url.pathname, error);
                            // Aucune action spéciale ici, on utilise juste le cache
                        });
                    
                    // Retourner la réponse du cache si disponible, sinon attendre la réponse réseau
                    return response || fetchPromise;
                })
        );
        return;
    }
    
    // Stratégie Cache Only pour les ressources immuables
    if (isMatchingPattern(url.pathname, CONFIG.ROUTES_CACHE_STRATEGY.IMMUTABLE)) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    
                    // Si non trouvé dans le cache, le récupérer et le mettre en cache
                    return fetch(event.request)
                        .then(networkResponse => {
                            const responseToCache = networkResponse.clone();
                            caches.open(CONFIG.CACHE_IMMUTABLE_NAME)
                                .then(cache => cache.put(event.request, responseToCache));
                            return networkResponse;
                        });
                })
        );
        return;
    }
    
    // Stratégie Network First pour les API et données dynamiques
    if (isMatchingPattern(url.pathname, CONFIG.ROUTES_CACHE_STRATEGY.NETWORK_FIRST)) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cloner la réponse pour le cache
                    const responseToCache = response.clone();
                    
                    // Mettre en cache la réponse frâiche
                    caches.open(CONFIG.CACHE_DYNAMIC_NAME)
                        .then(cache => cache.put(event.request, responseToCache))
                        .catch(err => console.log('[SW] Erreur de mise en cache', err));
                    
                    return response;
                })
                .catch(() => {
                    // En cas d'échec, essayer de récupérer depuis le cache
                    return caches.match(event.request)
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            
                            // Retourner une erreur si aucune donnée n'est disponible
                            return new Response(
                                JSON.stringify({ error: 'La ressource n\'est pas disponible hors ligne' }), 
                                { headers: { 'Content-Type': 'application/json' } }
                            );
                        });
                })
        );
        return;
    }
    
    // Stratégie par défaut : Stale While Revalidate pour les ressources dynamiques
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Retourner immédiatement la version mise en cache si elle existe
                const fetchPromise = fetch(event.request)
                    .then(networkResponse => {
                        // Mettre à jour le cache avec la nouvelle version
                        caches.open(CONFIG.CACHE_DYNAMIC_NAME)
                            .then(cache => {
                                cache.put(event.request, networkResponse.clone());
                                
                                // Limiter la taille du cache dynamique
                                trimCache(CONFIG.CACHE_DYNAMIC_NAME, CONFIG.MAX_DYNAMIC_CACHE_ITEMS);
                            });
                        return networkResponse;
                    })
                    .catch(error => {
                        console.log('[SW] Erreur réseau', error);
                        
                        // Si c'est une page HTML, retourner la page hors ligne
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match(CONFIG.OFFLINE_PAGE);
                        }
                        
                        // Pour les autres types de ressources, retourner une réponse d'erreur adaptée
                        return createErrorResponse(event.request);
                    });
                
                return cachedResponse || fetchPromise;
            })
    );
});

// Événement Sync pour les opérations en arrière-plan
self.addEventListener('sync', event => {
    console.log('[Service Worker] Sync event', event.tag);
    
    if (event.tag === 'sync-todo-data') {
        event.waitUntil(syncTodoData());
    }
});

// Événement Push pour les notifications
self.addEventListener('push', event => {
    console.log('[Service Worker] Push event', event);
    
    let notification = {
        title: 'Outils Pratiques',
        body: 'Nouvelle notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-144x144.png',
        data: {
            url: '/'
        }
    };
    
    if (event.data) {
        try {
            notification = Object.assign(notification, JSON.parse(event.data.text()));
        } catch (error) {
            console.log('[SW] Erreur de parsing des données push', error);
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(notification.title, {
            body: notification.body,
            icon: notification.icon,
            badge: notification.badge,
            data: notification.data
        })
    );
});

// Événement de clic sur notification
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    const urlToOpen = event.notification.data && event.notification.data.url ? 
        new URL(event.notification.data.url, self.location.origin).href : 
        self.location.origin;
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then(clientList => {
            for (let client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Fonction utilitaire pour vérifier si un chemin correspond à un modèle
function isMatchingPattern(pathname, patterns) {
    return patterns.some(pattern => {
        // Conversion des patterns en expressions régulières si nécessaire
        if (pattern.includes('*')) {
            const regexPattern = new RegExp(pattern.replace(/\*/g, '.*'));
            return regexPattern.test(pathname);
        }
        return pathname.startsWith(pattern) || pathname === pattern;
    });
}

// Fonction utilitaire pour limiter la taille du cache
function trimCache(cacheName, maxItems) {
    caches.open(cacheName)
        .then(cache => {
            cache.keys()
                .then(keys => {
                    if (keys.length > maxItems) {
                        // Supprimer les entrées les plus anciennes (FIFO)
                        cache.delete(keys[0])
                            .then(() => trimCache(cacheName, maxItems));
                    }
                });
        });
}

// Fonction utilitaire pour créer une réponse d'erreur adaptée au type de contenu demandé
function createErrorResponse(request) {
    const accept = request.headers.get('accept');
    
    if (accept && accept.includes('image')) {
        // Réponse d'erreur pour les images
        return new Response(
            null,
            { 
                status: 503, 
                statusText: 'Service Unavailable',
                headers: new Headers({ 'Content-Type': 'image/svg+xml' })
            }
        );
    } else if (accept && accept.includes('application/json')) {
        // Réponse d'erreur pour les API
        return new Response(
            JSON.stringify({ error: 'Ressource non disponible hors ligne' }),
            { 
                status: 503, 
                statusText: 'Service Unavailable',
                headers: new Headers({ 'Content-Type': 'application/json' })
            }
        );
    } else {
        // Réponse d'erreur par défaut
        return new Response(
            'Contenu non disponible hors ligne',
            { 
                status: 503, 
                statusText: 'Service Unavailable',
                headers: new Headers({ 'Content-Type': 'text/plain' })
            }
        );
    }
}

// Fonction pour synchroniser les données des tâches (todo)
async function syncTodoData() {
    // Cette fonction serait implémentée si un backend existait
    console.log('[Service Worker] Synchronisation des données de tâches');
    return Promise.resolve();
} 