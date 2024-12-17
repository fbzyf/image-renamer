const CACHE_NAME = 'image-renamer-v1';
const CACHE_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/config.js',
    'https://unpkg.com/tesseract.js@v2.1.0/dist/tesseract.min.js',
    'https://unpkg.com/tesseract.js@v2.1.0/dist/worker.min.js',
    'https://unpkg.com/tesseract.js@v2.1.0/dist/tesseract-core.wasm.js'
];

// 缓存版本管理
const VERSION = '1.0.0';

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(CACHE_FILES);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    // 立即接管所有页面
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // 清理旧缓存
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

self.addEventListener('fetch', event => {
    // 只处理 GET 请求
    if (event.request.method !== 'GET') {
        return;
    }

    // 排除 API 请求
    if (event.request.url.includes('api.deepseek.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }

                // 克隆请求
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest)
                    .then(response => {
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        // 克隆响应
                        const responseToCache = response.clone();

                        // 异步缓存
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            })
                            .catch(err => {
                                console.warn('缓存失败:', err);
                            });

                        return response;
                    })
                    .catch(() => {
                        // 离线时返回友好提示
                        if (event.request.mode === 'navigate') {
                            return new Response('离线模式不可用，请检查网络连接', {
                                status: 503,
                                statusText: 'Service Unavailable',
                                headers: new Headers({
                                    'Content-Type': 'text/plain;charset=utf-8'
                                })
                            });
                        }
                    });
            })
    );
});