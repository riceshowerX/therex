/// <reference lib="webworker" />

const CACHE_NAME = 'markflow-v1.0.0';
const STATIC_CACHE_NAME = 'markflow-static-v1.0.0';

// 静态资源列表
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// 安装事件
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  (self as unknown as ServiceWorkerGlobalScope).skipWaiting();
});

// 激活事件
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  (self as unknown as ServiceWorkerGlobalScope).clients.claim();
});

// 请求拦截
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只缓存同源请求
  if (url.origin !== location.origin) {
    return;
  }

  // API 请求使用网络优先策略
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 静态资源使用缓存优先策略
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 其他请求使用网络优先策略
  event.respondWith(networkFirst(request));
});

// 缓存优先策略
async function cacheFirst(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

// 网络优先策略
async function networkFirst(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline', { status: 503 });
  }
}

// 判断是否为静态资源
function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/icons/') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2')
  );
}

// 监听消息
self.addEventListener('message', (event: MessageEvent) => {
  if (event.data === 'skipWaiting') {
    (self as unknown as ServiceWorkerGlobalScope).skipWaiting();
  }
});

export {};
