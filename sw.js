const CACHE_NAME = 'outils-pratiques-v1';
const ASSETS_TO_CACHE = [
const CACHE_NAME = 'outils-pratiques-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/js/main.js',
    '/js/config.js',
    '/js/utils.js',
    '/js/theme.js',
    '/js/navigation.js',
    '/js/clock.js',
    '/js/main.js',
    '/js/config.js',
    '/js/utils.js',
    '/js/theme.js',
    '/js/navigation.js',
    '/js/clock.js',
    '/icons/favicon.ico',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css'
];

/*
 Copyright 2014 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

// This polyfill provides Cache.add(), Cache.addAll(), and CacheStorage.match(),
// which are not implemented in Chrome 40.
importScripts('js/dependencies/cache-polyfill.js');

// While overkill for this specific sample in which there is only one cache,
// this is one best practice that can be followed in general to keep track of
// multiple caches used by a given service worker, and keep them all versioned.
// It maps a shorthand identifier for a cache to a specific, versioned cache name.

// Note that since global state is discarded in between service worker restarts, these
// variables will be reinitialized each time the service worker handles an event, and you
// should not attempt to change their values inside an event handler. (Treat them as constants.)

// If at any point you want to force pages that use this service worker to start using a fresh
// cache, then increment the CACHE_VERSION value. It will kick off the service worker update
// flow and the old cache(s) will be purged as part of the activate event handler when the
// updated service worker is activated.

var urlsToPrefetch = [
  '/',
  '/page',
  '/styles/common.css',
  '/js/dependencies/autolinker.js',
  '/template.js',
  '/images/icon.png',
  '/images/icon.svg',
];

var version = '1.0.0'
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css'
];

/*
 Copyright 2014 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

// This polyfill provides Cache.add(), Cache.addAll(), and CacheStorage.match(),
// which are not implemented in Chrome 40.
importScripts('js/dependencies/cache-polyfill.js');

// While overkill for this specific sample in which there is only one cache,
// this is one best practice that can be followed in general to keep track of
// multiple caches used by a given service worker, and keep them all versioned.
// It maps a shorthand identifier for a cache to a specific, versioned cache name.

// Note that since global state is discarded in between service worker restarts, these
// variables will be reinitialized each time the service worker handles an event, and you
// should not attempt to change their values inside an event handler. (Treat them as constants.)

// If at any point you want to force pages that use this service worker to start using a fresh
// cache, then increment the CACHE_VERSION value. It will kick off the service worker update
// flow and the old cache(s) will be purged as part of the activate event handler when the
// updated service worker is activated.

var urlsToPrefetch = [
  '/',
  '/page',
  '/styles/common.css',
  '/js/dependencies/autolinker.js',
  '/template.js',
  '/images/icon.png',
  '/images/icon.svg',
];

var version = '1.0.0'

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache ouvert');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((error) => {
                console.error('Erreur lors du cache des ressources :', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
// Activation du Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Suppression de l\'ancien cache :', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Suppression de l\'ancien cache :', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
// Interception des requêtes
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - retourner la réponse du cache
                if (response) {
                    return response;
                }

                // Cloner la requête
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest)
                    .then((response) => {
                        // Vérifier si la réponse est valide
                        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

                        // Cloner la réponse
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Retourner une page d'erreur hors ligne si disponible
                        return caches.match('/offline.html');
                    });
            })
    );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
self.addEventListener('push', (event) => {
    const options = {
        body: event.data.text(),
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
        }
    };

    event.waitUntil(
        self.registration.showNotification('Outils Pratiques', options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

  event.waitUntil(
        clients.openWindow('/')
    );
});

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(
            // Synchroniser les données
            syncData()
            // Synchroniser les données
            syncData()
        );
    }
});

// Fonction de synchronisation des données
async function syncData() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const requests = await cache.keys();
        
        // Synchroniser chaque requête
        await Promise.all(
            requests.map(async (request) => {
                try {
                    const response = await fetch(request);
                    await cache.put(request, response);
                } catch (error) {
                    console.error('Erreur de synchronisation :', error);
                }
            })
        );
    } catch (error) {
        console.error('Erreur lors de la synchronisation :', error);
    }
}

// Fonction de synchronisation des données
async function syncData() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const requests = await cache.keys();
        
        // Synchroniser chaque requête
        await Promise.all(
            requests.map(async (request) => {
                try {
                    const response = await fetch(request);
                    await cache.put(request, response);
                } catch (error) {
                    console.error('Erreur de synchronisation :', error);
                }
            })
        );
    } catch (error) {
        console.error('Erreur lors de la synchronisation :', error);
    }
}

self.addEventListener('sync', event => {
    if (event.tag === 'sync-notes') {
        event.waitUntil(
            syncNotes()
        );
    }
});

// Fonction pour synchroniser les notes
async function syncNotes() {
    try {
        const response = await fetch('/api/sync-notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                notes: await getNotes()
            })
        });

        if (!response.ok) {
            throw new Error('Sync failed');
        }

        // Notifier l'utilisateur
        self.registration.showNotification('Synchronisation réussie', {
            body: 'Vos notes ont été synchronisées avec succès',
            icon: '/icons/icon-192x192.png'
        });
    } catch (error) {
        console.error('Sync failed:', error);
    }
}

// Fonction pour récupérer les notes du stockage local
async function getNotes() {
    const db = await openDB();
    return db.getAll('notes');
}

// Fonction pour ouvrir la base de données IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('NotesDB', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('notes')) {
                db.createObjectStore('notes', { keyPath: 'id' });
            }
        };
    });
} 