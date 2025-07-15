#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
ملف إعادة تعيين قاعدة البيانات بالكامل
Reset Database Script - حذف جميع البيانات وإعادة إنشاء الجداول مع المستخدمين الأساسيين
"""

import os
import sys
from datetime import datetime

# إضافة مسار التطبيق الحالي للوصول إلى الموديولات
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User, Category, Product, Customer, Sale, SaleItem, Payment, Expense, ShoppingList

def reset_database():
    """إعادة تعيين قاعدة البيانات بالكامل"""
    
    print("🗑️  بدء عملية إعادة تعيين قاعدة البيانات...")
    
    try:
        with app.app_context():
            # حذف جميع الجداول
            print("📤 حذف جميع الجداول الموجودة...")
            db.drop_all()
            
            # إنشاء جميع الجداول من جديد
            print("📥 إنشاء جداول قاعدة البيانات...")
            db.create_all()
            
            # إنشاء المستخدمين الأساسيين
            print("👥 إنشاء المستخدمين الأساسيين...")
            create_default_users()
            
            # إنشاء بيانات تجريبية أساسية (اختياري)
            create_basic_categories()
            
            print("✅ تم إعادة تعيين قاعدة البيانات بنجاح!")
            print("\n📋 تفاصيل المستخدمين المتاحين:")
            list_users()
            
    except Exception as e:
        print(f"❌ خطأ في إعادة تعيين قاعدة البيانات: {str(e)}")
        return False
    
    return True

def create_default_users():
    """إنشاء المستخدمين الافتراضيين"""
    
    # مستخدم النظام المخفي
    system_user = User(
        username='araby',
        email='system@library.com',
        role='admin',
        is_system=True,
        is_active=True,
        is_verified=True
    )
    system_user.set_password('92321066')
    
    # مستخدم الإدارة
    admin_user = User(
        username='admin',
        email='admin@library.com',
        role='admin',
        is_system=False,
        is_active=True,
        is_verified=True
    )
    admin_user.set_password('admin123')
    
    # مستخدم البائع
    seller_user = User(
        username='seller',
        email='seller@library.com',
        role='seller',
        is_system=False,
        is_active=True,
        is_verified=True
    )
    seller_user.set_password('seller123')
    
    # إضافة المستخدمين إلى قاعدة البيانات
    try:
        db.session.add(system_user)
        db.session.add(admin_user)
        db.session.add(seller_user)
        db.session.commit()
        print("   ✓ تم إنشاء المستخدمين بنجاح")
    except Exception as e:
        db.session.rollback()
        print(f"   ❌ خطأ في إنشاء المستخدمين: {str(e)}")
        raise

def create_basic_categories():
    """إنشاء فئات أساسية للمنتجات"""
    
    basic_categories = [
        {'name_ar': 'كتب دراسية', 'description_ar': 'الكتب والمناهج الدراسية'},
        {'name_ar': 'قرطاسية', 'description_ar': 'الأدوات المكتبية والقرطاسية'},
        {'name_ar': 'أدوات كتابة', 'description_ar': 'أقلام ومساطر وأدوات الكتابة'},
    ]
    
    try:
        for cat_data in basic_categories:
            category = Category(**cat_data)
            db.session.add(category)
        
        db.session.commit()
        print("   ✓ تم إنشاء الفئات الأساسية")
    except Exception as e:
        db.session.rollback()
        print(f"   ❌ خطأ في إنشاء الفئات: {str(e)}")

def list_users():
    """عرض قائمة المستخدمين المتاحين"""
    
    try:
        users = User.query.all()
        for user in users:
            print(f"   👤 {user.username} - {user.role} - {'نشط' if user.is_active else 'غير نشط'}")
            if user.username == 'araby':
                print(f"      🔐 كلمة المرور: 92321066")
            elif user.username == 'admin':
                print(f"      🔐 كلمة المرور: admin123")
            elif user.username == 'seller':
                print(f"      🔐 كلمة المرور: seller123")
    except Exception as e:
        print(f"   ❌ خطأ في عرض المستخدمين: {str(e)}")

def backup_current_database():
    """إنشاء نسخة احتياطية من قاعدة البيانات الحالية"""
    
    import shutil
    
    db_files = ['instance/library.db', 'instance/library_dev.db']
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    for db_file in db_files:
        if os.path.exists(db_file):
            backup_file = f"{db_file}.backup_{timestamp}"
            try:
                shutil.copy2(db_file, backup_file)
                print(f"   💾 تم إنشاء نسخة احتياطية: {backup_file}")
            except Exception as e:
                print(f"   ⚠️  فشل في إنشاء نسخة احتياطية لـ {db_file}: {str(e)}")

if __name__ == '__main__':
    print("🚨 تحذير: هذا الأمر سيحذف جميع البيانات الموجودة في قاعدة البيانات!")
    
    # طلب تأكيد من المستخدم
    confirm = input("هل أنت متأكد من أنك تريد المتابعة؟ اكتب 'نعم' للتأكيد: ").strip()
    
    if confirm.lower() in ['نعم', 'yes', 'y']:
        # إنشاء نسخة احتياطية قبل الحذف
        print("💾 إنشاء نسخة احتياطية...")
        backup_current_database()
        
        # إعادة تعيين قاعدة البيانات
        if reset_database():
            print("\n🎉 تمت العملية بنجاح! يمكنك الآن تشغيل التطبيق.")
        else:
            print("\n💥 فشلت العملية. يرجى التحقق من الأخطاء أعلاه.")
    else:
        print("❌ تم إلغاء العملية.") 