@echo off
chcp 65001 >nul
title نظام إدارة المكتبة

:: التحقق من وجود البيئة المحمولة
if not exist "portable_env" (
    echo.
    echo ❌ البيئة المحمولة غير موجودة!
    echo 🔧 يرجى تشغيل ملف setup_portable.bat أولاً
    echo.
    pause
    exit /b 1
)

:: تغيير الترميز لدعم العربية
echo.
echo ===============================================
echo        نظام إدارة المكتبة - بدء التشغيل
echo ===============================================
echo.

:: تفعيل البيئة المحمولة
echo 🔄 تفعيل البيئة المحمولة...
call portable_env\Scripts\activate.bat

:: التحقق من تثبيت Flask
echo 🔍 التحقق من تثبيت Flask...
portable_env\Scripts\python.exe -c "import flask; print('Flask version:', flask.__version__)" >nul 2>&1
if errorlevel 1 (
    echo ❌ Flask غير مثبت في البيئة المحمولة!
    echo 🔧 يرجى تشغيل setup_portable.bat مرة أخرى
    pause
    exit /b 1
)
echo ✅ Flask مثبت بنجاح

:: التحقق من قاعدة البيانات
if not exist "library_dev.db" (
    echo 🗄️  إنشاء قاعدة البيانات...
    portable_env\Scripts\python.exe create_database.py
)

:: تشغيل التطبيق
echo.
echo 🚀 بدء تشغيل نظام إدارة المكتبة...
echo.
echo ===============================================
echo   🌐 رابط التطبيق: http://localhost:5000/dashboard
echo   👤 المستخدم: admin
echo   🔑 كلمة المرور: admin123
echo ===============================================
echo.
echo 📝 ملاحظة: اترك هذه النافذة مفتوحة أثناء استخدام التطبيق
echo 🛑 لإيقاف التطبيق: اضغط Ctrl+C
echo.
echo 🌐 سيتم فتح المتصفح تلقائياً خلال 8 ثوان...

:: فتح المتصفح تلقائياً بعد 8 ثوان في الخلفية
start /min cmd /c "timeout /t 8 /nobreak >nul && start http://localhost:5000/dashboard"

echo ✅ النظام جاهز للتشغيل!
echo 💻 سيفتح المتصفح تلقائياً خلال 8 ثوان...
echo.
echo ⚠️  إذا لم يفتح المتصفح تلقائياً:
echo    افتح المتصفح يدوياً واذهب إلى: http://localhost:5000/dashboard
echo.

:: تشغيل التطبيق
portable_env\Scripts\python.exe run_dev.py

:: رسالة عند إغلاق التطبيق
echo.
echo 👋 تم إغلاق التطبيق بنجاح
echo.
pause 