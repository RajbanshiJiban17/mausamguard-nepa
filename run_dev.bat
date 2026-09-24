@echo off
echo ============================================================
echo   MausamGuard Nepal - Starting Local Development Servers
echo ============================================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    pause
    exit /b 1
)

:: Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

:: Run database migration / seed if database is missing
if not exist mausamguard.db (
    echo [SETUP] Initializing database and importing 77-district dataset...
    python scripts/import_historical_events.py
)

echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "MausamGuard Backend" cmd /k "set PYTHONPATH=%CD%\backend && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo [2/2] Starting React + Vite Frontend on http://localhost:5173 ...
cd frontend
start "MausamGuard Frontend" cmd /k "npm run dev"

echo.
echo ============================================================
echo   System running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo ============================================================
