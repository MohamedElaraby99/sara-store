@echo off
chcp 65001 >nul
title إصلاح سريع - المتطلبات المفقودة

echo.
echo ===============================================
echo    إصلاح سريع للمتطلبات المفقودة
echo ===============================================
echo.

echo 🔧 هذا الملف سيقوم بتثبيت المتطلبات المفقودة فقط
echo 💡 أسرع من إعادة إنشاء البيئة كاملة
echo.

:: التحقق من وجود البيئة المحمولة
if not exist "portable_env" (
    echo ❌ البيئة المحمولة غير موجودة!
    echo 🔧 يرجى تشغيل setup_portable.bat أولاً
    pause
    exit /b 1
)

:: التحقق من وجود Python في البيئة المحمولة
if not exist "portable_env\Scripts\python.exe" (
    echo ❌ Python غير موجود في البيئة المحمولة!
    echo 🔧 يرجى تشغيل repair_portable.bat
    pause
    exit /b 1
)

echo ✅ البيئة المحمولة موجودة

:: تثبيت المتطلبات المفقودة
echo.
echo 📦 تثبيت المتطلبات المفقودة...

echo 📥 تثبيت Flask-Limiter...
portable_env\Scripts\pip.exe install Flask-Limiter==3.5.0

echo 📥 تثبيت cryptography...
portable_env\Scripts\pip.exe install cryptography==41.0.7

echo 📥 تثبيت flask-talisman...
portable_env\Scripts\pip.exe install flask-talisman==1.1.0

echo 📥 تثبيت flask-cors...
portable_env\Scripts\pip.exe install flask-cors==4.0.0

echo 📥 تثبيت limits...
portable_env\Scripts\pip.exe install limits==3.6.0

:: التحقق من تثبيت Flask-Limiter
echo.
echo 🔍 التحقق من تثبيت Flask-Limiter...
portable_env\Scripts\python.exe -c "import flask_limiter; print('✅ Flask-Limiter مثبت بنجاح')"
if errorlevel 1 (
    echo ❌ Flask-Limiter لم يُثبت بشكل صحيح
    echo 💡 جرب تشغيل repair_portable.bat للإصلاح الكامل
    pause
    exit /b 1
)

echo.
echo ===============================================
echo           تم إصلاح المتطلبات المفقودة!
echo ===============================================
echo.
echo ✅ جميع المتطلبات مثبتة الآن
echo 📌 يمكنك تشغيل run_app.bat مرة أخرى
echo.
pause 