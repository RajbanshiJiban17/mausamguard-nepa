# MausamGuard Nepal - Local Development Launcher
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  MausamGuard Nepal - Starting Local Development Servers   " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$root = Get-Location

# Check if database exists
if (-not (Test-Path "$root\mausamguard.db")) {
    Write-Host "[SETUP] Initializing database and importing 77-district dataset..." -ForegroundColor Yellow
    python scripts\import_historical_events.py
}

# Start Backend
Write-Host "[1/2] Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONPATH='$root\backend'; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

# Start Frontend
Write-Host "[2/2] Starting React + Vite Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  System running!" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
