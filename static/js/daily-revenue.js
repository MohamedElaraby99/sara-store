/**
 * Daily Revenue Management JavaScript
 * إدارة الإيرادات اليومية
 */

// Global variables
let currentRevenueData = [];

/**
 * Load daily revenue data from API
 */
function loadDailyRevenue() {
    console.log('loadDailyRevenue called');
    
    const dateFromInput = document.getElementById('revenue_date_from');
    const dateToInput = document.getElementById('revenue_date_to');
    
    if (!dateFromInput || !dateToInput) {
        console.error('Revenue date inputs not found');
        showRevenueMessage('خطأ في العثور على فلاتر التاريخ');
        return;
    }
    
    const dateFrom = dateFromInput.value;
    const dateTo = dateToInput.value;
    
    console.log('Date range:', { dateFrom, dateTo });
    
    if (!dateFrom && !dateTo) {
        showRevenueMessage('اختر فترة زمنية لعرض الإيرادات');
        return;
    }

    // Show loading
    const loadingElement = document.getElementById('revenueLoading');
    const summaryElement = document.getElementById('revenueSummary');
    
    if (loadingElement) loadingElement.style.display = 'block';
    if (summaryElement) summaryElement.style.display = 'none';
    
    // Build URL
    let url = '/api/sales/daily-revenue?';
    if (dateFrom) url += `date_from=${dateFrom}&`;
    if (dateTo) url += `date_to=${dateTo}`;
    
    console.log('Fetching from URL:', url);

    fetch(url)
        .then(response => {
            console.log('Response status:', response.status);
            return response.json().then(data => {
                return { status: response.status, data: data };
            });
        })
        .then(result => {
            console.log('API response:', result);
            
            if (loadingElement) loadingElement.style.display = 'none';
            
            if (result.status === 200 && result.data.success) {
                currentRevenueData = result.data.data;
                displayDailyRevenue(result.data.data);
                updateRevenueSummary(result.data.data);
            } else if (result.status === 400) {
                // خطأ في الطلب (مثل تاريخ في المستقبل)
                showRevenueMessage('خطأ في البيانات: ' + (result.data.error || 'تاريخ غير صحيح'));
            } else if (result.status === 500) {
                // خطأ في الخادم
                showRevenueMessage('خطأ في الخادم: ' + (result.data.error || 'حدث خطأ غير متوقع'));
            } else {
                showRevenueMessage('حدث خطأ في تحميل البيانات: ' + (result.data.error || 'خطأ غير معروف'));
            }
        })
        .catch(error => {
            console.error('Error loading daily revenue:', error);
            if (loadingElement) loadingElement.style.display = 'none';
            showRevenueMessage('حدث خطأ في الاتصال: ' + error.message);
        });
}

/**
 * Display daily revenue data in table
 */
function displayDailyRevenue(data) {
    const tbody = document.getElementById('dailyRevenueBody');
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    <i class="bi bi-calendar-x"></i>
                    لا توجد بيانات إيرادات للفترة المحددة
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map((day, index) => `
        <tr class="revenue-row fade-in-up" onclick="viewDaySales('${day.date}')" style="cursor: pointer; animation-delay: ${index * 0.1}s;">
            <td>
                <strong>${day.date_ar}</strong>
            </td>
            <td>
                <span class="badge bg-primary">${day.sales_count} عملية</span>
            </td>
            <td class="text-success fw-bold">
                ${formatCurrency(day.total_revenue)}
            </td>
            <td class="text-warning">
                ${formatCurrency(day.total_discounts)}
            </td>
            <td class="text-info">
                ${formatCurrency(day.avg_sale)}
            </td>
            <td class="text-success fw-bold">
                ${formatCurrency(day.net_revenue)}
            </td>
            <td onclick="event.stopPropagation()">
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-success" 
                            onclick="viewDaySales('${day.date}')" title="عرض مبيعات اليوم">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button type="button" class="btn btn-outline-info" 
                            onclick="exportDaySales('${day.date}')" title="تصدير مبيعات اليوم">
                        <i class="bi bi-download"></i>
                    </button>
                    <button type="button" class="btn btn-outline-warning" 
                            onclick="showDayChart('${day.date}')" title="رسم بياني لليوم">
                        <i class="bi bi-graph-up"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Update revenue summary cards
 */
function updateRevenueSummary(data) {
    if (data.length === 0) {
        document.getElementById('revenueSummary').style.display = 'none';
        return;
    }

    const totalDays = data.length;
    const totalRevenue = data.reduce((sum, day) => sum + day.total_revenue, 0);
    const totalDiscounts = data.reduce((sum, day) => sum + day.total_discounts, 0);
    const netRevenue = data.reduce((sum, day) => sum + day.net_revenue, 0);
    const totalSales = data.reduce((sum, day) => sum + day.sales_count, 0);

    document.getElementById('totalDays').textContent = totalDays;
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('totalDiscounts').textContent = formatCurrency(totalDiscounts);
    document.getElementById('netRevenue').textContent = formatCurrency(netRevenue);
    
    // Show summary with animation
    const summaryElement = document.getElementById('revenueSummary');
    summaryElement.style.display = 'block';
    summaryElement.classList.add('fade-in-up');
    
    // Add animation to individual cards
    const cards = summaryElement.querySelectorAll('.revenue-summary-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in-up');
    });
}

/**
 * Show message in revenue table
 */
function showRevenueMessage(message) {
    const tbody = document.getElementById('dailyRevenueBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center text-muted">
                <i class="bi bi-info-circle"></i>
                ${message}
            </td>
        </tr>
    `;
}

/**
 * Format currency for display
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 2
    }).format(amount);
}

/**
 * Set date range to today
 */
function setRevenueToday() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('revenue_date_from').value = today;
    document.getElementById('revenue_date_to').value = today;
    loadDailyRevenue();
}

/**
 * Set date range to this week
 */
function setRevenueWeek() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    document.getElementById('revenue_date_from').value = startOfWeek.toISOString().split('T')[0];
    document.getElementById('revenue_date_to').value = today.toISOString().split('T')[0];
    loadDailyRevenue();
}

/**
 * Set date range to this month
 */
function setRevenueMonth() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    document.getElementById('revenue_date_from').value = startOfMonth.toISOString().split('T')[0];
    document.getElementById('revenue_date_to').value = today.toISOString().split('T')[0];
    loadDailyRevenue();
}

/**
 * Clear revenue filters
 */
function clearRevenueFilters() {
    document.getElementById('revenue_date_from').value = '';
    document.getElementById('revenue_date_to').value = '';
    document.getElementById('revenueSummary').style.display = 'none';
    showRevenueMessage('اختر فترة زمنية لعرض الإيرادات');
}

/**
 * View sales for a specific day
 */
function viewDaySales(date) {
    // Set the main sales filters to show sales for this specific day
    const dateFromInput = document.getElementById('date_from');
    const dateToInput = document.getElementById('date_to');
    
    if (dateFromInput && dateToInput) {
        dateFromInput.value = date;
        dateToInput.value = date;
        
        // Apply the filters to the main sales table
        if (typeof applyFilters === 'function') {
            applyFilters();
        } else {
            // Fallback: manually submit the form
            const form = document.getElementById('filterForm');
            if (form) {
                form.submit();
            } else {
                // Last resort: redirect with parameters
                const currentUrl = window.location.pathname;
                const newUrl = `${currentUrl}?date_from=${date}&date_to=${date}`;
                window.location.href = newUrl;
            }
        }
        
        // Scroll to the sales table
        const salesTable = document.querySelector('.card:last-child');
        if (salesTable) {
            salesTable.scrollIntoView({ behavior: 'smooth' });
        }
    } else {
        console.error('Date filter inputs not found');
        showToast('خطأ في العثور على فلاتر التاريخ', 'error');
    }
}

/**
 * Export sales for a specific day
 */
function exportDaySales(date) {
    try {
        // Create a link to export sales for this specific day
        const url = `/api/export/sales?date_from=${date}&date_to=${date}`;
        const link = document.createElement('a');
        link.href = url;
        link.download = `sales_${date}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        showToast('تم تصدير مبيعات اليوم بنجاح', 'success');
    } catch (error) {
        console.error('Error exporting day sales:', error);
        showToast('حدث خطأ في تصدير البيانات', 'error');
    }
}

/**
 * Show chart for a specific day
 */
function showDayChart(date) {
    // Find the day data
    const dayData = currentRevenueData.find(day => day.date === date);
    if (!dayData) {
        showToast('لا توجد بيانات للرسم البياني', 'warning');
        return;
    }
    
    // Create a simple chart modal
    const modalHtml = `
        <div class="modal fade" id="dayChartModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-graph-up"></i>
                            إحصائيات ${dayData.date_ar}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <h6>عدد المبيعات</h6>
                                        <h3 class="text-primary">${dayData.sales_count}</h3>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <h6>متوسط البيع</h6>
                                        <h3 class="text-info">${formatCurrency(dayData.avg_sale)}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-4">
                                <div class="card bg-success text-white">
                                    <div class="card-body text-center">
                                        <h6>إجمالي الإيرادات</h6>
                                        <h4>${formatCurrency(dayData.total_revenue)}</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card bg-warning text-dark">
                                    <div class="card-body text-center">
                                        <h6>إجمالي الخصومات</h6>
                                        <h4>${formatCurrency(dayData.total_discounts)}</h4>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card bg-info text-white">
                                    <div class="card-body text-center">
                                        <h6>صافي الإيرادات</h6>
                                        <h4>${formatCurrency(dayData.net_revenue)}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                        <button type="button" class="btn btn-primary" onclick="viewDaySales('${date}')">
                            <i class="bi bi-eye"></i>
                            عرض المبيعات
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('dayChartModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('dayChartModal'));
    modal.show();
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Create toast element
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'info'} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    // Add toast to container
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Show toast
    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Remove toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

/**
 * Create toast container if it doesn't exist
 */
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

/**
 * Initialize daily revenue functionality
 */
function initDailyRevenue() {
    console.log('Initializing daily revenue functionality...');
    
    // Set default date range to last 7 days (ensure dates are not in future)
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    
    // Ensure dates are not in the future
    const maxDate = new Date();
    if (today > maxDate) {
        today.setTime(maxDate.getTime());
    }
    if (weekAgo > maxDate) {
        weekAgo.setTime(maxDate.getTime() - (7 * 24 * 60 * 60 * 1000));
    }
    
    const dateFromInput = document.getElementById('revenue_date_from');
    const dateToInput = document.getElementById('revenue_date_to');
    
    if (dateFromInput && dateToInput) {
        console.log('Revenue date inputs found, setting default values...');
        dateFromInput.value = weekAgo.toISOString().split('T')[0];
        dateToInput.value = today.toISOString().split('T')[0];
        
        // Load revenue data
        console.log('Loading daily revenue data...');
        loadDailyRevenue();
    } else {
        console.error('Revenue date inputs not found');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initDailyRevenue();
});

// Export functions for global use
window.loadDailyRevenue = loadDailyRevenue;
window.displayDailyRevenue = displayDailyRevenue;
window.updateRevenueSummary = updateRevenueSummary;
window.showRevenueMessage = showRevenueMessage;
window.formatCurrency = formatCurrency;
window.setRevenueToday = setRevenueToday;
window.setRevenueWeek = setRevenueWeek;
window.setRevenueMonth = setRevenueMonth;
window.clearRevenueFilters = clearRevenueFilters;
window.viewDaySales = viewDaySales;
window.exportDaySales = exportDaySales;
window.showDayChart = showDayChart;
window.showToast = showToast; 