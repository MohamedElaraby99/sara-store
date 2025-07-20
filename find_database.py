#!/usr/bin/env python3
"""
سكريبت للبحث عن قاعدة البيانات على السيرفر
"""

import os
import glob
import sqlite3

def find_database():
    """البحث عن قاعدة البيانات"""
    
    print("🔍 البحث عن قاعدة البيانات...")
    
    # مسارات محتملة لقاعدة البيانات
    search_paths = [
        '.',  # المجلد الحالي
        '..',  # المجلد الأب
        'instance',
        '../instance',
        '/sarastore',
        '/sarastore/sara-store',
        '/sarastore/sara-store/instance',
        '/app',
        '/app/instance',
        '/var/www',
        '/home',
        '/root'
    ]
    
    # أنماط ملفات قاعدة البيانات
    db_patterns = [
        '*.db',
        '*store*.db',
        '*sara*.db',
        '*.sqlite',
        '*.sqlite3'
    ]
    
    found_databases = []
    
    for search_path in search_paths:
        if os.path.exists(search_path):
            print(f"🔍 فحص: {search_path}")
            
            for pattern in db_patterns:
                try:
                    files = glob.glob(os.path.join(search_path, pattern))
                    for file_path in files:
                        if os.path.isfile(file_path):
                            # التحقق من أن الملف هو قاعدة بيانات SQLite
                            try:
                                conn = sqlite3.connect(file_path)
                                cursor = conn.cursor()
                                
                                # التحقق من وجود جدول return_transaction
                                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='return_transaction'")
                                if cursor.fetchone():
                                    found_databases.append(file_path)
                                    print(f"✅ تم العثور على قاعدة البيانات: {file_path}")
                                
                                conn.close()
                            except:
                                pass  # ليس ملف SQLite صالح
                except:
                    pass  # خطأ في الوصول للمجلد
    
    return found_databases

def check_database_structure(db_path):
    """فحص هيكل قاعدة البيانات"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # فحص جداول قاعدة البيانات
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        print(f"\n📋 جداول قاعدة البيانات في {db_path}:")
        for table in tables:
            print(f"  - {table[0]}")
        
        # فحص هيكل جدول return_transaction
        if any('return_transaction' in table for table in tables):
            cursor.execute("PRAGMA table_info(return_transaction)")
            columns = cursor.fetchall()
            
            print(f"\n📋 هيكل جدول return_transaction:")
            for column in columns:
                print(f"  - {column[1]} ({column[2]})")
            
            # التحقق من وجود عمود refund_amount
            column_names = [column[1] for column in columns]
            if 'refund_amount' in column_names:
                print("✅ عمود refund_amount موجود")
            else:
                print("❌ عمود refund_amount غير موجود")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ خطأ في فحص قاعدة البيانات: {e}")

if __name__ == "__main__":
    print("🚀 بدء البحث عن قاعدة البيانات...")
    print("=" * 60)
    
    databases = find_database()
    
    if databases:
        print(f"\n✅ تم العثور على {len(databases)} قاعدة بيانات:")
        for i, db_path in enumerate(databases, 1):
            print(f"{i}. {db_path}")
            check_database_structure(db_path)
    else:
        print("\n❌ لم يتم العثور على أي قاعدة بيانات")
        print("\n💡 اقتراحات:")
        print("1. تأكد من أن قاعدة البيانات موجودة")
        print("2. تحقق من صلاحيات الوصول للملفات")
        print("3. ابحث يدوياً عن ملف .db في المجلدات")
        
        # البحث في المجلد الحالي
        print(f"\n🔍 البحث في المجلد الحالي ({os.getcwd()}):")
        try:
            files = os.listdir('.')
            db_files = [f for f in files if f.endswith('.db') or 'store' in f.lower()]
            if db_files:
                print("الملفات المحتملة:")
                for f in db_files:
                    print(f"  - {f}")
            else:
                print("لا توجد ملفات قاعدة بيانات محتملة")
        except Exception as e:
            print(f"خطأ في قراءة المجلد: {e}")
    
    print("=" * 60) 