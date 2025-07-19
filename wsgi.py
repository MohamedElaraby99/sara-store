#!/usr/bin/env python3
"""
WSGI entry point for Library Management System
Production deployment configuration
"""

import os
import sys
import logging
from logging.handlers import RotatingFileHandler

# Add the project directory to Python path
project_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_dir)

# Also add the parent directory in case we're in a subdirectory
parent_dir = os.path.dirname(project_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Set production environment
os.environ.setdefault('FLASK_CONFIG', 'vps')

try:
    from app import app
    from models import db
    
    # Configure logging for production
    if not app.debug and not app.testing:
        # Create logs directory if it doesn't exist
        if not os.path.exists('logs'):
            os.makedirs('logs')
        
        # Set up file logging
        file_handler = RotatingFileHandler(
            'logs/library_system.log', 
            maxBytes=10240000, 
            backupCount=10
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        
        app.logger.setLevel(logging.INFO)
        app.logger.info('Library Management System startup')
    
    # Initialize database
    with app.app_context():
        db.create_all()
    
    # Add security headers
    @app.after_request
    def after_request(response):
        """Add security headers to all responses"""
        headers = app.config.get('SECURITY_HEADERS', {})
        for header, value in headers.items():
            response.headers[header] = value
        return response
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        """Health check endpoint for monitoring"""
        return {'status': 'healthy', 'service': 'library_management'}, 200
    
    # Export both app and application for compatibility
    application = app
    app = application
    
except Exception as e:
    # Log startup errors
    logging.error(f"Failed to start application: {str(e)}")
    raise

if __name__ == "__main__":
    # Development server (not for production)
    app.run(debug=False, host='0.0.0.0', port=8006) 