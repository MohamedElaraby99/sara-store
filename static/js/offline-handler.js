/**
 * معالج العمليات غير المتصلة الشامل
 * يوفر واجهة مستخدم محسنة للعمل أوفلاين
 */
class OfflineHandler {
  constructor() {
    this.isInitialized = false;
    this.offlineRoutes = new Set();
    this.cachedData = new Map();
  }

  async init() {
    if (this.isInitialized) return;

    try {
      console.log("🚀 تهيئة OfflineHandler...");

      // انتظار تحميل المدراء الأساسية
      await this.waitForManagers();

      // إنشاء شريط الحالة
      this.setupOfflineStatusBar();

      // تحسين واجهة المستخدم للعمل الأوفلاين
      this.enhanceForOffline();

      // تحميل البيانات المحلية
      await this.preloadOfflineData();

      // تسجيل مراقبة الشبكة
      this.setupNetworkMonitoring();

      this.isInitialized = true;
      console.log("✅ OfflineHandler مُهيأ بنجاح");
    } catch (error) {
      console.error("❌ خطأ في تهيئة OfflineHandler:", error);
    }
  }

  async waitForManagers() {
    let attempts = 0;
    const maxAttempts = 50;

    while (
      (!window.dbManager || !window.syncManager) &&
      attempts < maxAttempts
    ) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.dbManager || !window.syncManager) {
      console.warn("⚠️ مدراء البيانات غير متاحة بالكامل - سيعمل بوظائف محدودة");
    }
  }

  setupOfflineStatusBar() {
    // تحقق من وجود شريط الحالة
    if (document.querySelector(".offline-status-bar")) {
      console.log("📊 شريط الحالة موجود مسبقاً");
      return;
    }

    // إنشاء شريط الحالة
    const statusBar = document.createElement("div");
    statusBar.className = "offline-status-bar";
    statusBar.innerHTML = `
      <div class="container-fluid">
        <div class="row align-items-center justify-content-between">
          <div class="col-auto">
            <span id="network-status" class="network-status offline">
              <i class="bi bi-wifi-off"></i>
              غير متصل
            </span>
          </div>
          <div class="col-auto">
            <span id="sync-indicator" class="sync-indicator">
              <i class="bi bi-arrow-repeat"></i>
              مزامنة
            </span>
          </div>
          <div class="col-auto">
            <span id="last-sync-time" class="last-sync-time">
              آخر مزامنة: لم تتم
            </span>
          </div>
          <div class="col-auto">
            <button id="manual-sync-btn" class="btn btn-outline-primary btn-sm" onclick="window.offlineHandler?.performManualSync()">
              <i class="bi bi-arrow-clockwise"></i>
              مزامنة
            </button>
          </div>
          <div class="col-auto d-md-none">
            <button id="hide-status-bar" class="btn btn-outline-secondary btn-sm" onclick="window.offlineHandler?.toggleStatusBar()">
              <i class="bi bi-chevron-up"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    // إدراج في أعلى الصفحة بعد الNavbar
    const navbar = document.querySelector(".navbar");
    if (navbar) {
      navbar.parentNode.insertBefore(statusBar, navbar.nextSibling);
    } else {
      document.body.insertBefore(statusBar, document.body.firstChild);
    }

    console.log("📊 تم إنشاء شريط الحالة الأوفلاين");
  }

  enhanceForOffline() {
    // تحسين البحث
    this.enhanceSearch();

    // تحسين النماذج
    this.enhanceForms();

    // تحسين التنقل
    this.enhanceNavigation();

    // تحسين قوائم البيانات
    this.enhanceDataLists();
  }

  enhanceSearch() {
    // تحسين بحث المنتجات
    const productSearch = document.querySelector(
      '#productSearch, input[name="search"], .product-search'
    );
    if (productSearch) {
      productSearch.addEventListener(
        "input",
        this.debounce(async (e) => {
          const query = e.target.value.trim();
          if (query.length >= 2) {
            await this.performOfflineProductSearch(query);
          }
        }, 300)
      );
    }
  }

  async performOfflineProductSearch(query) {
    if (!window.dbManager) return;

    try {
      const products = await window.dbManager.getProducts({ search: query });
      this.displayProductSearchResults(products);
    } catch (error) {
      console.error("خطأ في البحث الأوفلاين للمنتجات:", error);
    }
  }

  displayProductSearchResults(products) {
    const resultsContainer = document.querySelector(
      "#productResults, .product-results, .search-results"
    );
    if (!resultsContainer) return;

    if (products.length === 0) {
      resultsContainer.innerHTML =
        '<div class="text-muted text-center py-3">لا توجد نتائج</div>';
      return;
    }

    resultsContainer.innerHTML = products
      .map(
        (product) => `
      <div class="product-result border rounded p-3 mb-2 cursor-pointer" onclick="window.offlineHandler?.selectProduct(${
        product.id
      })">
        <div class="row align-items-center">
          <div class="col">
            <h6 class="mb-1">${product.name_ar || "غير محدد"}</h6>
            <small class="text-muted">
              المخزون: ${product.stock_quantity || 0} | 
              السعر: ${product.retail_price || 0} ج.م
            </small>
          </div>
          <div class="col-auto">
            <span class="badge ${
              product.stock_quantity > 0 ? "bg-success" : "bg-danger"
            }">
              ${product.stock_quantity > 0 ? "متوفر" : "نفد"}
            </span>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  }

  enhanceForms() {
    // تحسين نماذج المبيعات
    const salesForm = document.querySelector(
      '#salesForm, form[action*="sales"]'
    );
    if (salesForm) {
      salesForm.addEventListener("submit", async (e) => {
        if (!navigator.onLine) {
          e.preventDefault();
          await this.handleOfflineSaleSubmission(e.target);
        }
      });
    }
  }

  async handleOfflineSaleSubmission(form) {
    try {
      const formData = new FormData(form);
      const saleData = this.extractSaleDataFromForm(formData);

      if (window.syncManager) {
        const saleId = await window.syncManager.saveSaleLocal(saleData);
        this.showSuccessMessage(
          `تم حفظ البيع رقم ${saleId} محلياً - سيتم رفعه عند العودة للإنترنت`
        );

        // مسح النموذج
        form.reset();
      }
    } catch (error) {
      console.error("خطأ في حفظ البيع أوفلاين:", error);
      this.showErrorMessage("فشل في حفظ البيع محلياً");
    }
  }

  extractSaleDataFromForm(formData) {
    const items = [];
    let totalAmount = 0;

    // جمع عناصر البيع
    const productIds = formData.getAll("product_id[]");
    const quantities = formData.getAll("quantity[]");
    const prices = formData.getAll("unit_price[]");

    for (let i = 0; i < productIds.length; i++) {
      const quantity = parseFloat(quantities[i]) || 0;
      const price = parseFloat(prices[i]) || 0;
      const itemTotal = quantity * price;

      items.push({
        product_id: parseInt(productIds[i]),
        quantity: quantity,
        unit_price: price,
        total_price: itemTotal,
      });

      totalAmount += itemTotal;
    }

    return {
      items: items,
      total_amount: totalAmount,
      customer_id: formData.get("customer_id")
        ? parseInt(formData.get("customer_id"))
        : null,
      payment_status: formData.get("payment_status") || "paid",
      payment_type: formData.get("payment_type") || "cash",
      notes: formData.get("notes") || "",
      sale_date: new Date().toISOString().split("T")[0],
    };
  }

  enhanceNavigation() {
    // تحسين الروابط للعمل أوفلاين
    const navLinks = document.querySelectorAll(
      'a[href]:not([href^="http"]):not([href^="#"])'
    );
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        if (!navigator.onLine) {
          const href = link.getAttribute("href");
          if (!this.isRouteAvailableOffline(href)) {
            e.preventDefault();
            this.showOfflineNavigationMessage(href);
          }
        }
      });
    });
  }

  isRouteAvailableOffline(route) {
    // قائمة الصفحات المتاحة أوفلاين
    const availableOfflineRoutes = [
      "/",
      "/dashboard",
      "/sales/new",
      "/products",
      "/customers",
      "/offline-demo",
      "/price-ticket",
      "/qr-generator",
    ];

    return (
      availableOfflineRoutes.includes(route) ||
      route.startsWith("/static/") ||
      this.offlineRoutes.has(route)
    );
  }

  enhanceDataLists() {
    // تحسين عرض قوائم البيانات أوفلاين
    this.enhanceProductsList();
    this.enhanceCustomersList();
  }

  async enhanceProductsList() {
    const productsContainer = document.querySelector(
      "#products-list, .products-container"
    );
    if (productsContainer && !navigator.onLine) {
      try {
        const products = (await window.dbManager?.getProducts()) || [];
        this.renderOfflineProductsList(products, productsContainer);
      } catch (error) {
        console.error("خطأ في عرض قائمة المنتجات أوفلاين:", error);
      }
    }
  }

  async enhanceCustomersList() {
    const customersContainer = document.querySelector(
      "#customers-list, .customers-container"
    );
    if (customersContainer && !navigator.onLine) {
      try {
        const customers = (await window.dbManager?.getCustomers()) || [];
        this.renderOfflineCustomersList(customers, customersContainer);
      } catch (error) {
        console.error("خطأ في عرض قائمة العملاء أوفلاين:", error);
      }
    }
  }

  setupNetworkMonitoring() {
    window.addEventListener("online", () => {
      console.log("🌐 عودة الاتصال");
      this.handleOnlineEvent();
    });

    window.addEventListener("offline", () => {
      console.log("📴 فقدان الاتصال");
      this.handleOfflineEvent();
    });

    // تحديث فوري للحالة
    this.updateNetworkStatus();
  }

  handleOnlineEvent() {
    this.updateNetworkStatus();
    this.showSuccessMessage("تم استعادة الاتصال - جاري المزامنة...");

    // مزامنة تلقائية
    if (window.syncManager) {
      setTimeout(() => {
        window.syncManager.performSync();
      }, 2000);
    }
  }

  handleOfflineEvent() {
    this.updateNetworkStatus();
    this.showWarningMessage("فقدان الاتصال - تم التبديل للوضع الأوفلاين");
  }

  updateNetworkStatus() {
    const statusIndicator = document.querySelector("#network-status");
    if (statusIndicator) {
      if (navigator.onLine) {
        statusIndicator.className = "network-status online";
        statusIndicator.innerHTML = '<i class="bi bi-wifi"></i> متصل';
      } else {
        statusIndicator.className = "network-status offline";
        statusIndicator.innerHTML = '<i class="bi bi-wifi-off"></i> غير متصل';
      }
    }
  }

  async preloadOfflineData() {
    if (!window.dbManager) return;

    try {
      console.log("📥 تحميل البيانات للعمل الأوفلاين...");

      // تحميل البيانات الأساسية
      const [products, customers, categories] = await Promise.all([
        window.dbManager.getProducts().catch(() => []),
        window.dbManager.getCustomers().catch(() => []),
        window.dbManager.getCategories().catch(() => []),
      ]);

      this.cachedData.set("products", products);
      this.cachedData.set("customers", customers);
      this.cachedData.set("categories", categories);

      console.log(
        `✅ تم تحميل ${products.length} منتج، ${customers.length} عميل، ${categories.length} فئة`
      );
    } catch (error) {
      console.error("❌ خطأ في تحميل البيانات الأوفلاين:", error);
    }
  }

  // طرق مساعدة للتفاعل مع المستخدم

  async performManualSync() {
    if (!navigator.onLine) {
      this.showWarningMessage("لا يمكن المزامنة بدون اتصال بالإنترنت");
      return;
    }

    if (window.syncManager) {
      try {
        this.showInfoMessage("جاري المزامنة...");
        await window.syncManager.performSync();
        this.showSuccessMessage("تمت المزامنة بنجاح");
      } catch (error) {
        this.showErrorMessage("فشلت المزامنة");
        console.error("خطأ في المزامنة اليدوية:", error);
      }
    }
  }

  toggleStatusBar() {
    const statusBar = document.querySelector(".offline-status-bar");
    const hideBtn = document.querySelector("#hide-status-bar");

    if (statusBar && hideBtn) {
      if (statusBar.classList.contains("hidden")) {
        statusBar.classList.remove("hidden");
        hideBtn.innerHTML = '<i class="bi bi-chevron-up"></i>';
      } else {
        statusBar.classList.add("hidden");
        hideBtn.innerHTML = '<i class="bi bi-chevron-down"></i>';
      }
    }
  }

  // طرق عرض الرسائل

  showSuccessMessage(message) {
    this.showMessage(message, "success");
  }

  showErrorMessage(message) {
    this.showMessage(message, "error");
  }

  showWarningMessage(message) {
    this.showMessage(message, "warning");
  }

  showInfoMessage(message) {
    this.showMessage(message, "info");
  }

  showMessage(message, type = "info") {
    // إنشاء عنصر الرسالة
    const notification = document.createElement("div");
    notification.className = `alert alert-${this.getAlertClass(
      type
    )} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
      top: 130px;
      right: 20px;
      z-index: 9999;
      min-width: 300px;
      max-width: 500px;
    `;

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

  getAlertClass(type) {
    const classes = {
      success: "success",
      error: "danger",
      warning: "warning",
      info: "info",
    };
    return classes[type] || "info";
  }

  showOfflineNavigationMessage(route) {
    this.showWarningMessage(`الصفحة ${route} غير متاحة في الوضع الأوفلاين`);
  }

  // طرق مساعدة
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // طرق تشخيص وصيانة

  async getStatus() {
    return {
      initialized: this.isInitialized,
      online: navigator.onLine,
      cachedDataSize: this.cachedData.size,
      offlineRoutesCount: this.offlineRoutes.size,
      managersAvailable: {
        dbManager: !!window.dbManager,
        syncManager: !!window.syncManager,
      },
    };
  }
}

// تهيئة OfflineHandler عند تحميل النافذة
if (typeof window !== "undefined") {
  window.OfflineHandler = OfflineHandler;
}
