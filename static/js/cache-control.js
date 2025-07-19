// نظام التحكم في الكاش - Cache Control System
window.cacheControl = {
  // إعدادات الكاش
  settings: {
    useCache: false, // لا تستخدم الكاش تلقائياً
    forceRefresh: true, // إجبار التحديث من الخادم
    cacheTimeout: 0, // لا يوجد وقت صلاحية للكاش
    enableOffline: false, // تعطيل الوضع غير المتصل
  },

  // تهيئة النظام
  init() {
    console.log("🚀 تهيئة نظام التحكم في الكاش...");

    // تحميل الإعدادات المحفوظة
    this.loadSettings();

    // تطبيق الإعدادات
    this.applySettings();

    // إضافة عناصر التحكم للواجهة
    this.addControlUI();

    console.log("✅ تم تهيئة نظام التحكم في الكاش");
  },

  // تحميل الإعدادات
  loadSettings() {
    try {
      const saved = localStorage.getItem("cacheControlSettings");
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.log(
        "⚠️ لا يمكن تحميل إعدادات الكاش، استخدام الإعدادات الافتراضية"
      );
    }
  },

  // حفظ الإعدادات
  saveSettings() {
    try {
      localStorage.setItem(
        "cacheControlSettings",
        JSON.stringify(this.settings)
      );
      console.log("✅ تم حفظ إعدادات الكاش");
    } catch (error) {
      console.error("❌ خطأ في حفظ إعدادات الكاش:", error);
    }
  },

  // تطبيق الإعدادات
  applySettings() {
    // تعطيل Service Worker إذا كان مطلوباً
    if (!this.settings.enableOffline && !this.settings.enableServiceWorker) {
      this.disableServiceWorker();
    }

    // إضافة headers لمنع الكاش
    if (this.settings.forceRefresh) {
      this.addNoCacheHeaders();
    }

    // تعطيل IndexedDB إذا كان مطلوباً
    if (!this.settings.useCache && !this.settings.enableIndexedDB) {
      this.disableIndexedDB();
    }

    // تعطيل localStorage إذا كان مطلوباً
    if (!this.settings.enableLocalStorage) {
      this.disableLocalStorage();
    }

    // تعطيل sessionStorage إذا كان مطلوباً
    if (!this.settings.enableSessionStorage) {
      this.disableSessionStorage();
    }

    console.log("✅ تم تطبيق إعدادات الكاش:", this.settings);
  },

  // تعطيل Service Worker
  async disableServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
          console.log("✅ تم إلغاء تسجيل Service Worker");
        }
      } catch (error) {
        console.log("⚠️ لا يمكن إلغاء تسجيل Service Worker:", error);
      }
    }
  },

  // إضافة headers لمنع الكاش
  addNoCacheHeaders() {
    // إضافة meta tags لمنع الكاش
    const metaTags = [
      '<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">',
      '<meta http-equiv="Pragma" content="no-cache">',
      '<meta http-equiv="Expires" content="0">',
    ];

    metaTags.forEach((tag) => {
      if (
        !document.querySelector(
          `meta[http-equiv="${tag.match(/http-equiv="([^"]+)"/)[1]}"]`
        )
      ) {
        document.head.insertAdjacentHTML("beforeend", tag);
      }
    });

    console.log("✅ تم إضافة headers لمنع الكاش");
  },

  // تعطيل IndexedDB
  disableIndexedDB() {
    // إزالة مراجع IndexedDB
    if (window.dbManager) {
      window.dbManager = null;
    }
    if (window.syncManager) {
      window.syncManager = null;
    }
    if (window.offlineHandler) {
      window.offlineHandler = null;
    }

    console.log("✅ تم تعطيل IndexedDB");
  },

  // تعطيل localStorage
  disableLocalStorage() {
    try {
      // مسح البيانات الحالية
      localStorage.clear();
      console.log("✅ تم تعطيل localStorage");
    } catch (error) {
      console.log("⚠️ لا يمكن تعطيل localStorage:", error);
    }
  },

  // تعطيل sessionStorage
  disableSessionStorage() {
    try {
      // مسح البيانات الحالية
      sessionStorage.clear();
      console.log("✅ تم تعطيل sessionStorage");
    } catch (error) {
      console.log("⚠️ لا يمكن تعطيل sessionStorage:", error);
    }
  },

  // إضافة عناصر التحكم للواجهة
  addControlUI() {
    // إنشاء زر التحكم في الكاش
    const controlButton = document.createElement("button");
    controlButton.id = "cache-control-btn";
    controlButton.innerHTML = `
            <i class="bi bi-gear-fill"></i>
            <span>تحكم الكاش</span>
            <span class="badge ${
              this.settings.useCache ? "bg-success" : "bg-danger"
            }">${this.settings.useCache ? "مفعل" : "معطل"}</span>
        `;
    controlButton.className =
      "btn btn-outline-info btn-sm position-relative me-2";
    controlButton.style.cssText = "font-weight: bold;";
    controlButton.onclick = () => this.showControlPanel();

    // إضافة الزر للهيدر - البحث عن المكان المناسب
    const headerRight = document.querySelector(".d-flex");
    if (headerRight) {
      // إضافة الزر في بداية القسم
      headerRight.insertBefore(controlButton, headerRight.firstChild);
    } else {
      // إذا لم نجد المكان المناسب، نضيفه في نهاية الهيدر
      const navbar = document.querySelector(".navbar-nav");
      if (navbar) {
        const li = document.createElement("li");
        li.className = "nav-item";
        li.appendChild(controlButton);
        navbar.appendChild(li);
      }
    }

    console.log("✅ تم إضافة زر التحكم في الكاش");
  },

  // عرض لوحة التحكم
  showControlPanel() {
    const panel = document.createElement("div");
    panel.id = "cache-control-panel";
    panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #007bff;
            border-radius: 10px;
            padding: 20px;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            min-width: 400px;
            font-family: Arial, sans-serif;
        `;

    panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h4 style="margin: 0; color: #007bff;">
                    <i class="bi bi-gear-fill me-2"></i>
                    تحكم في الكاش
                </h4>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 20px; cursor: pointer;">×</button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: flex; align-items: center; margin-bottom: 10px;">
                    <input type="checkbox" id="useCache" ${
                      this.settings.useCache ? "checked" : ""
                    } style="margin-left: 10px;">
                    <span>استخدام الكاش المحلي</span>
                </label>
                <small style="color: #666;">السماح بتخزين البيانات محلياً للوصول السريع</small>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: flex; align-items: center; margin-bottom: 10px;">
                    <input type="checkbox" id="forceRefresh" ${
                      this.settings.forceRefresh ? "checked" : ""
                    } style="margin-left: 10px;">
                    <span>إجبار التحديث من الخادم</span>
                </label>
                <small style="color: #666;">تجاهل الكاش وتحميل البيانات الجديدة دائماً</small>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: flex; align-items: center; margin-bottom: 10px;">
                    <input type="checkbox" id="enableOffline" ${
                      this.settings.enableOffline ? "checked" : ""
                    } style="margin-left: 10px;">
                    <span>تفعيل الوضع غير المتصل</span>
                </label>
                <small style="color: #666;">السماح باستخدام التطبيق بدون إنترنت</small>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 15px;">
                <div style="display: flex; gap: 10px;">
                    <button onclick="window.cacheControl.saveAndApply()" style="
                        background: #007bff; 
                        color: white; 
                        border: none; 
                        padding: 10px 20px; 
                        border-radius: 5px; 
                        cursor: pointer;
                        flex: 1;
                    ">
                        <i class="bi bi-check-circle me-1"></i>
                        حفظ وتطبيق
                    </button>
                    <button onclick="window.cacheControl.clearAllCache()" style="
                        background: #dc3545; 
                        color: white; 
                        border: none; 
                        padding: 10px 20px; 
                        border-radius: 5px; 
                        cursor: pointer;
                        flex: 1;
                    ">
                        <i class="bi bi-trash me-1"></i>
                        مسح الكاش
                    </button>
                </div>
            </div>
        `;

    document.body.appendChild(panel);

    // إضافة خلفية معتمة
    const overlay = document.createElement("div");
    overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        `;
    overlay.onclick = () => {
      overlay.remove();
      panel.remove();
    };
    document.body.appendChild(overlay);
  },

  // حفظ وتطبيق الإعدادات
  saveAndApply() {
    // قراءة القيم من النموذج
    this.settings.useCache = document.getElementById("useCache").checked;
    this.settings.forceRefresh =
      document.getElementById("forceRefresh").checked;
    this.settings.enableOffline =
      document.getElementById("enableOffline").checked;

    // حفظ الإعدادات
    this.saveSettings();

    // تطبيق الإعدادات
    this.applySettings();

    // إغلاق اللوحة
    document.getElementById("cache-control-panel").remove();
    document.querySelector('div[style*="z-index: 9999"]').remove();

    // عرض رسالة نجاح
    this.showMessage("تم حفظ وتطبيق إعدادات الكاش بنجاح!", "success");

    // تحديث الزر
    this.updateControlButton();
  },

  // تحديث زر التحكم
  updateControlButton() {
    const button = document.getElementById("cache-control-btn");
    if (button) {
      const badge = button.querySelector(".badge");
      if (badge) {
        badge.className = `badge ${
          this.settings.useCache ? "bg-success" : "bg-danger"
        }`;
        badge.textContent = this.settings.useCache ? "مفعل" : "معطل";
      }
    }
  },

  // مسح جميع الكاش
  async clearAllCache() {
    if (
      confirm(
        "هل تريد مسح جميع أنواع الكاش؟\n\nهذا سيزيل:\n• Service Worker\n• Cache Storage\n• IndexedDB\n• localStorage\n• sessionStorage\n• Cookies"
      )
    ) {
      try {
        // إزالة لوحة التحكم
        const panel = document.getElementById("cache-control-panel");
        if (panel) panel.remove();
        const overlay = document.querySelector('div[style*="z-index: 9999"]');
        if (overlay) overlay.remove();

        // استخدام نظام إزالة الكاش الموجود
        if (window.clearCacheUtils && window.clearCacheUtils.clearAllCache) {
          await window.clearCacheUtils.clearAllCache();
          this.showMessage("تم مسح الكاش بنجاح!", "success");
        } else {
          this.showMessage("نظام إزالة الكاش غير متاح", "error");
        }
      } catch (error) {
        this.showMessage("حدث خطأ في مسح الكاش: " + error.message, "error");
      }
    }
  },

  // عرض رسالة
  showMessage(message, type = "info") {
    const colors = {
      success: "#d4edda",
      error: "#f8d7da",
      info: "#d1ecf1",
    };
    const textColors = {
      success: "#155724",
      error: "#721c24",
      info: "#0c5460",
    };

    const alertDiv = document.createElement("div");
    alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            max-width: 400px;
            background: ${colors[type]};
            color: ${textColors[type]};
            border: 1px solid ${
              type === "success"
                ? "#c3e6cb"
                : type === "error"
                ? "#f5c6cb"
                : "#bee5eb"
            };
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: Arial, sans-serif;
        `;
    alertDiv.innerHTML = `
            <div style="display: flex; align-items: center;">
                <span style="font-size: 20px; margin-left: 10px;">${
                  type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"
                }</span>
                <span style="flex: 1;">${message}</span>
                <button type="button" style="background: none; border: none; margin-right: auto; font-size: 18px; cursor: pointer; color: ${
                  textColors[type]
                };" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 5000);
  },

  // فحص حالة الكاش
  async checkCacheStatus() {
    const status = {
      serviceWorker: false,
      cacheStorage: false,
      indexedDB: false,
      localStorage: false,
      sessionStorage: false,
    };

    // فحص Service Worker
    if ("serviceWorker" in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        status.serviceWorker = registrations.length > 0;
      } catch (error) {
        status.serviceWorker = false;
      }
    }

    // فحص Cache Storage
    if ("caches" in window) {
      try {
        const keys = await caches.keys();
        status.cacheStorage = keys.length > 0;
      } catch (error) {
        status.cacheStorage = false;
      }
    }

    // فحص IndexedDB
    if ("indexedDB" in window) {
      try {
        // محاولة فتح قاعدة بيانات للاختبار
        const request = indexedDB.open("test-db", 1);
        request.onerror = () => {
          status.indexedDB = false;
        };
        request.onsuccess = () => {
          status.indexedDB = true;
          request.result.close();
          indexedDB.deleteDatabase("test-db");
        };
      } catch (error) {
        status.indexedDB = false;
      }
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
  },
};

// تهيئة النظام عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", function () {
  window.cacheControl.init();
});
