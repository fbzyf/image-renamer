const CACHE_NAME = 'image-renamer-v1';
const BASE_URL = '/image-renamer';
const CACHE_FILES = [
    BASE_URL + '/',
    BASE_URL + '/index.html',
    BASE_URL + '/styles.css',
    BASE_URL + '/app.js',
    'https://unpkg.com/tesseract.js@v2.1.0/dist/tesseract.min.js'
];

self.addEventListener('install', event => {
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
    if (event.request.method !== 'GET') return;
    
    const url = new URL(event.request.url);
    if (url.origin === self.location.origin) {
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
        );
    }
});