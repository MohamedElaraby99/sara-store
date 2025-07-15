@echo off
title Library Management System - Quick Start

echo.
echo ================================================
echo        Library Management System
echo ================================================
echo.

:: Check if setup is needed
if exist "portable_env" (
    echo Environment ready - starting application...
    goto :start_app
) else (
    echo First time setup - this may take a few minutes...
    goto :setup
)

:setup
echo.
echo Setting up portable environment...
python -m venv portable_env
call portable_env\Scripts\activate.bat
portable_env\Scripts\python.exe -m pip install --upgrade pip
portable_env\Scripts\python.exe -m pip install -r requirements_portable.txt
portable_env\Scripts\python.exe create_database.py
echo Setup completed!
echo.

:start_app
echo Starting Library Management System...
echo.
echo Application will be available at: http://localhost:5000/dashboard
echo Default login: admin / admin123
echo Alternative login: araby / 92321066
echo.
echo Browser will open automatically in 8 seconds...
echo Keep this window open while using the application
echo.

:: Open browser after 8 seconds
start /min cmd /c "timeout /t 8 /nobreak >nul && start http://localhost:5000/dashboard"

:: Start the application
call portable_env\Scripts\activate.bat
portable_env\Scripts\python.exe run_dev.py

echo.
echo Application stopped.
pause 