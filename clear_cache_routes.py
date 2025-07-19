from flask import render_template
from flask_login import login_required

def init_clear_cache_routes(app):
    """تهيئة routes إزالة الكاش"""
    
    @app.route('/clear-cache')
    @login_required
    def clear_cache():
        """صفحة إزالة الكاش"""
        return render_template('clear-cache.html')
    
    @app.route('/cache-settings')
    @login_required
    def cache_settings():
        """صفحة إعدادات الكاش"""
        return render_template('cache_settings.html') 