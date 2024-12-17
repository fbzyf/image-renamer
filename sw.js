const CACHE_NAME = 'image-renamer-v1';

// 获取实际的基础路径
const getBasePath = () => {
    return new URL(self.registration.scope).pathname;
};

// 缓存文件列表
const getCacheFiles = (basePath) => [
    './',
    './index.html',
    './styles.css',
    './app.js',
    'https://unpkg.com/tesseract.js@v2.1.0/dist/tesseract.min.js'
];

// 安装事件
self.addEventListener('install', event => {
    event.waitUntil(
        (async () => {
            const basePath = getBasePath();
            const cache = await caches.open(CACHE_NAME);
            await cache.addAll(getCacheFiles(basePath));
            await self.skipWaiting();
        })()
    );
});

// 激活事件
self.addEventListener('activate', event => {
    event.waitUntil(
        (async () => {
            // 清理旧缓存
            const keys = await caches.keys();
            await Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
            await self.clients.claim();
        })()
    );
});

// 请求拦截
self.addEventListener('fetch', event => {
    // 只处理 GET 请求
    if (event.request.method !== 'GET') return;

    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            
            // 尝试从缓存获取
            const cachedResponse = await cache.match(event.request);
            if (cachedResponse) {
                return cachedResponse;
            }

            // 如果缓存中没有，���网络获取
            try {
                const response = await fetch(event.request);
                
                // 只缓存成功的响应
                if (response && response.status === 200) {
                    await cache.put(event.request, response.clone());
                }
                return response;
            } catch (error) {
                console.error('Fetch failed:', error);
                return new Response('Network error', {
                    status: 408,
                    headers: new Headers({
                        'Content-Type': 'text/plain'
                    })
                });
            }
        })()
    );
});
