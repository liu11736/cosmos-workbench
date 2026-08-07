/**
 * Service Worker - 离线缓存 + PWA 支持
 *
 * 策略（v4）：
 * - CSS/JS/HTML：网络优先（Network First），在线时始终拿最新版本，离线回退缓存
 * - 图片/图标：缓存优先（Cache First），减少重复下载
 * - 动态数据：网络优先，离线回退缓存
 *
 * 注意：v1/v2 使用缓存优先策略导致手机端更新无法生效，
 * v3 起改为网络优先，确保所有设备都能拿到最新代码。
 * v4：汉堡按钮移入正式头部栏，不再悬浮遮挡内容。
 * v5：宠物图标改为单个，准备部署上线。
 */

const CACHE_VERSION = 'v5';
const CACHE_NAME = `cosmos-workbench-${CACHE_VERSION}`;
const STATIC_CACHE = `cosmos-static-${CACHE_VERSION}`;

// 需要预缓存的静态资源
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/daily.css',
  './css/english.css',
  './css/pets.css',
  './css/modules.css',
  './js/storage.js',
  './js/sync.js',
  './js/data_manager.js',
  './js/data.js',
  './js/cet4_extra.js',
  './js/daily.js',
  './js/english.js',
  './js/pets.js',
  './js/inspiration.js',
  './js/viral.js',
  './js/recipe.js',
  './js/news.js',
  './js/finance.js',
  './js/fund.js',
  './js/auto_update.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 安装时预缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] 预缓存静态资源');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 激活时清理所有旧版本缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => !name.includes(CACHE_VERSION))
          .map(name => {
            console.log('[SW] 删除旧缓存:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] 激活完成, 版本:', CACHE_VERSION);
      return self.clients.claim();
    })
  );
});

// 请求拦截
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // 只处理 GET 请求
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // CSS/JS 文件：网络优先，确保始终拿到最新代码
  if (url.pathname.match(/\.(css|js)$/)) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(request).then(cached => cached || new Response('', { status: 503 }));
      })
    );
    return;
  }

  // HTML 页面：网络优先，离线回退缓存
  if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      }).catch(() => {
        return caches.match(request).then(cached => cached || caches.match('./index.html'));
      })
    );
    return;
  }

  // 图片/图标/manifest：缓存优先，减少重复下载
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webmanifest|json)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        }).catch(() => cachedResponse || new Response('', { status: 503 }));
      })
    );
    return;
  }

  // 其他请求：网络优先，离线回退缓存
  event.respondWith(
    fetch(request).then((response) => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
      return response;
    }).catch(() => caches.match(request))
  );
});

// 接收来自页面的消息
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
