#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
سكريبت إعادة تعيين سريع لقاعدة البيانات
Quick Database Reset Script

استخدام سريع: python quick_reset.py
"""

import os
import sys
from datetime import datetime

def main():
    print("🔄 إعادة تعيين قاعدة البيانات...")
    
    # البحث عن قاعدة البيانات
    db_path = None
    for path in ['sara.db', 'instance/sara.db', 'instance/database.db', 'database.db', 'app.db']:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        print("❌ قاعدة البيانات غير موجودة!")
        print("تأكد من تشغيل التطبيق مرة واحدة على الأقل")
        return
    
    print(f"📁 تم العثور على قاعدة البيانات: {db_path}")
    
    # إنشاء نسخة احتياطية
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"backup_{timestamp}.db"
    
    try:
        import shutil
        shutil.copy2(db_path, backup_path)
        print(f"✅ نسخة احتياطية: {backup_path}")
    except Exception as e:
        print(f"⚠️  فشل في إنشاء نسخة احتياطية: {e}")
    
    # حذف قاعدة البيانات
    try:
        os.remove(db_path)
        print("✅ تم حذف قاعدة البيانات")
    except Exception as e:
        print(f"❌ فشل في حذف قاعدة البيانات: {e}")
        return
    
    # إعادة إنشاء قاعدة البيانات
    try:
        from app import app, db
        with app.app_context():
            db.create_all()
            
            # إنشاء مستخدم افتراضي
            from models import User
            from werkzeug.security import generate_password_hash
            
            admin = User(
                username='admin',
                email='admin@sarastore.com',
                password_hash=generate_password_hash('admin123'),
                role='admin',
                is_active=True,
                is_verified=True
            )
            db.session.add(admin)
            db.session.commit()
            
        print("✅ تم إعادة إنشاء قاعدة البيانات")
        print("👤 المستخدم الافتراضي: admin/admin123")
        
    except Exception as e:
        print(f"❌ فشل في إعادة الإنشاء: {e}")
        print("تأكد من تشغيل التطبيق مرة واحدة على الأقل")

if __name__ == "__main__":
    main() 