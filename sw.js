const CACHE_NAME = 'image-renamer-v1';

self.addEventListener('install', event => {
    const basePath = new URL(self.registration.scope).pathname;
    const CACHE_FILES = [
        basePath,
        basePath + 'index.html',
        basePath + 'styles.css',
        basePath + 'app.js',
        'https://unpkg.com/tesseract.js@v2.1.0/dist/tesseract.min.js'
    ];

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CACHE_FILES))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});