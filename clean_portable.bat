@echo off
chcp 65001 >nul
title تنظيف البيئة المحمولة

echo.
echo ===============================================
echo        تنظيف البيئة المحمولة
echo ===============================================
echo.
echo ⚠️  تحذير: هذا سيحذف البيئة المحمولة والبيانات!
echo.
echo 📋 سيتم حذف:
echo    - مجلد portable_env (البيئة المحمولة)
echo    - ملف library_dev.db (قاعدة البيانات)
echo    - ملف .env (الإعدادات)
echo.
echo 💡 يمكنك إعادة الإعداد بتشغيل setup_portable.bat
echo.

set /p choice="هل أنت متأكد؟ (y/N): "
if /i "%choice%" neq "y" (
    echo.
    echo ❌ تم إلغاء العملية
    pause
    exit /b 0
)

echo.
echo 🧹 بدء عملية التنظيف...

:: حذف البيئة المحمولة
if exist "portable_env" (
    echo 🗑️  حذف البيئة المحمولة...
    rmdir /s /q "portable_env"
    if exist "portable_env" (
        echo ⚠️  فشل في حذف البيئة المحمولة (قد تكون قيد الاستخدام)
    ) else (
        echo ✅ تم حذف البيئة المحمولة
    )
) else (
    echo 💭 البيئة المحمولة غير موجودة
)

:: حذف قاعدة البيانات
if exist "library_dev.db" (
    echo 🗑️  حذف قاعدة البيانات...
    del /f "library_dev.db"
    if exist "library_dev.db" (
        echo ⚠️  فشل في حذف قاعدة البيانات
    ) else (
        echo ✅ تم حذف قاعدة البيانات
    )
) else (
    echo 💭 قاعدة البيانات غير موجودة
)

:: حذف ملف الإعدادات
if exist ".env" (
    echo 🗑️  حذف ملف الإعدادات...
    del /f ".env"
    if exist ".env" (
        echo ⚠️  فشل في حذف ملف الإعدادات
    ) else (
        echo ✅ تم حذف ملف الإعدادات
    )
) else (
    echo 💭 ملف الإعدادات غير موجود
)

:: حذف الملفات المؤقتة
echo.
echo 🧹 تنظيف الملفات المؤقتة...

if exist "__pycache__" (
    rmdir /s /q "__pycache__"
    echo ✅ تم حذف __pycache__
)

if exist "*.pyc" (
    del /f "*.pyc"
    echo ✅ تم حذف ملفات .pyc
)

if exist "instance" (
    echo 🗑️  حذف مجلد instance...
    rmdir /s /q "instance"
    echo ✅ تم حذف مجلد instance
)

echo.
echo ===============================================
echo            انتهت عملية التنظيف
echo ===============================================
echo.
echo ✅ تم تنظيف البيئة المحمولة بنجاح!
echo.
echo 📋 الخطوات التالية:
echo    1. شغل setup_portable.bat لإعادة الإعداد
echo    2. أو شغل quick_start.bat للإعداد والتشغيل
echo.
pause 