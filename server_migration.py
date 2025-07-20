#!/usr/bin/env python3
"""
سكريبت لإضافة عمود refund_amount إلى قاعدة البيانات على السيرفر
قم بتشغيل هذا السكريبت على السيرفر مرة واحدة فقط
"""

import sqlite3
import os
import sys

def add_refund_amount_column():
    """إضافة عمود refund_amount إلى جدول return_transaction"""
    
    # تحديد مسار قاعدة البيانات
    db_paths = [
        'sara.db',  # قاعدة البيانات الموجودة
        'instance/sara.db',
        'instance/sara_store.db',
        'sara_store.db',
        '/app/instance/sara.db',
        '/var/www/sara.db'
    ]
    
    db_path = None
    for path in db_paths:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        print("❌ لم يتم العثور على قاعدة البيانات")
        print("المسارات المفحوصة:")
        for path in db_paths:
            print(f"  - {path}")
        return False
    
    print(f"✅ تم العثور على قاعدة البيانات في: {db_path}")
    
    try:
        # الاتصال بقاعدة البيانات
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # التحقق من وجود العمود
        cursor.execute("PRAGMA table_info(return_transaction)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'refund_amount' not in columns:
            print("🔄 إضافة عمود refund_amount...")
            cursor.execute("ALTER TABLE return_transaction ADD COLUMN refund_amount REAL DEFAULT 0")
            
            # تحديث القيم الموجودة
            cursor.execute("UPDATE return_transaction SET refund_amount = total_amount")
            
            conn.commit()
            print("✅ تم إضافة عمود refund_amount بنجاح")
            
            # عرض عدد المرتجعات المحدثة
            cursor.execute("SELECT COUNT(*) FROM return_transaction")
            count = cursor.fetchone()[0]
            print(f"📊 تم تحديث {count} مرتجع")
            
        else:
            print("ℹ️ عمود refund_amount موجود بالفعل")
        
        # عرض هيكل الجدول
        cursor.execute("PRAGMA table_info(return_transaction)")
        print("\n📋 هيكل جدول return_transaction:")
        for column in cursor.fetchall():
            print(f"  - {column[1]} ({column[2]})")
        
        # عرض إحصائيات المرتجعات
        cursor.execute("SELECT id, refund_amount, total_amount FROM return_transaction")
        returns = cursor.fetchall()
        
        print(f"\n📈 إحصائيات المرتجعات ({len(returns)} مرتجع):")
        total_refund = 0
        for return_id, refund_amount, total_amount in returns:
            print(f"  - المرتجع {return_id}: {refund_amount} ج.م")
            total_refund += refund_amount
        
        print(f"💰 إجمالي المرتجعات: {total_refund} ج.م")
        
        conn.close()
        print("\n🎉 تم إكمال العملية بنجاح!")
        return True
        
    except Exception as e:
        print(f"❌ خطأ: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

if __name__ == "__main__":
    print("🚀 بدء عملية تحديث قاعدة البيانات...")
    print("=" * 50)
    
    success = add_refund_amount_column()
    
    print("=" * 50)
    if success:
        print("✅ تم إكمال العملية بنجاح!")
        print("🔄 يمكنك الآن تشغيل التطبيق")
        sys.exit(0)
    else:
        print("❌ فشلت العملية")
        sys.exit(1) 