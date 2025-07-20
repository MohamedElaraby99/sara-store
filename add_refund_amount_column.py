from app import app, db
import sqlite3

with app.app_context():
    try:
        # إضافة عمود refund_amount إلى جدول return_transaction
        conn = sqlite3.connect('instance/sara_store.db')
        cursor = conn.cursor()
        
        # التحقق من وجود العمود
        cursor.execute("PRAGMA table_info(return_transaction)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'refund_amount' not in columns:
            print("إضافة عمود refund_amount...")
            cursor.execute("ALTER TABLE return_transaction ADD COLUMN refund_amount REAL DEFAULT 0")
            
            # تحديث القيم الموجودة
            cursor.execute("UPDATE return_transaction SET refund_amount = total_amount")
            
            conn.commit()
            print("تم إضافة عمود refund_amount بنجاح")
        else:
            print("عمود refund_amount موجود بالفعل")
        
        # عرض هيكل الجدول
        cursor.execute("PRAGMA table_info(return_transaction)")
        print("\nهيكل جدول return_transaction:")
        for column in cursor.fetchall():
            print(f"  {column[1]} ({column[2]})")
        
        conn.close()
        
    except Exception as e:
        print(f"خطأ: {e}")
        conn.rollback()
        conn.close() 