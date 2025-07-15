#!/usr/bin/env python3
"""
سكريبت لإعادة تعيين قاعدة البيانات في الإنتاج
يقوم بحذف جميع الجداول وإعادة إنشائها من الصفر

تحذير: هذا السكريپت سيمحو جميع البيانات!
استخدم بحذر شديد في الإنتاج
"""

import os
import sys
from datetime import datetime
import logging

# إضافة المجلد الحالي إلى path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import db, User, Category, Product, Customer, Sale, SaleItem, Payment, Expense, ShoppingList, Return, ReturnItem

# إعداد التسجيل
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'database_reset_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def confirm_reset():
    """تأكيد من المستخدم قبل المحو"""
    print("🚨 تحذير: هذا السكريپت سيمحو جميع البيانات في قاعدة البيانات!")
    print("=" * 60)
    
    # التحقق من البيئة
    config_name = os.environ.get('FLASK_CONFIG', 'development')
    print(f"البيئة الحالية: {config_name}")
    
    if config_name == 'development':
        print("⚠️  تحذير: يبدو أنك في بيئة التطوير")
    else:
        print(f"🔥 تحذير: أنت في بيئة الإنتاج ({config_name})")
    
    print("=" * 60)
    
    # طلب تأكيد متعدد المراحل
    confirmations = [
        "هل أنت متأكد من أنك تريد محو جميع البيانات؟ (اكتب 'نعم'): ",
        "هذا سيمحو جميع المنتجات والمبيعات والعملاء! (اكتب 'أفهم'): ",
        "لا يمكن استرداد البيانات بعد المحو! (اكتب 'موافق'): "
    ]
    
    expected_answers = ['نعم', 'أفهم', 'موافق']
    
    for i, confirmation in enumerate(confirmations):
        answer = input(confirmation).strip()
        if answer != expected_answers[i]:
            print("❌ تم إلغاء العملية")
            return False
    
    # تأكيد نهائي بكتابة اسم قاعدة البيانات
    db_name = app.config.get('DATABASE_URL', 'Unknown')
    print(f"\nكتأكيد نهائي، اكتب 'RESET_DATABASE' للمتابعة:")
    final_confirmation = input().strip()
    
    if final_confirmation != 'RESET_DATABASE':
        print("❌ تم إلغاء العملية")
        return False
    
    return True

def backup_critical_data():
    """نسخ احتياطي للبيانات المهمة (المستخدمين والإعدادات)"""
    try:
        logger.info("إنشاء نسخة احتياطية للبيانات المهمة...")
        
        backup_data = {
            'users': [],
            'categories': [],
            'timestamp': datetime.now().isoformat()
        }
        
        # نسخ احتياطي للمستخدمين
        users = User.query.all()
        for user in users:
            backup_data['users'].append({
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'password_hash': user.password_hash,
                'is_system': user.is_system
            })
        
        # نسخ احتياطي للفئات
        categories = Category.query.all()
        for category in categories:
            backup_data['categories'].append({
                'name_ar': category.name_ar,
                'description_ar': category.description_ar
            })
        
        # حفظ النسخة الاحتياطية
        import json
        backup_filename = f'backup_before_reset_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        with open(backup_filename, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"تم حفظ النسخة الاحتياطية في: {backup_filename}")
        return backup_data
        
    except Exception as e:
        logger.error(f"خطأ في إنشاء النسخة الاحتياطية: {str(e)}")
        return None

def drop_all_tables():
    """حذف جميع الجداول"""
    try:
        logger.info("بدء حذف جميع الجداول...")
        
        with app.app_context():
            # استخدام reflect للحصول على جميع الجداول
            db.reflect()
            
            # حذف جميع الجداول
            db.drop_all()
            
            # تأكيد الحذف
            db.session.commit()
            
        logger.info("✅ تم حذف جميع الجداول بنجاح")
        return True
        
    except Exception as e:
        logger.error(f"❌ خطأ في حذف الجداول: {str(e)}")
        return False

def create_all_tables():
    """إنشاء جميع الجداول من جديد"""
    try:
        logger.info("بدء إنشاء الجداول الجديدة...")
        
        with app.app_context():
            # إنشاء جميع الجداول
            db.create_all()
            
            # تأكيد الإنشاء
            db.session.commit()
            
        logger.info("✅ تم إنشاء جميع الجداول بنجاح")
        return True
        
    except Exception as e:
        logger.error(f"❌ خطأ في إنشاء الجداول: {str(e)}")
        return False

def restore_critical_data(backup_data):
    """استعادة البيانات المهمة من النسخة الاحتياطية"""
    if not backup_data:
        logger.warning("لا توجد نسخة احتياطية لاستعادة البيانات")
        return True
    
    try:
        logger.info("بدء استعادة البيانات المهمة...")
        
        with app.app_context():
            # استعادة الفئات أولاً
            logger.info("استعادة الفئات...")
            for cat_data in backup_data.get('categories', []):
                category = Category(
                    name_ar=cat_data['name_ar'],
                    description_ar=cat_data.get('description_ar', '')
                )
                db.session.add(category)
            
            # استعادة المستخدمين
            logger.info("استعادة المستخدمين...")
            for user_data in backup_data.get('users', []):
                user = User(
                    username=user_data['username'],
                    email=user_data.get('email'),
                    role=user_data['role'],
                    is_system=user_data.get('is_system', False)
                )
                user.password_hash = user_data['password_hash']
                db.session.add(user)
            
            db.session.commit()
            
        logger.info("✅ تم استعادة البيانات المهمة بنجاح")
        return True
        
    except Exception as e:
        logger.error(f"❌ خطأ في استعادة البيانات: {str(e)}")
        return False

def create_default_data():
    """إنشاء البيانات الافتراضية"""
    try:
        logger.info("إنشاء البيانات الافتراضية...")
        
        with app.app_context():
            # إنشاء المستخدم الثابت إذا لم يكن موجوداً
            from models import create_static_user
            create_static_user()
            
            # إنشاء فئات افتراضية إذا لم تكن موجودة
            default_categories = [
                {'name': 'قرطاسية', 'desc': 'أدوات مكتبية وقرطاسية'},
                {'name': 'كتب', 'desc': 'كتب ومراجع'},
                {'name': 'أخرى', 'desc': 'منتجات متنوعة'}
            ]
            
            for cat_info in default_categories:
                existing_category = Category.query.filter_by(name_ar=cat_info['name']).first()
                if not existing_category:
                    category = Category(
                        name_ar=cat_info['name'],
                        description_ar=cat_info['desc']
                    )
                    db.session.add(category)
            
            db.session.commit()
            
        logger.info("✅ تم إنشاء البيانات الافتراضية بنجاح")
        return True
        
    except Exception as e:
        logger.error(f"❌ خطأ في إنشاء البيانات الافتراضية: {str(e)}")
        return False

def verify_database():
    """التحقق من سلامة قاعدة البيانات"""
    try:
        logger.info("التحقق من سلامة قاعدة البيانات...")
        
        with app.app_context():
            # التحقق من الجداول
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            
            expected_tables = [
                'user', 'category', 'product', 'customer', 'sale', 
                'sale_item', 'payment', 'expense', 'shopping_list',
                'return_transaction', 'return_item'
            ]
            
            missing_tables = [t for t in expected_tables if t not in tables]
            if missing_tables:
                logger.error(f"جداول مفقودة: {missing_tables}")
                return False
            
            # التحقق من وجود بيانات أساسية
            user_count = User.query.count()
            category_count = Category.query.count()
            
            logger.info(f"عدد المستخدمين: {user_count}")
            logger.info(f"عدد الفئات: {category_count}")
            
            if user_count == 0:
                logger.warning("لا يوجد مستخدمين في النظام!")
            
            if category_count == 0:
                logger.warning("لا توجد فئات في النظام!")
            
        logger.info("✅ تم التحقق من قاعدة البيانات بنجاح")
        return True
        
    except Exception as e:
        logger.error(f"❌ خطأ في التحقق من قاعدة البيانات: {str(e)}")
        return False

def main():
    """الدالة الرئيسية"""
    print("🔄 سكريپت إعادة تعيين قاعدة البيانات في الإنتاج")
    print("=" * 60)
    
    # التأكد من البيئة
    config_name = os.environ.get('FLASK_CONFIG', 'development')
    print(f"البيئة الحالية: {config_name}")
    
    # طلب التأكيد
    if not confirm_reset():
        print("تم إلغاء العملية بواسطة المستخدم")
        sys.exit(0)
    
    logger.info("بدء عملية إعادة تعيين قاعدة البيانات...")
    
    # الخطوة 1: النسخ الاحتياطي
    backup_data = backup_critical_data()
    
    # الخطوة 2: حذف الجداول
    if not drop_all_tables():
        logger.error("فشل في حذف الجداول")
        sys.exit(1)
    
    # الخطوة 3: إنشاء الجداول الجديدة
    if not create_all_tables():
        logger.error("فشل في إنشاء الجداول الجديدة")
        sys.exit(1)
    
    # الخطوة 4: استعادة البيانات المهمة
    if not restore_critical_data(backup_data):
        logger.error("فشل في استعادة البيانات المهمة")
        # المتابعة مع إنشاء بيانات افتراضية
    
    # الخطوة 5: إنشاء البيانات الافتراضية
    if not create_default_data():
        logger.error("فشل في إنشاء البيانات الافتراضية")
        sys.exit(1)
    
    # الخطوة 6: التحقق من السلامة
    if not verify_database():
        logger.error("فشل في التحقق من سلامة قاعدة البيانات")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("🎉 تم إعادة تعيين قاعدة البيانات بنجاح!")
    print("=" * 60)
    print("📝 ملاحظات مهمة:")
    print("• تم إنشاء نسخة احتياطية من المستخدمين والفئات")
    print("• جميع المبيعات والمنتجات السابقة تم حذفها")
    print("• يمكنك الآن استيراد المنتجات من ملف Excel")
    print("• تأكد من اختبار النظام قبل الاستخدام")
    print("=" * 60)
    
    logger.info("انتهت عملية إعادة تعيين قاعدة البيانات بنجاح")

if __name__ == "__main__":
    main()