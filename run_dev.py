#!/usr/bin/env python3
"""
Development server runner
This script runs the application in development mode without production security features
"""

import os
import sys

# Set development environment
os.environ['FLASK_CONFIG'] = 'development'
os.environ['FLASK_ENV'] = 'development'

# Import and run the app
from app import app

if __name__ == '__main__':
    print("🚀 Starting Library Management System in development mode...")
    print("📍 Application will be available at: http://localhost:5000/dashboard")
    print()
    print("👤 متاح تسجيل الدخول بالحسابات التالية:")
    print("   🔐 أدمن: admin / admin123")
    print("   🛒 بائع: seller / seller123")
    print()
    print("🔧 Development mode: Debug enabled, Security features disabled")
    print("-" * 60)
    
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000,
        threaded=True
    ) 