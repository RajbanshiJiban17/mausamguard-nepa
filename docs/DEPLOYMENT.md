# MausamGuard Nepal - Production Deployment Guide

## 1. System Requirements
- **OS**: Windows 10/11 (PowerShell) or Linux (Ubuntu 22.04 LTS / Debian 12)
- **Python**: 3.12 or 3.13
- **Node.js**: v18.0.0+ (Tested on v24.11.1)
- **Database**: SQLite (default local) or PostgreSQL 15+ with PostGIS 3.3+
- **Memory**: Minimum 4 GB RAM (8 GB recommended for GIS GeoJSON manipulation)

---

## 2. Windows PowerShell Local Development Setup

### A. Clone & Virtual Environment
```powershell
# Navigate to project directory
cd c:\Users\User\Desktop\EWS

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend/requirements.txt
```

### B. Initialize Database & Seed Historical Records
```powershell
# Run data validation test
python scripts/validate_dataset.py

# Import 77 districts and 13,185 verified historical events
python scripts/import_historical_events.py

# Fetch live Open-Meteo weather
python scripts/refresh_weather.py

# Compute initial multi-hazard risk matrix
python scripts/calculate_risk.py

# Run master verification checks
python scripts/run_all_checks.py
```

### C. Launch Backend Server
```powershell
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
Backend API will be available at: `http://127.0.0.1:8000`  
Swagger Documentation: `http://127.0.0.1:8000/docs`

### D. Launch Frontend Server
In a separate PowerShell terminal:
```powershell
cd c:\Users\User\Desktop\EWS\frontend
npm install
npm run dev
```
Frontend web application will run at: `http://localhost:5173`

---

## 3. Docker Multi-Container Deployment
To deploy backend and frontend containers with auto-healing health checks:
```bash
docker compose up --build -d
```
- **Frontend**: `http://localhost:80`
- **Backend API**: `http://localhost:8000/api/v1`
- **Health Diagnostics**: `http://localhost:8000/api/v1/health`

---

## 4. PostgreSQL + PostGIS Migration (Optional)
To use production PostgreSQL instead of SQLite:
1. Update `.env`:
   ```env
   DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/mausamguard
   ```
2. Enable PostGIS:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
3. Re-run dataset import:
   ```bash
   python scripts/import_historical_events.py
   ```
