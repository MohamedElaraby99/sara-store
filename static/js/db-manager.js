// مدير قاعدة البيانات المحلية باستخدام IndexedDB
class DatabaseManager {
  constructor() {
    this.dbName = "sarastoreStoreDB";
    this.dbVersion = 1;
    this.db = null;
    this.isInitialized = false;
    this.initPromise = this.initDB();
  }

  // تهيئة قاعدة البيانات
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error("Database failed to open");
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log("Database opened successfully");
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        console.log("Database upgrade needed");

        // إنشاء جداول البيانات
        this.createObjectStores();
      };
    });
  }

  // إنشاء مخازن البيانات
  createObjectStores() {
    // جدول المنتجات
    if (!this.db.objectStoreNames.contains("products")) {
      const productsStore = this.db.createObjectStore("products", {
        keyPath: "id",
      });
      productsStore.createIndex("name_ar", "name_ar", { unique: false });
      productsStore.createIndex("category_id", "category_id", {
        unique: false,
      });
      productsStore.createIndex("stock_quantity", "stock_quantity", {
        unique: false,
      });
    }

    // جدول الفئات
    if (!this.db.objectStoreNames.contains("categories")) {
      const categoriesStore = this.db.createObjectStore("categories", {
        keyPath: "id",
      });
      categoriesStore.createIndex("name_ar", "name_ar", { unique: false });
    }

    // جدول العملاء
    if (!this.db.objectStoreNames.contains("customers")) {
      const customersStore = this.db.createObjectStore("customers", {
        keyPath: "id",
      });
      customersStore.createIndex("name", "name", { unique: false });
      customersStore.createIndex("phone", "phone", { unique: false });
    }

    // جدول المبيعات
    if (!this.db.objectStoreNames.contains("sales")) {
      const salesStore = this.db.createObjectStore("sales", {
        keyPath: "id",
        autoIncrement: true,
      });
      salesStore.createIndex("sale_date", "sale_date", { unique: false });
      salesStore.createIndex("customer_id", "customer_id", { unique: false });
      salesStore.createIndex("user_id", "user_id", { unique: false });
      salesStore.createIndex("sync_status", "sync_status", { unique: false });
    }

    // جدول عناصر المبيعات
    if (!this.db.objectStoreNames.contains("sale_items")) {
      const saleItemsStore = this.db.createObjectStore("sale_items", {
        keyPath: "id",
        autoIncrement: true,
      });
      saleItemsStore.createIndex("sale_id", "sale_id", { unique: false });
      saleItemsStore.createIndex("product_id", "product_id", { unique: false });
    }

    // جدول العمليات المعلقة للمزامنة
    if (!this.db.objectStoreNames.contains("pending_operations")) {
      const pendingStore = this.db.createObjectStore("pending_operations", {
        keyPath: "id",
        autoIncrement: true,
      });
      pendingStore.createIndex("operation_type", "operation_type", {
        unique: false,
      });
      pendingStore.createIndex("timestamp", "timestamp", { unique: false });
      pendingStore.createIndex("priority", "priority", { unique: false });
    }

    // جدول إعدادات التطبيق
    if (!this.db.objectStoreNames.contains("app_settings")) {
      const settingsStore = this.db.createObjectStore("app_settings", {
        keyPath: "key",
      });
    }
  }

  // انتظار تهيئة قاعدة البيانات
  async waitForInit() {
    if (!this.isInitialized) {
      await this.initPromise;
    }
    return this.db;
  }

  // ==== عمليات المنتجات ====
  async getProducts(filters = {}) {
    await this.waitForInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["products"], "readonly");
      const store = transaction.objectStore("products");
      const request = store.getAll();

      request.onsuccess = () => {
        let products = request.result;

        // تطبيق الفلاتر
        if (filters.category_id) {
          products = products.filter(
            (p) => p.category_id === filters.category_id
          );
        }
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          products = products.filter((p) => {
            return (
              this.safeStringIncludes(p.name_ar, searchTerm) ||
              this.safeStringIncludes(p.description_ar, searchTerm)
            );
          });
        }
        if (filters.low_stock) {
          products = products.filter(
            (p) => p.stock_quantity <= p.min_stock_threshold
          );
        }

        resolve(products);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getProduct(id) {
    await this.waitForInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["products"], "readonly");
      const store = transaction.objectStore("products");
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveProducts(products) {
    await this.waitForInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["products"], "readwrite");
      const store = transaction.objectStore("products");

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      products.forEach((product) => {
        store.put({
          ...product,
          last_updated: new Date().toISOString(),
        });
      });
    });
  }

  // ==== عمليات الفئات ====
  async getCategories() {
    await this.waitForInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["categories"], "readonly");
      const store = transaction.objectStore("categories");
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveCategories(categories) {
    await this.waitForInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["categories"], "readwrite");
      const store = transaction.objectStore("categories");

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      categories.forEach((category) => {
        store.put({
          ...category,
          last_updated: new Date().toISOString(),
        });
      });
    });
  }

  // ==== عمليات العملاء ====
  async getCustomers(search = "") {
    await this.waitForInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["customers"], "readonly");
      const store = transaction.objectStore("customers");
      const request = store.getAll();

      request.onsuccess = () => {
        let customers = request.result;

        if (search) {
          const searchTerm = search.toLowerCase();
          customers = customers.filter((c) => {
            return (
              this.safeStringIncludes(c.name, searchTerm) ||
              (c.phone &&
                typeof c.phone === "string" &&
                c.phone.includes(searchTerm))
            );
          });
        }

        resolve(customers);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async saveCustomers(customers) {
    await this.waitForInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["customers"], "readwrite");
      const store = transaction.objectStore("customers");

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      customers.forEach((customer) => {
        store.put({
          ...customer,
          last_updated: new Date().toISOString(),
        });
      });
    });
  }

  // ==== عمليات المبيعات ====
  async saveSale(saleData) {
    await this.waitForInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        ["sales", "sale_items"],
        "readwrite"
      );
      const salesStore = transaction.objectStore("sales");
      const itemsStore = transaction.objectStore("sale_items");

      // إضافة معلومات المزامنة
      const saleWithMeta = {
        ...saleData,
        sync_status: "pending",
        created_offline: true,
        local_id: Date.now(), // معرف محلي مؤقت
        created_at: new Date().toISOString(),
      };

      const saleRequest = salesStore.add(saleWithMeta);

      saleRequest.onsuccess = () => {
        const saleId = saleRequest.result;

        // حفظ عناصر البيع
        const itemPromises = saleData.items.map((item) => {
          return new Promise((resolveItem, rejectItem) => {
            const itemWithMeta = {
              ...item,
              sale_id: saleId,
              local_sale_id: saleId,
            };
            const itemRequest = itemsStore.add(itemWithMeta);

            itemRequest.onsuccess = () => resolveItem(itemRequest.result);
            itemRequest.onerror = () => rejectItem(itemRequest.error);
          });
        });

        Promise.all(itemPromises)
          .then(() => {
            // إضافة العملية للقائمة المعلقة
            this.addPendingOperation({
              operation_type: "create_sale",
              data: { sale_id: saleId },
              priority: 1,
              timestamp: Date.now(),
            });
            resolve(saleId);
          })
          .catch(reject);
      };

      saleRequest.onerror = () => reject(saleRequest.error);
    });
  }

  async getSales(filters = {}) {
    await this.waitForInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["sales"], "readonly");
      const store = transaction.objectStore("sales");
      const request = store.getAll();

      request.onsuccess = () => {
        let sales = request.result;

        // تطبيق الفلاتر
        if (filters.date_from) {
          sales = sales.filter((s) => s.sale_date >= filters.date_from);
        }
        if (filters.date_to) {
          sales = sales.filter((s) => s.sale_date <= filters.date_to);
        }
        if (filters.customer_id) {
          sales = sales.filter((s) => s.customer_id === filters.customer_id);
        }

        // ترتيب حسب التاريخ (الأحدث أولاً)
        sales.sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));

        resolve(sales);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ==== العمليات المعلقة ====
  async addPendingOperation(operation) {
    await this.waitForInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        ["pending_operations"],
        "readwrite"
      );
      const store = transaction.objectStore("pending_operations");
      const request = store.add(operation);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingOperations() {
    await this.waitForInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        ["pending_operations"],
        "readonly"
      );
      const store = transaction.objectStore("pending_operations");
      const request = store.getAll();

      request.onsuccess = () => {
        // ترتيب حسب الأولوية والوقت
        const operations = request.result.sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          return a.timestamp - b.timestamp;
        });
        resolve(operations);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async removePendingOperation(id) {
    await this.waitForInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        ["pending_operations"],
        "readwrite"
      );
      const store = transaction.objectStore("pending_operations");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==== الإعدادات ====
  async getSetting(key, defaultValue = null) {
    await this.waitForInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["app_settings"], "readonly");
      const store = transaction.objectStore("app_settings");
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : defaultValue);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async setSetting(key, value) {
    await this.waitForInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["app_settings"], "readwrite");
      const store = transaction.objectStore("app_settings");
      const request = store.put({
        key,
        value,
        updated_at: new Date().toISOString(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==== عمليات الصيانة ====
  async clearAllData() {
    await this.waitForInit();
    const storeNames = [
      "products",
      "categories",
      "customers",
      "sales",
      "sale_items",
      "pending_operations",
    ];

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeNames, "readwrite");

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      storeNames.forEach((storeName) => {
        const store = transaction.objectStore(storeName);
        store.clear();
      });
    });
  }

  async getDatabaseSize() {
    await this.waitForInit();
    // تقدير حجم قاعدة البيانات (تقريبي)
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage,
      quota: estimate.quota,
      percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2),
    };
  }

  // ==== طرق مساعدة ====

  // طريقة مساعدة للبحث الآمن في النصوص
  safeStringIncludes(str, searchTerm) {
    try {
      return (
        str && typeof str === "string" && str.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.warn("Error in safeStringIncludes:", { str, searchTerm, error });
      return false;
    }
  }

  // طريقة للتحقق من صحة البيانات قبل الحفظ
  validateData(data, requiredFields = []) {
    if (!data || typeof data !== "object") {
      return { valid: false, error: "Invalid data object" };
    }

    for (const field of requiredFields) {
      if (
        !data.hasOwnProperty(field) ||
        data[field] === undefined ||
        data[field] === null
      ) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    return { valid: true };
  }

  // طريقة تشخيص لفحص سلامة البيانات
  async diagnoseDatabaseIntegrity() {
    try {
      await this.waitForInit();

      const results = {
        products: { total: 0, corrupted: 0, missing_fields: [] },
        customers: { total: 0, corrupted: 0, missing_fields: [] },
        categories: { total: 0, corrupted: 0, missing_fields: [] },
      };

      // فحص المنتجات
      const products = await this.getProducts();
      results.products.total = products.length;

      products.forEach((product, index) => {
        if (!product.name_ar || typeof product.name_ar !== "string") {
          results.products.corrupted++;
          results.products.missing_fields.push(
            `Product ${index}: invalid name_ar`
          );
        }
        if (
          product.description_ar &&
          typeof product.description_ar !== "string"
        ) {
          results.products.corrupted++;
          results.products.missing_fields.push(
            `Product ${index}: invalid description_ar`
          );
        }
      });

      // فحص العملاء
      const customers = await this.getCustomers();
      results.customers.total = customers.length;

      customers.forEach((customer, index) => {
        if (!customer.name || typeof customer.name !== "string") {
          results.customers.corrupted++;
          results.customers.missing_fields.push(
            `Customer ${index}: invalid name`
          );
        }
      });

      // فحص الفئات
      const categories = await this.getCategories();
      results.categories.total = categories.length;

      console.log("📊 Database Integrity Report:", results);
      return results;
    } catch (error) {
      console.error("❌ Error during database diagnosis:", error);
      return { error: error.message };
    }
  }
}

// تصدير مثيل واحد للاستخدام في جميع أنحاء التطبيق
window.dbManager = new DatabaseManager();
