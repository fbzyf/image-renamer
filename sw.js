const CACHE_NAME = 'image-renamer-v1';
const BASE_PATH = '/image-renamer';

const CACHE_FILES = [
    BASE_PATH + '/',
    BASE_PATH + '/index.html',
    BASE_PATH + '/styles.css',
    BASE_PATH + '/app.js',
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
    const url = new URL(event.request.url);
    // 只处理我们的应用路径
    if (url.pathname.startsWith(BASE_PATH)) {
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
        );
    }
});