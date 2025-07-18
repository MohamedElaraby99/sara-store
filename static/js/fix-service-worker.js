/**
 * إصلاح Service Worker - منع التوجيه لصفحة الأوفلاين عند الوصول لصفحات المرتجعات
 */
class ServiceWorkerFix {
  constructor() {
    this.isFixed = false;
  }

  async applyFix() {
    if (this.isFixed) return;

    try {
      console.log("🔧 Applying Service Worker fix...");

      // إعادة تسجيل Service Worker
      if ("serviceWorker" in navigator) {
        // إلغاء تسجيل Service Worker الحالي
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
          console.log("🗑️ Old service worker unregistered");
        }

        // مسح جميع التخزين المؤقت
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
        console.log("🗑️ All caches cleared");

        // إعادة تسجيل Service Worker الجديد
        await navigator.serviceWorker.register("/static/js/service-worker.js");
        console.log("✅ New service worker registered");

        // إعادة تحميل الصفحة
        setTimeout(() => {
          console.log("🔄 Reloading page to apply fixes...");
          window.location.reload();
        }, 2000);
      }

      this.isFixed = true;
    } catch (error) {
      console.error("❌ Error applying service worker fix:", error);
    }
  }

  // فحص حالة Service Worker
  async checkStatus() {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      const cacheNames = await caches.keys();

      return {
        registered: !!registration,
        cacheCount: cacheNames.length,
        cacheNames: cacheNames,
      };
    }
    return { registered: false, cacheCount: 0, cacheNames: [] };
  }
}

// إضافة للكائن العام
window.serviceWorkerFix = new ServiceWorkerFix();

// تطبيق الإصلاح تلقائياً إذا كانت الصفحة تحتوي على "returns"
if (window.location.pathname.includes("returns")) {
  console.log("🚨 Returns page detected - applying service worker fix...");
  window.serviceWorkerFix.applyFix();
}
