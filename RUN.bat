@echo off
cls
echo Starting Library Management System...
echo Opening http://localhost:5000/dashboard in 8 seconds...
echo.

if not exist "portable_env" (
    echo First time setup...
    python -m venv portable_env
    call portable_env\Scripts\activate.bat
    pip install -r requirements_portable.txt
    python create_database.py
)

start /min cmd /c "timeout /t 8 /nobreak >nul && start http://localhost:5000/dashboard"
call portable_env\Scripts\activate.bat
python run_dev.py
pause 