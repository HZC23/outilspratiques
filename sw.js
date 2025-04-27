const CACHE_VERSION = '2';
const CACHE_NAME = `outils-pratiques-v${CACHE_VERSION}`;
const OFFLINE_PAGE = 'offline.html';

// Séparation des ressources par priorité
const CORE_ASSETS = [
    './',
    'index.html',
    'offline.html',
    '404.html',
    'styles.css',
    'js/main.js',
    'js/config.js',
    'js/utils.js',
    'js/theme.js',
    'js/navigation.js',
    'icons/favicon.ico',
    'icons/icon-192x192.png'
];

const SECONDARY_ASSETS = [
    './js/clock.js',
    './icons/icon-512x512.png',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css',
    './styles/menu.css',
    './styles/components/theme-switch.css',
    './styles/components/notification.css',
    './styles/tools/color.css',
    './styles/tools/calculator.css',
    './styles/tools/unit.css',
    './styles/components/text.css',
    './styles/tools/timer.css',
    './styles/tools/stopwatch.css',
    './styles/tools/notes.css',
    './styles/tools/translator.css',
    './styles/tools/scheduler.css',
    './styles/tools/metronome.css',
    './styles/tools/qrcode.css',
    './js/tools/color.js',
    './js/tools/calculator.js',
    './js/tools/unit.js',
    './js/tools/text.js',
    './js/tools/timer.js',
    './js/tools/stopwatch.js',
    './js/tools/notes.js',
    './js/tools/translator.js',
    './js/tools/scheduler.js',
    './js/tools/metronome.js',
    './js/tools/password.js',
    './js/tools/qrcode.js'
];

// Combiner toutes les ressources à mettre en cache
const ASSETS_TO_CACHE = [...CORE_ASSETS, ...SECONDARY_ASSETS];

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

// Version de l'application
const APP_VERSION = '1.0.0';

// Installation du Service Worker avec priorité des ressources
self.addEventListener('install', (event) => {
    event.waitUntil(
        // Préchargement des ressources critiques en premier
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                console.log('Cache ouvert');
                // D'abord, mettre en cache les ressources essentielles
                await cache.addAll(CORE_ASSETS).catch(error => {
                    console.error('Erreur lors du cache des ressources critiques:', error);
                    throw error; // Si les ressources critiques ne peuvent pas être mises en cache, échouer
                });
                
                // Ensuite, mettre en cache les ressources secondaires
                return cache.addAll(SECONDARY_ASSETS).catch(error => {
                    console.error('Erreur lors du cache des ressources secondaires:', error);
                    // Ne pas échouer si les ressources secondaires ne peuvent pas être mises en cache
                });
            })
            .then(() => {
                // Activer immédiatement sans attendre que les onglets existants soient fermés
                return self.skipWaiting();
            })
    );
});

// Activation du Service Worker avec nettoyage des anciens caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName.startsWith('outils-pratiques-') && cacheName !== CACHE_NAME) {
                        console.log('Suppression de l\'ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            // Réclamer le contrôle de tous les clients sans attendre le rafraîchissement
            return self.clients.claim();
        })
    );
});

// Interception des requêtes avec stratégie "stale-while-revalidate"
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes non GET
    if (event.request.method !== 'GET') return;

    // Ignorer les requêtes vers d'autres domaines (sauf les CDNs whitelistés)
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin && 
        !event.request.url.includes('fonts.googleapis.com') && 
        !event.request.url.includes('cdnjs.cloudflare.com')) {
        return;
    }

    // Stratégie différente selon le type de ressource
    if (CORE_ASSETS.some(asset => event.request.url.endsWith(asset))) {
        // Pour les ressources essentielles: Cache-First
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        // Mettre à jour le cache en arrière-plan
                        const fetchPromise = fetch(event.request).then(networkResponse => {
                            if (networkResponse && networkResponse.status === 200) {
                                const cacheCopy = networkResponse.clone();
                                caches.open(CACHE_NAME).then(cache => {
                                    cache.put(event.request, cacheCopy);
                                });
                            }
                            return networkResponse;
                        }).catch(() => {
                            // Ignorer les erreurs de mise à jour du cache
                        });
                        
                        // Retourner la réponse du cache immédiatement
                        return cachedResponse;
                    }
                    
                    // Si pas en cache, essayer le réseau
                    return fetch(event.request)
                        .then(response => {
                            // Mettre en cache la nouvelle réponse
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                            return response;
                        })
                        .catch(() => {
                            // Si c'est une page HTML, retourner la page hors ligne
                            if (event.request.headers.get('Accept').includes('text/html')) {
                                return caches.match(OFFLINE_PAGE);
                            }
                            
                            // Sinon, échouer normalement
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
    } else {
        // Pour les autres ressources: Stale-While-Revalidate
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    // Créer une promesse pour le réseau
                    const fetchPromise = fetch(event.request)
                        .then(networkResponse => {
                            // Mettre à jour le cache avec la nouvelle réponse
                            if (networkResponse && networkResponse.status === 200) {
                                const cacheCopy = networkResponse.clone();
                                caches.open(CACHE_NAME).then(cache => {
                                    cache.put(event.request, cacheCopy);
                                });
                            }
                            return networkResponse;
                        })
                        .catch(error => {
                            console.error('Échec de récupération depuis le réseau:', error);
                            // Si le réseau échoue, ne pas propager l'erreur si on a une réponse du cache
                            if (cachedResponse) return null;
                            throw error;
                        });
                    
                    // Retourner la réponse du cache si disponible, sinon attendre le réseau
                    return cachedResponse || fetchPromise;
                })
                .catch(() => {
                    // Si c'est une page HTML, retourner la page hors ligne
                    if (event.request.headers.get('Accept')?.includes('text/html')) {
                        return caches.match(OFFLINE_PAGE);
                    }
                    
                    // Sinon, échouer normalement
                    return new Response('Ressource non disponible hors ligne', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: new Headers({
                            'Content-Type': 'text/plain'
                        })
                    });
                })
        );
    }
});

// Gestion des notifications push
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
    };

    event.waitUntil(
        self.registration.showNotification('Outils Pratiques', options)
    );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});

// Synchronisation en arrière-plan avec limitation de fréquence
let syncInProgress = false;
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data' && !syncInProgress) {
        syncInProgress = true;
        event.waitUntil(
            syncData()
                .catch(error => console.error('Erreur de synchronisation:', error))
                .finally(() => {
                    syncInProgress = false;
                })
        );
    }
});

// Fonction de synchronisation des données avec gestion des erreurs améliorée
async function syncData() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const requests = await cache.keys();
        
        // Limite le nombre de requêtes synchronisées simultanément
        const BATCH_SIZE = 5;
        const batches = [];
        
        for (let i = 0; i < requests.length; i += BATCH_SIZE) {
            batches.push(requests.slice(i, i + BATCH_SIZE));
        }
        
        // Traiter chaque lot séquentiellement
        for (const batch of batches) {
            await Promise.all(
                batch.map(async (request) => {
                    try {
                        // Ne pas synchroniser les ressources externes
                        const url = new URL(request.url);
                        if (url.origin !== self.location.origin) {
                            return;
                        }
                        
                        // Ajouter un timeout pour éviter les requêtes bloquées
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 10000);
                        
                        const response = await fetch(request, { 
                            signal: controller.signal 
                        });
                        
                        clearTimeout(timeoutId);
                        
                        if (response.ok) {
                            await cache.put(request, response);
                        }
                    } catch (error) {
                        if (error.name === 'AbortError') {
                            console.warn('Requête de synchronisation interrompue après délai:', request.url);
                        } else {
                            console.error('Erreur lors de la synchronisation de', request.url, ':', error);
                        }
                    }
                })
            );
            
            // Pause entre les lots pour éviter de surcharger le réseau
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        await syncNotes();
        console.log('Synchronisation terminée');
        
        // Notification de synchronisation réussie
        if (self.registration.showNotification) {
            await self.registration.showNotification('Outils Pratiques', {
                body: 'Synchronisation réussie',
                icon: '/icons/icon-192x192.png',
                tag: 'sync-success'
            });
        }
    } catch (error) {
        console.error('Erreur lors de la synchronisation:', error);
    }
}

// Fonction de synchronisation des notes
async function syncNotes() {
    try {
        const notes = await getNotes();
        if (!notes || notes.length === 0) {
            console.log('Aucune note à synchroniser');
            return;
        }
        
        // Ajouter un timeout pour éviter les requêtes bloquées
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notes),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            console.log('Notes synchronisées avec succès');
        } else {
            console.error('Erreur lors de la synchronisation des notes:', response.status, response.statusText);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn('Synchronisation des notes interrompue après délai');
        } else {
            console.error('Erreur lors de la synchronisation des notes:', error);
        }
    }
}

// Fonction pour récupérer les notes avec timeout
function getNotes() {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('Timeout lors de la récupération des notes'));
        }, 5000);
        
        const request = indexedDB.open('outilsPratiques', 1);
        
        request.onerror = (event) => {
            clearTimeout(timeoutId);
            reject('Erreur lors de l\'ouverture de la base de données: ' + event.target.error);
        };
        
        request.onsuccess = (event) => {
            try {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('notes')) {
                    clearTimeout(timeoutId);
                    resolve([]);
                    return;
                }
                
                const transaction = db.transaction(['notes'], 'readonly');
                const objectStore = transaction.objectStore('notes');
                const getRequest = objectStore.getAll();
                
                getRequest.onsuccess = () => {
                    clearTimeout(timeoutId);
                    resolve(getRequest.result);
                };
                
                getRequest.onerror = (error) => {
                    clearTimeout(timeoutId);
                    reject(error);
                };
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('notes')) {
                db.createObjectStore('notes', { keyPath: 'id' });
            }
        };
    });
} 