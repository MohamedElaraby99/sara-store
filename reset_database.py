#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
سكريبت إعادة تعيين قاعدة البيانات
Database Reset Script

هذا السكريبت يقوم بحذف جميع البيانات من قاعدة البيانات وإعادة إنشائها من جديد
كما لو كانت قاعدة بيانات جديدة تماماً.

⚠️ تحذير: هذا السكريبت سيحذف جميع البيانات الموجودة!
"""

import os
import sys
import sqlite3
from datetime import datetime

def print_banner():
    """طباعة شعار السكريبت"""
    print("=" * 60)
    print("🔄 سكريبت إعادة تعيين قاعدة البيانات")
    print("🔄 Database Reset Script")
    print("=" * 60)
    print()

def confirm_reset():
    """طلب تأكيد من المستخدم"""
    print("⚠️  تحذير: هذا السكريبت سيحذف جميع البيانات من قاعدة البيانات!")
    print("⚠️  Warning: This script will delete ALL data from the database!")
    print()
    
    while True:
        confirm = input("هل أنت متأكد من أنك تريد المتابعة؟ (نعم/لا): ").strip().lower()
        if confirm in ['نعم', 'yes', 'y', 'ن']:
            return True
        elif confirm in ['لا', 'no', 'n', 'ل']:
            return False
        else:
            print("يرجى الإجابة بـ 'نعم' أو 'لا'")

def get_database_path():
    """الحصول على مسار قاعدة البيانات"""
    # البحث عن ملف قاعدة البيانات
    possible_paths = [
        'sara.db',
        'instance/sara.db',
        'instance/database.db',
        'database.db',
        'app.db',
        'sara_store.db'
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    return None

def backup_database(db_path):
    """إنشاء نسخة احتياطية من قاعدة البيانات"""
    if not os.path.exists(db_path):
        print("❌ قاعدة البيانات غير موجودة!")
        return False
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"backup_database_{timestamp}.db"
    
    try:
        import shutil
        shutil.copy2(db_path, backup_path)
        print(f"✅ تم إنشاء نسخة احتياطية: {backup_path}")
        return True
    except Exception as e:
        print(f"❌ فشل في إنشاء النسخة الاحتياطية: {e}")
        return False

def reset_database(db_path):
    """إعادة تعيين قاعدة البيانات"""
    try:
        # الاتصال بقاعدة البيانات
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔄 جاري حذف جميع الجداول...")
        
        # الحصول على قائمة جميع الجداول
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
            # حذف جميع الجداول
        for table in tables:
            table_name = table[0]
            if table_name != 'sqlite_sequence':  # تجاهل جدول التسلسل
                print(f"   حذف جدول: {table_name}")
                cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
        
        # حذف جميع الفهارس
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index';")
        indexes = cursor.fetchall()
        
        for index in indexes:
            index_name = index[0]
            if not index_name.startswith('sqlite_autoindex_'):  # تجاهل الفهارس التلقائية
                print(f"   حذف فهرس: {index_name}")
                cursor.execute(f"DROP INDEX IF EXISTS {index_name}")
        
        # حذف جميع المشاهدات
        cursor.execute("SELECT name FROM sqlite_master WHERE type='view';")
        views = cursor.fetchall()
        
        for view in views:
            view_name = view[0]
            print(f"   حذف مشهد: {view_name}")
            cursor.execute(f"DROP VIEW IF EXISTS {view_name}")
        
        # حذف جميع المحفزات
        cursor.execute("SELECT name FROM sqlite_master WHERE type='trigger';")
        triggers = cursor.fetchall()
        
        for trigger in triggers:
            trigger_name = trigger[0]
            print(f"   حذف محفز: {trigger_name}")
            cursor.execute(f"DROP TRIGGER IF EXISTS {trigger_name}")
        
        # حفظ التغييرات
        conn.commit()
        conn.close()
        
        print("✅ تم حذف جميع الجداول بنجاح!")
        return True
            
    except Exception as e:
        print(f"❌ فشل في حذف الجداول: {e}")
        return False
    
def recreate_database():
    """إعادة إنشاء قاعدة البيانات باستخدام Flask"""
    try:
        print("🔄 جاري إعادة إنشاء قاعدة البيانات...")
        
        # استيراد التطبيق
        from app import app, db
        
        with app.app_context():
            # إنشاء جميع الجداول
            db.create_all()
            print("✅ تم إنشاء جميع الجداول بنجاح!")
            
            # إنشاء المستخدم الافتراضي
            from models import User
            from werkzeug.security import generate_password_hash
            
            # التحقق من وجود المستخدم الافتراضي
            admin_user = User.query.filter_by(username='admin').first()
            if not admin_user:
    admin_user = User(
        username='admin',
                    email='admin@sarastore.com',
                    password_hash=generate_password_hash('admin123'),
        role='admin',
        is_active=True,
        is_verified=True
    )
                db.session.add(admin_user)
                db.session.commit()
                print("✅ تم إنشاء المستخدم الافتراضي (admin/admin123)")
            else:
                print("ℹ️  المستخدم الافتراضي موجود بالفعل")
            
            return True
            
    except Exception as e:
        print(f"❌ فشل في إعادة إنشاء قاعدة البيانات: {e}")
        return False

def main():
    """الدالة الرئيسية"""
    print_banner()
    
    # البحث عن قاعدة البيانات
    db_path = get_database_path()
    if not db_path:
        print("❌ لم يتم العثور على قاعدة البيانات!")
        print("تأكد من وجود ملف قاعدة البيانات في أحد المسارات التالية:")
        print("  - sara.db")
        print("  - instance/sara.db")
        print("  - instance/database.db")
        print("  - database.db")
        print("  - app.db")
        print("  - sara_store.db")
        return
    
    print(f"📁 تم العثور على قاعدة البيانات: {db_path}")
    print()
    
    # طلب التأكيد
    if not confirm_reset():
        print("❌ تم إلغاء العملية.")
        return
    
    print()
    
    # إنشاء نسخة احتياطية
    print("📦 إنشاء نسخة احتياطية...")
    backup_database(db_path)
    print()
    
    # حذف البيانات
    print("🗑️  حذف البيانات...")
    if not reset_database(db_path):
        print("❌ فشل في حذف البيانات!")
        return
    print()
    
    # إعادة إنشاء قاعدة البيانات
    print("🔨 إعادة إنشاء قاعدة البيانات...")
    if not recreate_database():
        print("❌ فشل في إعادة إنشاء قاعدة البيانات!")
        return
    print()
    
    print("=" * 60)
    print("🎉 تم إعادة تعيين قاعدة البيانات بنجاح!")
    print("🎉 Database reset completed successfully!")
    print("=" * 60)
    print()
    print("📋 ملاحظات مهمة:")
    print("   - تم إنشاء نسخة احتياطية من البيانات القديمة")
    print("   - تم إنشاء مستخدم افتراضي: admin/admin123")
    print("   - يمكنك الآن إضافة المنتجات والعملاء من جديد")
    print()
    print("📋 Important Notes:")
    print("   - A backup of old data has been created")
    print("   - Default user created: admin/admin123")
    print("   - You can now add products and customers again")

if __name__ == "__main__":
    main() 