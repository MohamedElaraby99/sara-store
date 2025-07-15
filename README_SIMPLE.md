# Library Management System - Simple Version

## Simple Installation and Running (No Arabic Text)

If you're experiencing encoding issues with Arabic text in batch files, use these simplified versions:

### 1. First Time Setup

```bash
setup_simple.bat
```

### 2. Daily Running

```bash
run_app_simple.bat
```

### 3. Quick Start (Setup + Run)

```bash
quick_start_simple.bat
```

## What These Files Do

- **setup_simple.bat**: Creates portable environment, installs dependencies, creates database
- **run_app_simple.bat**: Activates environment and starts the application
- **quick_start_simple.bat**: Combines setup and run for beginners

## Features

✅ **No Arabic text** - Avoids encoding issues
✅ **Auto browser opening** - Opens http://localhost:5000 automatically
✅ **Portable environment** - Self-contained Python environment
✅ **Desktop shortcuts** - Creates shortcuts automatically
✅ **Error checking** - Validates setup before running

## Default Login

- **Username:** admin
- **Password:** admin123

Alternative:

- **Username:** araby
- **Password:** 92321066

## Browser Access

The application will automatically open in your browser at:
**http://localhost:5000/dashboard**

## Changes Made

### Dashboard as Home Page

- Root URL (/) now redirects directly to dashboard
- Login page moved to /login
- Better user experience for authenticated users

### Simple Batch Files

- English-only text to avoid encoding issues
- Same functionality as Arabic versions
- Compatible with all Windows systems

## Troubleshooting

1. **Python not found**: Install Python 3.8+ from python.org
2. **Permission errors**: Run as administrator
3. **Port 5000 busy**: Close other applications using port 5000
4. **Dependencies missing**: Re-run setup_simple.bat

## File Structure

```
library system/
├── setup_simple.bat          # Simple setup (English only)
├── run_app_simple.bat         # Simple runner (English only)
├── quick_start_simple.bat     # Quick start (English only)
├── portable_env/              # Isolated Python environment
├── app.py                     # Main application
├── requirements_portable.txt  # Dependencies
└── README_SIMPLE.md          # This file
```

## Support

If you still experience issues:

1. Try running from Command Prompt as Administrator
2. Check Python installation
3. Ensure no antivirus blocking files
4. Use the original Arabic versions if encoding works
