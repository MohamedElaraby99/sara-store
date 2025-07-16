#!/usr/bin/env python3
"""
Clean development server runner
This script runs the application in development mode with automatic fixes
"""

import os
import sys

# Set development environment
os.environ['FLASK_CONFIG'] = 'development'
os.environ['FLASK_ENV'] = 'development'

# Import and setup the app
from app import app
from models import db, User

def setup_and_run():
    """Setup and run the development server"""
    print("🚀 Starting Library Management System (Clean Mode)")
    print("=" * 60)
    
    with app.app_context():
        # Check if database tables exist
        print("🔍 Checking database...")
        try:
            # Try to query users table
            User.query.count()
            print("   ✅ Database tables exist")
        except Exception as e:
            print("   ⚠️  Database tables missing, creating...")
            try:
                # Create all tables
                db.create_all()
                print("   ✅ Database tables created")
                
                # Run database initialization
                from create_database import create_default_users, create_sample_categories
                create_default_users()
                create_sample_categories()
                
            except Exception as create_error:
                print(f"   ❌ Error creating database: {str(create_error)}")
                print("   💡 Try running: python create_database.py")
                return
        
        # Check and fix users
        print("🔧 Checking user accounts...")
        
        users_to_ensure = [
            ('admin', 'admin123', 'admin'),
            ('seller', 'seller123', 'seller'),
            ('araby', '92321066', 'admin')
        ]
        
        users_fixed = 0
        for username, password, role in users_to_ensure:
            try:
                user = User.query.filter_by(username=username).first()
                if user:
                    # Ensure user is active and unlocked
                    if not user.is_active or user.is_account_locked() or user.failed_login_attempts > 0:
                        user.is_active = True
                        user.failed_login_attempts = 0
                        user.account_locked_until = None
                        users_fixed += 1
                    
                    # Ensure password works
                    if not user.check_password(password):
                        user.set_password(password)
                        users_fixed += 1
                else:
                    # Create missing user
                    new_user = User(
                        username=username,
                        role=role,
                        is_active=True,
                        is_verified=True,
                        is_system=(username == 'araby')
                    )
                    new_user.set_password(password)
                    db.session.add(new_user)
                    users_fixed += 1
            except Exception as user_error:
                print(f"   ❌ Error with user {username}: {str(user_error)}")
        
        if users_fixed > 0:
            try:
                db.session.commit()
                print(f"   ✅ Fixed {users_fixed} user account(s)")
            except Exception as e:
                db.session.rollback()
                print(f"   ❌ Error fixing users: {str(e)}")
        else:
            print("   ✅ All user accounts are OK")
        
        # Verify all users can login
        print("🔐 Verifying login credentials...")
        all_good = True
        for username, password, role in users_to_ensure:
            try:
                user = User.query.filter_by(username=username).first()
                if user and user.check_password(password):
                    print(f"   ✅ {username} / {password}")
                else:
                    print(f"   ❌ {username} / {password}")
                    all_good = False
            except Exception as verify_error:
                print(f"   ❌ {username} - Error: {str(verify_error)}")
                all_good = False
        
        if not all_good:
            print("   ⚠️  Some credentials failed. Try running create_database.py first")
        
        print()
        print("📍 Application will be available at: http://localhost:5000/dashboard")
        print()
        print("👤 متاح تسجيل الدخول بالحسابات التالية:")
        print("   🔐 أدمن: admin / admin123")
        print("   🛒 بائع: seller / seller123")
        print("   ⚙️  مطور: araby / 92321066")
        print()
        print("🔧 Development mode: Debug enabled, CSRF disabled")
        print("🌐 Access from any device on network: http://[your-ip]:5000")
        print("-" * 60)
    
    # Start the server
    app.run(
        debug=True,
        host='0.0.0.0',
        port=8006,
        threaded=True,
        use_reloader=True
    )

if __name__ == '__main__':
    setup_and_run() 