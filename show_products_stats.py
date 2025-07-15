#!/usr/bin/env python3
"""
Show products statistics
"""

from app import app
from models import db, Product, Category
from sqlalchemy import func

def show_products_stats():
    """Show detailed products statistics"""
    print("📊 Products Statistics")
    print("=" * 60)
    
    with app.app_context():
        # Total products
        total_products = Product.query.count()
        print(f"📦 Total Products: {total_products}")
        print()
        
        # Products per category
        print("📂 Products by Category:")
        categories = Category.query.all()
        for cat in categories:
            count = Product.query.filter_by(category_id=cat.id).count()
            print(f"   📁 {cat.name_ar}: {count} products")
        
        print()
        
        # Price statistics
        print("💰 Price Statistics:")
        min_wholesale = db.session.query(func.min(Product.wholesale_price)).scalar() or 0
        max_wholesale = db.session.query(func.max(Product.wholesale_price)).scalar() or 0
        avg_wholesale = db.session.query(func.avg(Product.wholesale_price)).scalar() or 0
        
        min_retail = db.session.query(func.min(Product.retail_price)).scalar() or 0
        max_retail = db.session.query(func.max(Product.retail_price)).scalar() or 0
        avg_retail = db.session.query(func.avg(Product.retail_price)).scalar() or 0
        
        print(f"   💵 Wholesale Prices: {min_wholesale:.2f} - {max_wholesale:.2f} ج.م (Avg: {avg_wholesale:.2f})")
        print(f"   💴 Retail Prices: {min_retail:.2f} - {max_retail:.2f} ج.م (Avg: {avg_retail:.2f})")
        
        print()
        
        # Stock statistics
        print("📦 Stock Statistics:")
        total_stock = db.session.query(func.sum(Product.stock_quantity)).scalar() or 0
        min_stock = db.session.query(func.min(Product.stock_quantity)).scalar() or 0
        max_stock = db.session.query(func.max(Product.stock_quantity)).scalar() or 0
        avg_stock = db.session.query(func.avg(Product.stock_quantity)).scalar() or 0
        
        print(f"   📊 Total Stock: {total_stock:.0f} units")
        print(f"   📈 Stock Range: {min_stock:.0f} - {max_stock:.0f} units (Avg: {avg_stock:.2f})")
        
        # Low stock products
        low_stock_products = Product.query.filter(Product.stock_quantity <= Product.min_stock_threshold).count()
        print(f"   ⚠️  Low Stock Products: {low_stock_products}")
        
        # Out of stock products
        out_of_stock_products = Product.query.filter(Product.stock_quantity <= 0).count()
        print(f"   ❌ Out of Stock Products: {out_of_stock_products}")
        
        print()
        
        # Sample products (first 10)
        print("📝 Sample Products:")
        sample_products = Product.query.limit(10).all()
        for i, product in enumerate(sample_products, 1):
            print(f"   {i:2d}. {product.name_ar}")
            print(f"       Category: {product.category.name_ar}")
            print(f"       Price: {product.wholesale_price} → {product.retail_price} ج.م")
            print(f"       Stock: {product.stock_quantity} units")
            print()
        
        if total_products > 10:
            print(f"   ... and {total_products - 10} more products")
        
        print()
        print("✅ Statistics complete!")

if __name__ == '__main__':
    show_products_stats() 