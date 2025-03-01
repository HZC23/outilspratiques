const CACHE_NAME = 'outils-pratiques-v2';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';
const OFFLINE_PAGE = '/offline.html';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/scripts.js',
    '/manifest.json',
    '/offline.html',
    '/icons/favicon.ico',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
];

// Installation du Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE)
                .then(cache => cache.addAll(STATIC_ASSETS)),
            caches.open(DYNAMIC_CACHE)
                .then(cache => cache.add(OFFLINE_PAGE))
        ])
        .then(() => self.skipWaiting())
    );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                        .map(name => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Stratégie de cache : Network First avec fallback sur le cache
self.addEventListener('fetch', event => {
    // Ignorer les requêtes non GET
    if (event.request.method !== 'GET') return;

    // Ignorer les requêtes vers l'API
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Mettre en cache la nouvelle ressource
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE)
                    .then(cache => cache.put(event.request, responseClone));
                return response;
            })
            .catch(() => {
                return caches.match(event.request)
                    .then(response => {
                        if (response) {
                            return response;
                        }
                        // Si la ressource n'est pas en cache et que c'est une page HTML
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match(OFFLINE_PAGE);
                        }
                        // Pour les autres ressources, retourner une réponse vide
                        return new Response('', {
                            status: 408,
                            statusText: 'Request timed out.'
                        });
                    });
            })
    );
});

// Gestion des notifications push
self.addEventListener('push', event => {
    const options = {
        body: event.data.text(),
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Voir plus',
                icon: '/icons/checkmark.png'
            },
            {
                action: 'close',
                title: 'Fermer',
                icon: '/icons/xmark.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Outils Pratiques', options)
    );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Synchronisation en arrière-plan
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