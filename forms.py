from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SelectField, FloatField, TextAreaField, SubmitField, IntegerField, DateTimeField, BooleanField
from wtforms.validators import DataRequired, Length, NumberRange, ValidationError, Optional
from models import User, Category, Product, Customer

class LoginForm(FlaskForm):
    username = StringField('اسم المستخدم', validators=[DataRequired(), Length(min=4, max=20)])
    password = PasswordField('كلمة المرور', validators=[DataRequired()])
    remember_me = BooleanField('تذكرني')
    submit = SubmitField('تسجيل الدخول')

class UserForm(FlaskForm):
    username = StringField('اسم المستخدم', validators=[DataRequired(), Length(min=4, max=20)])
    password = PasswordField('كلمة المرور', validators=[Optional(), Length(min=6)])
    role = SelectField('الدور', choices=[('admin', 'مدير'), ('seller', 'بائع')], validators=[DataRequired()])
    submit = SubmitField('حفظ')
    
    def __init__(self, original_username=None, is_edit=False, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.original_username = original_username
        self.is_edit = is_edit
        
        # إذا كان التعديل، جعل كلمة المرور اختيارية
        if not is_edit:
            self.password.validators = [DataRequired(), Length(min=6)]
    
    def validate_username(self, username):
        if username.data != self.original_username:
            user = User.query.filter_by(username=username.data).first()
            if user:
                raise ValidationError('اسم المستخدم موجود بالفعل')

class CategoryForm(FlaskForm):
    name_ar = StringField('اسم الفئة', validators=[DataRequired(), Length(min=2, max=100)])
    description_ar = TextAreaField('الوصف')
    submit = SubmitField('حفظ')

class ProductForm(FlaskForm):
    name_ar = StringField('اسم المنتج', validators=[DataRequired(), Length(min=2, max=200)])
    description_ar = TextAreaField('وصف المنتج')
    category_id = SelectField('الفئة', coerce=int, validators=[DataRequired()])
    wholesale_price = FloatField('سعر الجملة (ج.م)', validators=[DataRequired(), NumberRange(min=0.01)])
    retail_price = FloatField('سعر البيع (ج.م)', validators=[DataRequired(), NumberRange(min=0.01)])
    stock_quantity = FloatField('الكمية في المخزون', validators=[DataRequired(), NumberRange(min=0)])
    min_stock_threshold = FloatField('الحد الأدنى للمخزون', validators=[DataRequired(), NumberRange(min=0)])
    unit_type = SelectField('نوع الوحدة', choices=[('كامل', 'كامل'), ('جزئي', 'جزئي')], validators=[DataRequired()])
    unit_description = StringField('وصف الوحدة', validators=[Length(max=100)])
    submit = SubmitField('حفظ')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.category_id.choices = [(c.id, c.name_ar) for c in Category.query.all()]
    
    def validate_retail_price(self, retail_price):
        if self.wholesale_price.data and retail_price.data:
            if retail_price.data <= self.wholesale_price.data:
                raise ValidationError('سعر البيع يجب أن يكون أكبر من سعر الجملة')

class SaleItemForm(FlaskForm):
    product_id = SelectField('المنتج', coerce=int, validators=[DataRequired()])
    quantity = FloatField('الكمية', validators=[DataRequired(), NumberRange(min=0.01)])
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.product_id.choices = [(p.id, f"{p.name_ar} - {p.retail_price} ج.م") for p in Product.query.filter(Product.stock_quantity > 0).all()]

class SaleForm(FlaskForm):
    customer_id = SelectField('العميل', coerce=int, validators=[Optional()])
    payment_type = SelectField('نوع الدفع', 
                              choices=[('cash', 'نقدي'), ('credit', 'آجل')], 
                              validators=[DataRequired()])
    paid_amount = FloatField('المبلغ المدفوع', validators=[Optional(), NumberRange(min=0)])
    notes = TextAreaField('ملاحظات')
    submit = SubmitField('تأكيد البيع')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        customers = [(0, 'عميل نقدي')] + [(c.id, c.name) for c in Customer.query.all()]
        self.customer_id.choices = customers

class StockUpdateForm(FlaskForm):
    product_id = SelectField('المنتج', coerce=int, validators=[DataRequired()])
    quantity = FloatField('الكمية المضافة', validators=[DataRequired()])
    notes = TextAreaField('ملاحظات')
    submit = SubmitField('تحديث المخزون')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.product_id.choices = [(p.id, p.name_ar) for p in Product.query.all()]

class CustomerForm(FlaskForm):
    name = StringField('اسم العميل', validators=[DataRequired(), Length(min=2, max=200)])
    phone = StringField('رقم الهاتف', validators=[Optional(), Length(max=20)])
    address = TextAreaField('العنوان')
    notes = TextAreaField('ملاحظات')
    submit = SubmitField('حفظ')

class PaymentForm(FlaskForm):
    amount = FloatField('المبلغ المدفوع', validators=[DataRequired(), NumberRange(min=0.01)])
    payment_method = SelectField('طريقة الدفع', 
                                choices=[('نقدي', 'نقدي'), ('تحويل بنكي', 'تحويل بنكي'), ('شيك', 'شيك'), ('فيزا', 'فيزا')], 
                                validators=[DataRequired()])
    notes = TextAreaField('ملاحظات')
    submit = SubmitField('تسجيل الدفعة')

# نموذج جديد للمصاريف
class ExpenseForm(FlaskForm):
    description = StringField('وصف المصروف', validators=[DataRequired(), Length(min=2, max=200)])
    amount = FloatField('المبلغ (ج.م)', validators=[DataRequired(), NumberRange(min=0.01)])
    expense_type = SelectField('نوع المصروف', 
                              choices=[
                                  ('salary', 'راتب'),
                                  ('rent', 'إيجار'),
                                  ('utilities', 'خدمات (كهرباء، ماء، هاتف)'),
                                  ('marketing', 'تسويق وإعلان'),
                                  ('maintenance', 'صيانة'),
                                  ('supplies', 'مستلزمات مكتبية'),
                                  ('transportation', 'مواصلات'),
                                  ('other', 'أخرى')
                              ], 
                              validators=[DataRequired()])
    category = StringField('فئة المصروف', validators=[Optional(), Length(max=100)])
    expense_date = DateTimeField('تاريخ المصروف', format='%Y-%m-%d', validators=[Optional()])
    notes = TextAreaField('ملاحظات')
    submit = SubmitField('حفظ المصروف')

# نموذج جديد للنواقص
class ShoppingListForm(FlaskForm):
    item_name = StringField('اسم المنتج المطلوب', validators=[DataRequired(), Length(min=2, max=200)])
    quantity_needed = FloatField('الكمية المطلوبة', validators=[DataRequired(), NumberRange(min=0.01)])
    unit_type = SelectField('نوع الوحدة', 
                           choices=[('كامل', 'كامل'), ('جزئي', 'جزئي'), ('كيلو', 'كيلو'), ('متر', 'متر'), ('صندوق', 'صندوق')], 
                           validators=[DataRequired()])
    estimated_price = FloatField('السعر المتوقع للوحدة (ج.م)', validators=[Optional(), NumberRange(min=0)])
    priority = SelectField('الأولوية', 
                          choices=[('high', 'عالي'), ('medium', 'متوسط'), ('low', 'منخفض')], 
                          validators=[DataRequired()])
    category = StringField('الفئة', validators=[Optional(), Length(max=100)])
    supplier = StringField('المورد المقترح', validators=[Optional(), Length(max=200)])
    notes = TextAreaField('ملاحظات')
    submit = SubmitField('إضافة للقائمة') 