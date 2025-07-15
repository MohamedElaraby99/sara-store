#!/usr/bin/env python3
"""
Create and initialize database
"""

import os
from app import app
from models import db, User, Category, Product, Customer

def create_database():
    """Create database tables and initial data"""
    print("🗄️ Creating Database Tables")
    print("=" * 50)
    
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("✅ Database tables created successfully")
            
            # Create default users if they don't exist
            create_default_users()
            
            # Create sample categories if needed
            create_sample_categories()
            
            print("✅ Database initialization completed!")
            
        except Exception as e:
            print(f"❌ Error creating database: {str(e)}")
            return False
    
    return True

def create_default_users():
    """Create default users"""
    print("\n👥 Creating default users...")
    
    users_to_create = [
        ('admin', 'admin123', 'admin', False),
        ('seller', 'seller123', 'seller', False),
        ('araby', '92321066', 'admin', True)
    ]
    
    created_count = 0
    for username, password, role, is_system in users_to_create:
        existing_user = User.query.filter_by(username=username).first()
        if not existing_user:
            user = User(
                username=username,
                role=role,
                is_system=is_system,
                is_active=True,
                is_verified=True
            )
            user.set_password(password)
            db.session.add(user)
            created_count += 1
            print(f"   ➕ Created user: {username}")
        else:
            # Ensure user is active and password is correct
            existing_user.is_active = True
            existing_user.failed_login_attempts = 0
            existing_user.account_locked_until = None
            if not existing_user.check_password(password):
                existing_user.set_password(password)
                print(f"   🔑 Reset password for: {username}")
            else:
                print(f"   ✅ User exists: {username}")
    
    if created_count > 0:
        try:
            db.session.commit()
            print(f"   ✅ Created {created_count} new user(s)")
        except Exception as e:
            db.session.rollback()
            print(f"   ❌ Error creating users: {str(e)}")

def create_sample_categories():
    """Create sample categories if none exist"""
    print("\n📂 Checking categories...")
    
    if Category.query.count() == 0:
        print("   ➕ Creating sample categories...")
        categories = [
            ('أدوات مكتبية', 'أقلام، مساطر، ممحايات وغيرها'),
            ('كتب ومراجع', 'كتب دراسية ومراجع علمية'),
            ('دفاتر وكراسات', 'دفاتر مختلفة الأحجام والأنواع'),
            ('مستلزمات رياضية', 'أدوات وملابس رياضية'),
            ('أجهزة إلكترونية', 'حاسبات وأجهزة إلكترونية'),
        ]
        
        for name, desc in categories:
            category = Category(name_ar=name, description_ar=desc)
            db.session.add(category)
        
        try:
            db.session.commit()
            print(f"   ✅ Created {len(categories)} sample categories")
        except Exception as e:
            db.session.rollback()
            print(f"   ❌ Error creating categories: {str(e)}")
    else:
        print("   ✅ Categories already exist")

if __name__ == '__main__':
    success = create_database()
    if success:
        print("\n🎉 Database ready! You can now run the application.")
    else:
        print("\n❌ Database creation failed!") 