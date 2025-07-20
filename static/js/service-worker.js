const CACHE_NAME = "norko-store-v1.2.1";
const STATIC_CACHE = "norko-static-v1.2.1";
const API_CACHE = "norko-api-v1.2.1";

// قائمة الملفات المهمة للتخزين المؤقت
const STATIC_FILES = [
  "/",
  "/static/css/style.css",
  "/static/images/logo.png",
  "/static/js/db-manager.js",
  "/static/js/sync-manager.js",
  "/static/js/offline-handler.js",
  "/static/manifest.json",
  // Bootstrap و الخطوط والمكتبات الخارجية
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js",
  "https://cdn.jsdelivr.net/npm/chart.js",
  // الصفحات الرئيسية
  "/dashboard",
  "/offline.html",
  "/offline-demo",
  // صفحات المبيعات
  "/sales",
  "/sales/new",
  // صفحات المنتجات
  "/products",
  "/products/add",
  // صفحات العملاء
  "/customers",
  "/customers/add",
  // صفحات الفئات
  "/categories",
  "/categories/add",
  // صفحات المستخدمين
  "/users",
  "/users/add",
  // صفحات المصروفات
  "/expenses",
  "/expenses/add",
  // صفحات قائمة التسوق
  "/shopping-list",
  "/shopping-list/add",
  // صفحات المرتجعات
  "/returns",
  // صفحات أخرى
  "/reports",
  "/debts",
  "/stock/update",
  "/qr-generator",
  "/price-ticket",
];

// صفحات يجب استبعادها من التخزين المؤقت (صفحات المصادقة والمرتجعات)
const EXCLUDED_PAGES = [
  "/login",
  "/logout",
  "/forgot-password",
  "/reset-password",
  "/change-password",
  "/returns/new",
  "/api/returns",
];

// API endpoints للتخزين المؤقت
const API_URLS = [
  "/api/products",
  "/api/categories",
  "/api/customers",
  "/api/stock-status",
  "/api/offline-status",
  "/api/export/products",
  "/api/export/sales",
  "/api/search-products",
];

// تثبيت Service Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    Promise.all([
      // تخزين الملفات الثابتة
      caches.open(STATIC_CACHE).then((cache) => {
        console.log("Service Worker: Caching static files");
        return cache.addAll(STATIC_FILES);
      }),
      // تخزين بيانات API الأساسية
      caches.open(API_CACHE).then((cache) => {
        console.log("Service Worker: Pre-caching API data");
        return Promise.all(
          API_URLS.map((url) => {
            return fetch(url)
              .then((response) => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch((err) => {
                console.log(`Service Worker: Failed to cache ${url}:`, err);
              });
          })
        );
      }),
    ]).then(() => {
      console.log("Service Worker: Installation complete");
      return self.skipWaiting();
    })
  );
});

// تفعيل Service Worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE &&
              cacheName !== API_CACHE &&
              cacheName !== CACHE_NAME
            ) {
              console.log("Service Worker: Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Service Worker: Activation complete");
        return self.clients.claim();
      })
  );
});

// التعامل مع الطلبات
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل طلبات POST/PUT/DELETE (سيتم التعامل معها في Sync Manager)
  if (request.method !== "GET") {
    return;
  }

  // استبعاد صفحات المصادقة والمرتجعات من التخزين المؤقت
  if (isExcludedPage(url.pathname)) {
    console.log(
      "Service Worker: Excluded page - allowing network request:",
      url.pathname
    );
    // السماح بالطلب للشبكة مباشرة بدون تخزين مؤقت
    return;
  }

  // التعامل مع طلبات API
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // التعامل مع الملفات الثابتة والصفحات
  event.respondWith(handleStaticRequest(request));
});

// التحقق من كون الصفحة مستبعدة
function isExcludedPage(pathname) {
  // استبعاد صفحات المصادقة
  if (EXCLUDED_PAGES.includes(pathname)) {
    return true;
  }

  // استبعاد صفحات المرتجعات
  if (pathname.startsWith("/returns/new/")) {
    return true;
  }

  // استبعاد صفحات API المرتجعات
  if (pathname.startsWith("/api/returns")) {
    return true;
  }

  return false;
}

// معالجة طلبات API
async function handleApiRequest(request) {
  try {
    // محاولة الحصول على البيانات من الشبكة أولاً
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // حفظ النسخة الجديدة في التخزين المؤقت
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log("Service Worker: Network request failed, trying cache");
  }

  // في حالة فشل الشبكة، جرب التخزين المؤقت
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // إرسال استجابة offline للبيانات غير المتوفرة
  return new Response(
    JSON.stringify({
      error: "Offline",
      message: "البيانات غير متوفرة حالياً - يرجى المحاولة عند توفر الاتصال",
      offline: true,
    }),
    {
      status: 503,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    }
  );
}

// معالجة الطلبات الثابتة
async function handleStaticRequest(request) {
  try {
    // محاولة الحصول على المحتوى من الشبكة
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // حفظ في التخزين المؤقت إذا كان ملف ثابت
      if (isStaticAsset(request.url)) {
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }
  } catch (error) {
    console.log("Service Worker: Network failed, trying cache");
  }

  // البحث في التخزين المؤقت
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // إذا كانت صفحة HTML وغير متوفرة، أرسل صفحة offline فقط إذا لم تكن صفحة مصادقة
  if (request.headers.get("accept").includes("text/html")) {
    const url = new URL(request.url);
    if (!isExcludedPage(url.pathname)) {
      const offlineResponse = await caches.match("/offline.html");
      if (offlineResponse) {
        return offlineResponse;
      }
    }
  }

  // إرسال استجابة خطأ
  return new Response("المحتوى غير متوفر حالياً", {
    status: 503,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

// التحقق من كون الملف ثابت
function isStaticAsset(url) {
  return (
    url.includes("/static/") ||
    url.includes(".css") ||
    url.includes(".js") ||
    url.includes(".png") ||
    url.includes(".jpg") ||
    url.includes(".ico") ||
    url.includes("bootstrap") ||
    url.includes("cdn.jsdelivr.net")
  );
}

// معالجة مزامنة البيانات في الخلفية
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync triggered:", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(handleBackgroundSync());
  }
});

// معالجة المزامنة في الخلفية
async function handleBackgroundSync() {
  try {
    // إرسال رسالة للصفحة لتفعيل المزامنة
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: "BACKGROUND_SYNC",
        timestamp: Date.now(),
      });
    });
  } catch (error) {
    console.error("Service Worker: Background sync failed:", error);
  }
}

// معالجة الرسائل من الصفحة الرئيسية
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(clearAllCaches());
  }
});

// مسح جميع التخزين المؤقت
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
}
