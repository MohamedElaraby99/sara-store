@echo off
chcp 65001 >nul
title فحص النظام - نظام إدارة المكتبة

echo.
echo ===============================================
echo       فحص سلامة نظام إدارة المكتبة
echo ===============================================
echo.

:: فحص Python
echo 🔍 فحص Python العام...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python غير مثبت على النظام
    set PYTHON_OK=0
) else (
    echo ✅ Python مثبت على النظام: 
    python --version
    set PYTHON_OK=1
)

:: فحص Python في البيئة المحمولة
if exist "portable_env" (
    echo.
    echo 🔍 فحص Python في البيئة المحمولة...
    portable_env\Scripts\python.exe --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Python غير متاح في البيئة المحمولة
        set PORTABLE_PYTHON_OK=0
    ) else (
        echo ✅ Python في البيئة المحمولة: 
        portable_env\Scripts\python.exe --version
        
        :: فحص Flask في البيئة المحمولة
        portable_env\Scripts\python.exe -c "import flask; print('Flask version:', flask.__version__)" >nul 2>&1
        if errorlevel 1 (
            echo ❌ Flask غير مثبت في البيئة المحمولة
            set PORTABLE_PYTHON_OK=0
        ) else (
            echo ✅ Flask مثبت في البيئة المحمولة
            set PORTABLE_PYTHON_OK=1
        )
    )
) else (
    set PORTABLE_PYTHON_OK=0
)

:: فحص البيئة المحمولة
echo.
echo 🔍 فحص البيئة المحمولة...
if exist "portable_env" (
    echo ✅ البيئة المحمولة موجودة
    set ENV_OK=1
) else (
    echo ❌ البيئة المحمولة غير موجودة
    set ENV_OK=0
)

:: فحص قاعدة البيانات
echo.
echo 🔍 فحص قاعدة البيانات...
if exist "library_dev.db" (
    echo ✅ قاعدة البيانات موجودة
    set DB_OK=1
) else (
    echo ⚠️  قاعدة البيانات غير موجودة (سيتم إنشاؤها عند التشغيل)
    set DB_OK=0
)

:: فحص الملفات الأساسية
echo.
echo 🔍 فحص الملفات الأساسية...
set FILES_OK=1

if not exist "app.py" (
    echo ❌ app.py غير موجود
    set FILES_OK=0
)

if not exist "run_dev.py" (
    echo ❌ run_dev.py غير موجود
    set FILES_OK=0
)

if not exist "requirements.txt" (
    echo ❌ requirements.txt غير موجود
    set FILES_OK=0
)

if not exist "create_database.py" (
    echo ❌ create_database.py غير موجود
    set FILES_OK=0
)

if %FILES_OK%==1 (
    echo ✅ جميع الملفات الأساسية موجودة
)

:: تقرير النتائج
echo.
echo ===============================================
echo                تقرير الفحص
echo ===============================================

if %PYTHON_OK%==1 if %ENV_OK%==1 if %PORTABLE_PYTHON_OK%==1 if %FILES_OK%==1 (
    echo 🎉 النظام جاهز للتشغيل!
    echo 📌 يمكنك تشغيل التطبيق باستخدام run_app.bat
) else (
    echo ⚠️  النظام يحتاج إلى إعداد:
    
    if %PYTHON_OK%==0 (
        echo    - تثبيت Python من python.org
    )
    
    if %ENV_OK%==0 (
        echo    - تشغيل setup_portable.bat لإعداد البيئة
    )
    
    if %PORTABLE_PYTHON_OK%==0 if %ENV_OK%==1 (
        echo    - إعادة تشغيل setup_portable.bat لإصلاح البيئة المحمولة
    )
    
    if %FILES_OK%==0 (
        echo    - التأكد من وجود جميع ملفات النظام
    )
)

echo.
echo ===============================================
echo               معلومات النظام
echo ===============================================
echo 💻 نظام التشغيل: %OS%
echo 📁 المجلد الحالي: %CD%
echo 🕒 التاريخ والوقت: %DATE% %TIME%

echo.
pause 