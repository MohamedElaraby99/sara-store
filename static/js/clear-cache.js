/**
 * ملف إزالة الكاش الشامل من المتصفح
 * Comprehensive Browser Cache Clearing Script
 */

console.log("🧹 بدء عملية إزالة الكاش الشامل...");

// دالة إزالة جميع أنواع الكاش
async function clearAllCache() {
  try {
    console.log("🔄 جاري إزالة الكاش...");

    // تحديث شريط التقدم
    const progressText = document.getElementById("progress-text");
    const progressBar = document.getElementById("progress-bar");

    // 1. إزالة Service Worker
    if (progressText) progressText.textContent = "جاري إزالة Service Worker...";
    if (progressBar) progressBar.style.width = "10%";

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
        console.log("✅ تم إلغاء تسجيل Service Worker");
      }
    }

    // 2. مسح Cache Storage
    if (progressText) progressText.textContent = "جاري مسح Cache Storage...";
    if (progressBar) progressBar.style.width = "30%";

    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          console.log(`🗑️ حذف الكاش: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
      console.log("✅ تم مسح جميع Cache Storage");
    }

    // 3. مسح IndexedDB
    if (progressText) progressText.textContent = "جاري مسح IndexedDB...";
    if (progressBar) progressBar.style.width = "50%";

    if ("indexedDB" in window) {
      const databases = ["sarastoreStoreDB", "sarastore-store-db", "offline-store"];
      for (let dbName of databases) {
        try {
          await indexedDB.deleteDatabase(dbName);
          console.log(`🗑️ حذف قاعدة البيانات: ${dbName}`);
        } catch (e) {
          console.log(`⚠️ قاعدة البيانات ${dbName} غير موجودة`);
        }
      }
    }

    // 4. مسح localStorage و sessionStorage
    if (progressText) progressText.textContent = "جاري مسح التخزين المحلي...";
    if (progressBar) progressBar.style.width = "70%";

    try {
      localStorage.clear();
      console.log("✅ تم مسح localStorage");
    } catch (e) {
      console.log("⚠️ لا يمكن مسح localStorage");
    }

    try {
      sessionStorage.clear();
      console.log("✅ تم مسح sessionStorage");
    } catch (e) {
      console.log("⚠️ لا يمكن مسح sessionStorage");
    }

    // 5. إزالة مراجع المديرين
    if (progressText) progressText.textContent = "جاري إزالة المراجع...";
    if (progressBar) progressBar.style.width = "90%";

    window.dbManager = null;
    window.syncManager = null;
    window.offlineHandler = null;
    console.log("✅ تم إزالة مراجع المديرين");

    // 6. إزالة أي cookies خاصة بالتطبيق
    if (progressText) progressText.textContent = "جاري مسح Cookies...";
    if (progressBar) progressBar.style.width = "100%";

    document.cookie.split(";").forEach(function (c) {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    console.log("✅ تم مسح Cookies");

    console.log("🎉 تم إزالة جميع أنواع الكاش بنجاح!");

    // إرجاع نجاح العملية
    return { success: true, message: "تم إزالة جميع أنواع الكاش بنجاح!" };
  } catch (error) {
    console.error("❌ خطأ في إزالة الكاش:", error);
    throw new Error("حدث خطأ في إزالة الكاش: " + error.message);
  }
}

// دالة عرض الرسائل
function showMessage(message, type = "info") {
  // إنشاء عنصر الرسالة
  const messageDiv = document.createElement("div");
  messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

  // تحديد لون الرسالة حسب النوع
  switch (type) {
    case "success":
      messageDiv.style.backgroundColor = "#28a745";
      break;
    case "error":
      messageDiv.style.backgroundColor = "#dc3545";
      break;
    case "warning":
      messageDiv.style.backgroundColor = "#ffc107";
      messageDiv.style.color = "#000";
      break;
    default:
      messageDiv.style.backgroundColor = "#17a2b8";
  }

  messageDiv.textContent = message;
  document.body.appendChild(messageDiv);

  // إزالة الرسالة بعد 5 ثواني
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.parentNode.removeChild(messageDiv);
    }
  }, 5000);
}

// دالة فحص حالة الكاش
function checkCacheStatus() {
  let status = {
    serviceWorker: false,
    cacheStorage: false,
    indexedDB: false,
    localStorage: false,
    sessionStorage: false,
  };

  // فحص Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      status.serviceWorker = registrations.length > 0;
    });
  }

  // فحص Cache Storage
  if ("caches" in window) {
    caches.keys().then((keys) => {
      status.cacheStorage = keys.length > 0;
    });
  }

  // فحص IndexedDB
  if ("indexedDB" in window) {
    status.indexedDB = true;
  }

  // فحص localStorage
  try {
    status.localStorage = localStorage.length > 0;
  } catch (e) {
    status.localStorage = false;
  }

  // فحص sessionStorage
  try {
    status.sessionStorage = sessionStorage.length > 0;
  } catch (e) {
    status.sessionStorage = false;
  }

  return status;
}

// إضافة زر إزالة الكاش للصفحة (معطل حالياً لتجنب التداخل مع الأزرار في الهيدر)
function addClearCacheButton() {
  // تم تعطيل هذه الدالة لتجنب التداخل مع الأزرار في الهيدر
  return;
}

// تشغيل الدوال عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 تهيئة نظام إزالة الكاش...");

  // انتظار تهيئة نظام التحكم في الكاش
  setTimeout(() => {
    // فحص حالة الكاش في الخلفية
    const cacheStatus = checkCacheStatus();
    console.log("📊 حالة الكاش:", cacheStatus);

    // إذا كان هناك كاش وكان نظام التحكم مفعل، عرض تحذير خفيف
    if (
      Object.values(cacheStatus).some((status) => status) &&
      window.cacheControl &&
      window.cacheControl.settings.forceRefresh
    ) {
      console.log(
        "⚠️ تم اكتشاف كاش قديم - يمكن استخدام زر إزالة الكاش لحل المشاكل"
      );
    }
  }, 3000);
});

// تصدير الدوال للاستخدام الخارجي
window.clearCacheUtils = {
  clearAllCache: clearAllCache,
  checkCacheStatus: checkCacheStatus,
  showMessage: showMessage,
};

console.log("✅ نظام إزالة الكاش جاهز للاستخدام");
