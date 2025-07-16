// مدير المزامنة للتعامل مع البيانات أثناء الاتصال وعدم الاتصال
class SyncManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.lastSyncTime = null;
    this.maxRetries = 3;
    this.syncInterval = null;
    this.displayInterval = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;

    try {
      // انتظار تهيئة dbManager إذا لم يكن جاهزاً
      await this.waitForDBManager();

      // تحميل آخر وقت مزامنة
      await this.loadLastSyncTime();

      // تسجيل أحداث الشبكة
      this.setupNetworkEvents();

      // تحديث الحالة الأولى
      this.updateOnlineStatus();

      // مزامنة دورية كل 5 دقائق
      this.syncInterval = setInterval(() => {
        if (this.isOnline && !this.syncInProgress) {
          this.performSync();
        }
      }, 5 * 60 * 1000);

      // تحديث عرض الوقت كل 30 ثانية
      this.displayInterval = setInterval(() => {
        this.updateLastSyncDisplay();
      }, 30 * 1000);

      this.isInitialized = true;
      console.log("✅ SyncManager initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing SyncManager:", error);
    }
  }

  async waitForDBManager() {
    let attempts = 0;
    while (!window.dbManager && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }
    if (!window.dbManager) {
      throw new Error("DBManager not available after waiting");
    }
  }

  setupNetworkEvents() {
    window.addEventListener("online", () => {
      console.log("🌐 Network: Online");
      this.isOnline = true;
      this.onConnectionRestored();
    });

    window.addEventListener("offline", () => {
      console.log("📴 Network: Offline");
      this.isOnline = false;
      this.onConnectionLost();
    });
  }

  onConnectionRestored() {
    this.updateOnlineStatus();
    this.showNotification("تم استعادة الاتصال - جاري المزامنة...", "success");
    // تأخير قصير للسماح للشبكة بالاستقرار
    setTimeout(() => {
      if (this.isOnline) {
        this.performSync();
      }
    }, 2000);
  }

  onConnectionLost() {
    this.syncInProgress = false;
    this.updateOnlineStatus();
    this.showNotification(
      "فقدان الاتصال - تم التبديل للوضع غير المتصل",
      "warning"
    );
  }

  updateOnlineStatus() {
    // تحديث حالة الاتصال في OfflineHandler إذا كان متاحاً
    if (window.offlineHandler) {
      window.offlineHandler.updateConnectionButton();
    }

    // تحديث عرض آخر مزامنة فوراً
    this.updateLastSyncDisplay();
  }

  // المزامنة الرئيسية
  async performSync() {
    if (this.syncInProgress || !this.isOnline) {
      console.log("⚠️ Sync skipped: in progress or offline");
      return;
    }

    console.log("🔄 Starting sync...");
    this.syncInProgress = true;
    this.showSyncProgress(true);

    try {
      // مزامنة البيانات من الخادم
      await this.syncDataFromServer();

      // مزامنة العمليات المعلقة
      await this.syncPendingOperations();

      // تحديث وقت آخر مزامنة
      this.lastSyncTime = new Date();
      await this.saveLastSyncTime();

      console.log("✅ Sync completed successfully");
      this.showNotification("تمت المزامنة بنجاح", "success");
    } catch (error) {
      console.error("❌ Sync failed:", error);
      this.showNotification("فشلت المزامنة - سيتم المحاولة مرة أخرى", "error");
    } finally {
      this.syncInProgress = false;
      this.showSyncProgress(false);
      this.updateLastSyncDisplay();
    }
  }

  async syncDataFromServer() {
    const endpoints = [
      { url: "/api/products", handler: "saveProducts" },
      { url: "/api/categories", handler: "saveCategories" },
      { url: "/api/customers", handler: "saveCustomers" },
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && window.dbManager) {
            await window.dbManager[endpoint.handler](data);
            console.log(`✅ Synced ${endpoint.url}: ${data.length} items`);
          }
        } else {
          console.warn(
            `⚠️ Failed to fetch ${endpoint.url}: ${response.status}`
          );
        }
      } catch (error) {
        console.error(`❌ Error syncing ${endpoint.url}:`, error);
      }
    }
  }

  async syncPendingOperations() {
    if (!window.dbManager) return;

    const pendingOps = await window.dbManager.getPendingOperations();
    console.log(`📤 Syncing ${pendingOps.length} pending operations`);

    for (const operation of pendingOps) {
      try {
        await this.processPendingOperation(operation);
        await window.dbManager.removePendingOperation(operation.id);
        console.log(`✅ Processed operation: ${operation.operation_type}`);
      } catch (error) {
        console.error("❌ Failed to process operation:", error);
        operation.retry_count = (operation.retry_count || 0) + 1;
        if (operation.retry_count >= this.maxRetries) {
          await window.dbManager.removePendingOperation(operation.id);
          console.log(
            `🗑️ Removed failed operation after ${this.maxRetries} retries`
          );
        }
      }
    }
  }

  async processPendingOperation(operation) {
    if (operation.operation_type === "create_sale") {
      return await this.syncCreateSale(operation);
    }
    // يمكن إضافة عمليات أخرى هنا
  }

  async syncCreateSale(operation) {
    const response = await fetch("/api/sales", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": window.csrf_token || "",
      },
      body: JSON.stringify(operation.data),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    return await response.json();
  }

  // حفظ البيانات محلياً
  async saveSaleLocal(saleData) {
    if (!window.dbManager) {
      throw new Error("Database Manager not available");
    }

    const saleId = await window.dbManager.saveSale(saleData);
    console.log(`💾 Sale saved locally with ID: ${saleId}`);

    // محاولة مزامنة فورية إذا كان متصل
    if (this.isOnline && !this.syncInProgress) {
      setTimeout(() => this.performSync(), 1000);
    }

    return saleId;
  }

  // طرق البيانات المحلية
  async getProductsLocal(filters = {}) {
    if (!window.dbManager) return [];
    return await window.dbManager.getProducts(filters);
  }

  async getCustomersLocal(searchTerm = "") {
    if (!window.dbManager) return [];
    return await window.dbManager.getCustomers({ search: searchTerm });
  }

  // واجهة المستخدم
  showSyncProgress(show) {
    const indicator = document.querySelector("#sync-indicator");
    if (indicator) {
      if (show) {
        indicator.className = "sync-indicator syncing";
        indicator.innerHTML =
          '<i class="bi bi-arrow-repeat"></i> جاري المزامنة...';
        indicator.style.display = "inline-block";
      } else {
        indicator.className = "sync-indicator";
        indicator.innerHTML = '<i class="bi bi-arrow-repeat"></i> مزامنة';
        indicator.style.display = "inline-block";
      }
    }
  }

  showNotification(message, type = "info") {
    // إزالة الإشعارات القديمة
    const existingToasts = document.querySelectorAll(".notification-toast");
    existingToasts.forEach((toast) => toast.remove());

    const notification = document.createElement("div");
    notification.className = `alert alert-${type} notification-toast`;
    notification.innerHTML = `
      <div>${message}</div>
      <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;

    document.body.appendChild(notification);

    // إزالة تلقائية بعد 4 ثواني
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 4000);
  }

  updateLastSyncDisplay() {
    const syncDisplay = document.querySelector("#last-sync-time");
    if (!syncDisplay) return;

    if (!this.lastSyncTime) {
      syncDisplay.textContent = "آخر مزامنة: لم تتم";
      return;
    }

    const now = new Date();
    const diff = now - this.lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let timeAgo;
    if (minutes < 1) {
      timeAgo = "منذ لحظات";
    } else if (minutes < 60) {
      timeAgo = `منذ ${minutes} دقيقة`;
    } else if (hours < 24) {
      timeAgo = `منذ ${hours} ساعة`;
    } else {
      timeAgo = `منذ ${days} يوم`;
    }

    syncDisplay.textContent = `آخر مزامنة: ${timeAgo}`;
  }

  async saveLastSyncTime() {
    if (window.dbManager && this.lastSyncTime) {
      try {
        await window.dbManager.setSetting(
          "lastSyncTime",
          this.lastSyncTime.toISOString()
        );
      } catch (error) {
        console.error("Error saving last sync time:", error);
      }
    }
  }

  async loadLastSyncTime() {
    if (window.dbManager) {
      try {
        const savedTime = await window.dbManager.getSetting("lastSyncTime");
        if (savedTime) {
          this.lastSyncTime = new Date(savedTime);
          console.log(`📅 Loaded last sync time: ${this.lastSyncTime}`);
        }
      } catch (error) {
        console.error("Error loading last sync time:", error);
      }
    }
  }

  async getStatus() {
    const pendingOps = window.dbManager
      ? await window.dbManager.getPendingOperations()
      : [];

    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      pendingOperations: pendingOps.length,
      isInitialized: this.isInitialized,
    };
  }

  // تنظيف الموارد
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.displayInterval) {
      clearInterval(this.displayInterval);
    }
    this.isInitialized = false;
  }
}
