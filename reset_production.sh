#!/bin/bash

# سكريپت آمن لإعادة تعيين قاعدة البيانات في الإنتاج
# يتضمن تحذيرات متعددة وآليات أمان

set -e  # إيقاف السكريپت عند حدوث خطأ

# الألوان للعرض
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# دالة عرض الرسائل
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# التحقق من الصلاحيات
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "يتم تشغيل السكريپت بصلاحيات root - تأكد من الحذر"
    fi
}

# التحقق من البيئة
check_environment() {
    log_info "التحقق من البيئة..."
    
    # التحقق من وجود Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python3 غير موجود"
        exit 1
    fi
    
    # التحقق من وجود الملفات المطلوبة
    required_files=("app.py" "models.py" "reset_production_database.py")
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "الملف المطلوب غير موجود: $file"
            exit 1
        fi
    done
    
    # التحقق من متغيرات البيئة
    if [ -z "$FLASK_CONFIG" ]; then
        log_warning "متغير FLASK_CONFIG غير محدد - سيتم استخدام 'development'"
        export FLASK_CONFIG="development"
    fi
    
    log_info "البيئة الحالية: $FLASK_CONFIG"
}

# إنشاء نسخة احتياطية
create_backup() {
    log_info "إنشاء نسخة احتياطية..."
    
    backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # نسخ ملفات المشروع
    cp -r templates/ "$backup_dir/" 2>/dev/null || true
    cp -r static/ "$backup_dir/" 2>/dev/null || true
    cp *.py "$backup_dir/" 2>/dev/null || true
    cp requirements.txt "$backup_dir/" 2>/dev/null || true
    
    # إنشاء ملف معلومات النسخة الاحتياطية
    cat > "$backup_dir/backup_info.txt" << EOF
تاريخ النسخة الاحتياطية: $(date)
البيئة: $FLASK_CONFIG
المستخدم: $(whoami)
المجلد: $(pwd)
EOF
    
    log_success "تم إنشاء النسخة الاحتياطية في: $backup_dir"
    echo "$backup_dir"
}

# التحقق من اتصال قاعدة البيانات
test_database_connection() {
    log_info "اختبار اتصال قاعدة البيانات..."
    
    python3 -c "
from app import app
from models import db
try:
    with app.app_context():
        db.engine.execute('SELECT 1')
    print('✅ الاتصال بقاعدة البيانات ناجح')
except Exception as e:
    print(f'❌ فشل الاتصال بقاعدة البيانات: {e}')
    exit(1)
"
}

# تأكيد متعدد المراحل
confirm_reset() {
    echo
    echo -e "${RED}🚨 تحذير خطير! 🚨${NC}"
    echo "================================================"
    echo "هذا السكريپت سيقوم بـ:"
    echo "• حذف جميع البيانات في قاعدة البيانات"
    echo "• حذف جميع المنتجات والمبيعات"
    echo "• حذف جميع العملاء والفواتير"
    echo "• لا يمكن استرداد البيانات بعد الحذف!"
    echo "================================================"
    echo
    
    # التأكيد الأول
    read -p "هل أنت متأكد من المتابعة؟ اكتب 'نعم متأكد': " confirm1
    if [ "$confirm1" != "نعم متأكد" ]; then
        log_info "تم إلغاء العملية"
        exit 0
    fi
    
    # التأكيد الثاني
    echo
    echo -e "${YELLOW}البيئة الحالية: $FLASK_CONFIG${NC}"
    read -p "اكتب اسم البيئة للتأكيد: " env_confirm
    if [ "$env_confirm" != "$FLASK_CONFIG" ]; then
        log_error "اسم البيئة غير صحيح"
        exit 1
    fi
    
    # التأكيد النهائي
    echo
    echo -e "${RED}التأكيد النهائي!${NC}"
    read -p "اكتب 'RESET_NOW' للمتابعة: " final_confirm
    if [ "$final_confirm" != "RESET_NOW" ]; then
        log_info "تم إلغاء العملية"
        exit 0
    fi
    
    echo
    log_warning "سيتم بدء عملية إعادة التعيين خلال 5 ثوان..."
    sleep 5
}

# تشغيل عملية إعادة التعيين
run_reset() {
    log_info "بدء عملية إعادة تعيين قاعدة البيانات..."
    
    # تشغيل السكريپت Python
    if python3 reset_production_database.py; then
        log_success "تمت عملية إعادة التعيين بنجاح!"
        return 0
    else
        log_error "فشلت عملية إعادة التعيين"
        return 1
    fi
}

# اختبار النظام بعد إعادة التعيين
test_system() {
    log_info "اختبار النظام بعد إعادة التعيين..."
    
    python3 -c "
from app import app
from models import db, User, Category, Product

try:
    with app.app_context():
        # اختبار الجداول
        user_count = User.query.count()
        category_count = Category.query.count()
        product_count = Product.query.count()
        
        print(f'عدد المستخدمين: {user_count}')
        print(f'عدد الفئات: {category_count}')
        print(f'عدد المنتجات: {product_count}')
        
        if user_count > 0:
            print('✅ النظام يعمل بشكل صحيح')
        else:
            print('⚠️  تحذير: لا يوجد مستخدمين في النظام')
            
except Exception as e:
    print(f'❌ خطأ في اختبار النظام: {e}')
    exit(1)
"
}

# إعطاء تعليمات ما بعد إعادة التعيين
post_reset_instructions() {
    echo
    echo "================================================"
    log_success "تمت عملية إعادة تعيين قاعدة البيانات بنجاح!"
    echo "================================================"
    echo
    echo "📋 الخطوات التالية:"
    echo "1. تسجيل الدخول إلى النظام"
    echo "2. التحقق من المستخدمين والفئات"
    echo "3. استيراد المنتجات من ملف Excel"
    echo "4. اختبار وظائف النظام"
    echo "5. إنشاء نسخة احتياطية جديدة"
    echo
    echo "📁 مواقع مهمة:"
    echo "• ملفات السجل: $(ls -1 database_reset_*.log 2>/dev/null | tail -1 || echo 'غير متوفر')"
    echo "• النسخة الاحتياطية: $backup_location"
    echo
    echo "⚠️  تذكير:"
    echo "• اختبر جميع وظائف النظام قبل الاستخدام"
    echo "• تأكد من عمل النسخ الاحتياطي التلقائي"
    echo
}

# الدالة الرئيسية
main() {
    echo "🔄 سكريپت إعادة تعيين قاعدة البيانات - Sara Store"
    echo "================================================"
    
    # التحققات الأولية
    check_permissions
    check_environment
    test_database_connection
    
    # إنشاء نسخة احتياطية
    backup_location=$(create_backup)
    
    # طلب التأكيد
    confirm_reset
    
    # تشغيل عملية إعادة التعيين
    if run_reset; then
        test_system
        post_reset_instructions
        log_success "انتهت العملية بنجاح!"
        exit 0
    else
        log_error "فشلت العملية!"
        echo "يمكنك استعادة النسخة الاحتياطية من: $backup_location"
        exit 1
    fi
}

# التحقق من وجود معاملات
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "استخدام:"
    echo "  $0                 : تشغيل عملية إعادة التعيين التفاعلية"
    echo "  $0 --help         : عرض هذه المساعدة"
    echo "  $0 --test-only    : اختبار الاتصال فقط"
    echo
    echo "متغيرات البيئة المطلوبة:"
    echo "  FLASK_CONFIG      : بيئة التشغيل (production/development)"
    echo "  DATABASE_URL      : رابط قاعدة البيانات"
    exit 0
fi

if [ "$1" = "--test-only" ]; then
    check_environment
    test_database_connection
    log_success "الاختبار مكتمل"
    exit 0
fi

# تشغيل الدالة الرئيسية
main "$@" 