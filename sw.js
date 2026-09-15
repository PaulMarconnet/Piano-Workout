const CACHE_NAME = 'piano-workout-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    'https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// Phase 1 : Installation et mise en cache initiale
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Phase 2 : Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
});

// Phase 3 : Interception des requêtes
self.addEventListener('fetch', (event) => {
    // Règle d'or : On ignore les appels à l'API FastAPI pour l'instant
    if (event.request.url.includes(':8000')) {
        return; 
    }

    // Stratégie "Cache First"
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});