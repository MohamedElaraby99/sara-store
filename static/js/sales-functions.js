// Sales Functions - Sara Store
// This file contains all the JavaScript functions for the sales page

// Global variables
let currentSaleId = null;
let debounceTimer = null;

// Function to view sale details
function viewSaleDetails(saleId) {
  console.log("viewSaleDetails called with:", saleId);
  currentSaleId = saleId;
  const modal = new bootstrap.Modal(
    document.getElementById("saleDetailsModal")
  );
  const content = document.getElementById("saleDetailsContent");

  // Show loading
  content.innerHTML = `
    <div class="text-center">
        <div class="spinner-border" role="status">
            <span class="visually-hidden">جاري التحميل...</span>
        </div>
        <p class="mt-2">جاري تحميل تفاصيل البيع...</p>
    </div>
    `;

  modal.show();

  // Fetch sale details
  fetch(`/api/sales/${saleId}`)
    .then((response) => response.json())
    .then((sale) => {
      content.innerHTML = generateSaleDetailsHTML(sale);
    })
    .catch((error) => {
      content.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                حدث خطأ في تحميل تفاصيل البيع
            </div>
            `;
    });
}

// Function to print sale
function printSale(saleId) {
  console.log("printSale called with:", saleId);
  currentSaleId = saleId;
  printCurrentSale();
}

// Function to print current sale
function printCurrentSale() {
  if (!currentSaleId) return;

  // Create a new window for printing
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html dir="rtl">
    <head>
        <title>فاتورة كاشير رقم ${currentSaleId}</title>
        <meta charset="UTF-8">
        <style>
            * { box-sizing: border-box; }
            
            body { 
                font-family: 'Courier New', monospace; 
                margin: 0; 
                padding: 0;
                background: #fff;
                color: #000;
                line-height: 1.2;
                font-size: 12px;
            }
            
            .receipt-container {
                width: 80mm;
                max-width: 80mm;
                margin: 0 auto;
                background: white;
                padding: 5px;
                font-size: 12px;
            }
            
            .header {
                text-align: center;
                border-bottom: 1px dashed #000;
                padding: 5px 0;
                margin-bottom: 5px;
            }
            
            .store-name {
                font-size: 16px;
                font-weight: bold;
                margin: 0;
            }
            
            .store-address {
                font-size: 10px;
                margin: 2px 0;
            }
            
            .store-phone {
                font-size: 10px;
                margin: 2px 0;
            }
            
            .invoice-title {
                font-size: 14px;
                font-weight: bold;
                margin: 5px 0;
            }
            
            .invoice-info {
                border-bottom: 1px dashed #000;
                padding: 5px 0;
                margin-bottom: 5px;
            }
            
            .info-row {
                display: flex;
                justify-content: space-between;
                margin: 2px 0;
                font-size: 10px;
            }
            
            .items-section {
                margin: 5px 0;
            }
            
            .item-row {
                display: flex;
                justify-content: space-between;
                margin: 2px 0;
                font-size: 10px;
            }
            
            .item-name {
                flex: 2;
                text-align: right;
            }
            
            .item-qty {
                flex: 1;
                text-align: center;
            }
            
            .item-price {
                flex: 1;
                text-align: center;
            }
            
            .item-total {
                flex: 1;
                text-align: left;
            }
            
            .items-header {
                border-bottom: 1px solid #000;
                padding: 3px 0;
                margin-bottom: 3px;
                font-weight: bold;
                font-size: 10px;
            }
            
            .total-section {
                border-top: 1px dashed #000;
                padding: 5px 0;
                margin-top: 5px;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                margin: 2px 0;
                font-size: 11px;
            }
            
            .grand-total {
                font-size: 14px;
                font-weight: bold;
                border-top: 1px solid #000;
                padding-top: 3px;
                margin-top: 3px;
            }
            
            .footer {
                text-align: center;
                border-top: 1px dashed #000;
                padding: 5px 0;
                margin-top: 5px;
                font-size: 9px;
            }
            
            .payment-method {
                margin: 3px 0;
                font-size: 10px;
            }
            
            .thank-you {
                font-size: 11px;
                font-weight: bold;
                margin: 3px 0;
            }
            
            .validity {
                font-size: 8px;
                margin: 2px 0;
            }
            
            .no-print {
                position: fixed;
                bottom: 20px;
                right: 20px;
                display: flex;
                gap: 10px;
            }
            
            .no-print button {
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: 600;
                font-size: 12px;
            }
            
            .print-btn {
                background: #000;
                color: white;
            }
            
            .close-btn {
                background: #333;
                color: white;
            }
            
            @media print {
                body { 
                    background: white !important; 
                    padding: 0 !important; 
                    margin: 0 !important;
                }
                .no-print { display: none !important; }
                .receipt-container { 
                    width: 80mm !important;
                    max-width: 80mm !important;
                    margin: 0 !important;
                    padding: 2px !important;
                }
            }
        </style>
    </head>
    <body>
        <div class="receipt-container">
            <div id="receipt-content">
                <div style="text-align: center; padding: 20px;">
                    <p>جاري تحميل الفاتورة...</p>
                </div>
            </div>
        </div>
        <div class="no-print">
            <button class="print-btn" onclick="window.print()">طباعة</button>
            <button class="close-btn" onclick="window.close()">إغلاق</button>
        </div>
        
        <script>
            function printInvoice() {
                window.print();
            }
            
            window.onload = function() {
                console.log('نافذة فاتورة الكاشير محملة بنجاح');
            };
        </script>
    </body>
    </html>
    `);

  // Fetch and display invoice content
  fetch(`/api/sales/${currentSaleId}`)
    .then((response) => response.json())
    .then((sale) => {
      const content = generatePrintableInvoice(sale);
      printWindow.document.getElementById("receipt-content").innerHTML =
        content;
    })
    .catch((error) => {
      printWindow.document.getElementById("receipt-content").innerHTML = `
            <div style="text-align: center; padding: 50px; color: #dc3545;">
                <h3>❌ حدث خطأ في تحميل الفاتورة</h3>
                <p>يرجى المحاولة مرة أخرى</p>
            </div>
            `;
    });
}

// Function to generate sale details HTML
function generateSaleDetailsHTML(sale) {
  let itemsHTML = "";
  let total = 0;

  sale.items.forEach((item, index) => {
    const rowClass = index % 2 === 0 ? "table-light" : "";
    itemsHTML += `
        <tr class="${rowClass}">
            <td>
                <div class="d-flex align-items-center">
                    <i class="bi bi-box text-primary me-2"></i>
                    <div>
                        <div class="fw-bold">${item.product_name}</div>
                        <small class="text-muted">${
                          item.unit_type || "وحدة"
                        }</small>
                    </div>
                </div>
            </td>
            <td class="text-center">
                <span class="badge bg-info">${item.quantity}</span>
            </td>
            <td class="text-center text-primary fw-bold">${item.unit_price.toFixed(
              2
            )} ج.م</td>
            <td class="text-center text-success fw-bold">${item.total_price.toFixed(
              2
            )} ج.م</td>
        </tr>
        `;
    total += item.total_price;
  });

  const saleDate = sale.sale_date;
  const saleTime = sale.sale_time;
  const userBadge =
    sale.user_role === "admin"
      ? '<span class="badge bg-warning text-dark">مدير</span>'
      : '<span class="badge bg-info">بائع</span>';

  return `
    <div class="invoice-details">
        <div class="row mb-4">
            <div class="col-md-8">
                <div class="card border-primary">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0"><i class="bi bi-info-circle me-2"></i>معلومات البيع</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6">
                                <p class="mb-2">
                                    <i class="bi bi-hash text-primary me-2"></i>
                                    <strong>رقم البيع:</strong> 
                                    <span class="text-primary">#${
                                      sale.id
                                    }</span>
                                </p>
                                <p class="mb-2">
                                    <i class="bi bi-calendar3 text-success me-2"></i>
                                    <strong>التاريخ:</strong> 
                                    ${saleDate}
                                </p>
                            </div>
                            <div class="col-6">
                                <p class="mb-2">
                                    <i class="bi bi-clock text-warning me-2"></i>
                                    <strong>الوقت:</strong> 
                                    ${saleTime}
                                </p>
                                <p class="mb-2">
                                    <i class="bi bi-person text-info me-2"></i>
                                    <strong>البائع:</strong> 
                                    ${sale.user_name} ${userBadge}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card border-success">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0"><i class="bi bi-chat-dots me-2"></i>الملاحظات</h6>
                    </div>
                    <div class="card-body">
                        <p class="text-muted mb-0">
                            ${sale.notes || "<em>لا توجد ملاحظات</em>"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header bg-light">
                <h6 class="mb-0">
                    <i class="bi bi-list-ul me-2"></i>
                    تفاصيل الأصناف
                    <span class="badge bg-secondary ms-2">${
                      sale.items.length
                    } صنف</span>
                </h6>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-dark">
                            <tr>
                                <th><i class="bi bi-box me-1"></i>المنتج</th>
                                <th class="text-center"><i class="bi bi-123 me-1"></i>الكمية</th>
                                <th class="text-center"><i class="bi bi-currency-exchange me-1"></i>سعر الوحدة</th>
                                <th class="text-center"><i class="bi bi-calculator me-1"></i>الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHTML}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card-footer bg-light">
                <div class="row">
                    <div class="col-md-6">
                        <div class="d-flex justify-content-between mb-1">
                            <span class="text-muted">المجموع الفرعي:</span>
                            <span>${sale.subtotal.toFixed(2)} ج.م</span>
                        </div>
                        ${
                          sale.discount_amount > 0
                            ? `
                        <div class="d-flex justify-content-between mb-1">
                            <span class="text-warning">
                                <i class="bi bi-dash-circle me-1"></i>
                                الخصم (${
                                  sale.discount_type === "percentage"
                                    ? sale.discount_value + "%"
                                    : sale.discount_value + " ج.م"
                                }):
                            </span>
                            <span class="text-warning">${sale.discount_amount.toFixed(
                              2
                            )} ج.م</span>
                        </div>
                        `
                            : ""
                        }
                        <hr class="my-2">
                        <div class="d-flex justify-content-between">
                            <strong class="text-success">الإجمالي النهائي:</strong>
                            <strong class="text-success">${total.toFixed(
                              2
                            )} ج.م</strong>
                        </div>
                    </div>
                    <div class="col-md-6 text-center">
                        <div class="bg-success text-white p-3 rounded">
                            <h5 class="mb-0">
                                <i class="bi bi-cash-stack me-2"></i>
                                المجموع الكلي
                            </h5>
                            <h3 class="mb-0 fw-bold">${total.toFixed(
                              2
                            )} ج.م</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}

// Function to generate printable invoice
function generatePrintableInvoice(sale) {
  let itemsHTML = "";
  let total = 0;

  sale.items.forEach((item, index) => {
    itemsHTML += `
        <div class="item-row">
            <div class="item-name">${item.product_name}</div>
            <div class="item-qty">${item.quantity}</div>
            <div class="item-price">${item.unit_price.toFixed(2)}</div>
            <div class="item-total">${item.total_price.toFixed(2)}</div>
        </div>
        `;
    total += item.total_price;
  });

  const saleDate = sale.sale_date;
  const saleTime = sale.sale_time;

  return `
    <div class="header">
        <div class="store-name">Sara Store</div>
        <div class="store-address">منية النصر منتصف شارع المهندس</div>
        <div class="store-phone">01093126299</div>
        <div class="invoice-title">فاتورة ضريبية مبسطة</div>
    </div>

    <div class="invoice-info">
        <div class="info-row">
            <span>رقم البيع:</span>
            <span>#${sale.id}</span>
        </div>
        <div class="info-row">
            <span>التاريخ:</span>
            <span>${saleDate}</span>
        </div>
        <div class="info-row">
            <span>الوقت:</span>
            <span>${saleTime}</span>
        </div>
        <div class="info-row">
            <span>البائع:</span>
            <span>${sale.user_name}</span>
        </div>
    </div>

    <div class="items-section">
        <div class="items-header">
            <div class="item-row">
                <div class="item-name">المنتج</div>
                <div class="item-qty">الكمية</div>
                <div class="item-price">السعر</div>
                <div class="item-total">الإجمالي</div>
            </div>
        </div>
        ${itemsHTML}
    </div>

    <div class="total-section">
        <div class="total-row">
            <span>المجموع الفرعي:</span>
            <span>${sale.subtotal.toFixed(2)} ج.م</span>
        </div>
        ${
          sale.discount_amount > 0
            ? `
        <div class="total-row">
            <span>الخصم:</span>
            <span>-${sale.discount_amount.toFixed(2)} ج.م</span>
        </div>
        `
            : ""
        }
        <div class="total-row grand-total">
            <span>المجموع الكلي:</span>
            <span>${total.toFixed(2)} ج.م</span>
        </div>
    </div>

    <div class="footer">
        <div class="payment-method">تم الدفع نقداً</div>
        <div class="thank-you">شكراً لثقتكم بنا</div>
        <div class="validity">هذه الفاتورة صالحة لمدة 7 أياماً</div>
        <div class="validity">للاستفسارات: 01093126299</div>
    </div>
    `;
}

// Filter functions for sales page
function applyFilters() {
  console.log("applyFilters called");
  
  const form = document.getElementById('filterForm');
  if (!form) {
    console.error('Filter form not found');
    return;
  }
  
  const formData = new FormData(form);
  const params = new URLSearchParams();
  
  // Add all form data to params
  for (let [key, value] of formData.entries()) {
    if (value) {
      params.append(key, value);
    }
  }
  
  // Redirect to filtered sales page
  const currentUrl = window.location.pathname;
  const newUrl = `${currentUrl}?${params.toString()}`;
  window.location.href = newUrl;
}

function clearFilters() {
  console.log("clearFilters called");
  window.location.href = window.location.pathname;
}

function setTodayFilter() {
  console.log("setTodayFilter called");
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date_from').value = today;
  document.getElementById('date_to').value = today;
  applyFilters();
}

function setWeekFilter() {
  console.log("setWeekFilter called");
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  document.getElementById('date_from').value = startOfWeek.toISOString().split('T')[0];
  document.getElementById('date_to').value = today.toISOString().split('T')[0];
  applyFilters();
}

function setMonthFilter() {
  console.log("setMonthFilter called");
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  document.getElementById('date_from').value = startOfMonth.toISOString().split('T')[0];
  document.getElementById('date_to').value = today.toISOString().split('T')[0];
  applyFilters();
}

function debounceFilter() {
  console.log("debounceFilter called");
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    applyFilters();
  }, 500);
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("Sales functions loaded successfully");
  console.log("viewSaleDetails available:", typeof viewSaleDetails);
  console.log("printSale available:", typeof printSale);

  // Make functions globally available
  window.viewSaleDetails = viewSaleDetails;
  window.printSale = printSale;
  window.applyFilters = applyFilters;
  window.clearFilters = clearFilters;
  window.setTodayFilter = setTodayFilter;
  window.setWeekFilter = setWeekFilter;
  window.setMonthFilter = setMonthFilter;
  window.debounceFilter = debounceFilter;

  console.log("Functions made globally available");
});
