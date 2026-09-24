# MausamGuard Nepal

> **"Real-Time Flood, Landslide & Agriculture Risk Monitoring and Early Warning Decision Support System for Nepal"**  
> *Tagline: Monitor. Assess. Warn.*

---

## 1. Executive Summary & Purpose
**MausamGuard Nepal** is a production-grade, multi-hazard disaster risk monitoring and early warning decision-support platform covering **all 77 administrative districts** and **752 local municipalities (palikas)** across Nepal.

The platform continuously correlates real-time numerical weather prediction data with 55 years of verified historical disaster records (1971–2026), terrain geomorphometry derived from Shuttle Radar Topography Mission (SRTM) DEMs, and official **Department of Hydrology and Meteorology (DHM)** warning thresholds.

---

## 2. Core Pillars & Ethical Commitments
1. **Zero Data Fabrication**: Under no circumstances does this platform invent synthetic disaster events, fake rainfall observations, or simulated river heights. If an official government telemetry feed is non-public or unreachable, the system transparently reports **`"Live DHM feed unavailable"`** and relies solely on verified baseline thresholds.
2. **Transparent, Explainable Risk**: Avoids opaque black-box machine learning. Every computed risk score explicitly links to verifiable physical parameters: antecedent precipitation, terrain slope, drainage proximity, and historical frequency.
3. **Non-Deterministic Terminology**: Terminology strictly adheres to *"Risk Level"*, *"Early Warning"*, *"Risk Assessment"*, and *"Decision Support"*. Never makes false claims of "100% disaster prediction".
4. **Mandatory Attribution**: Preserves explicit source-level licenses and credit for all underlying data (BIPAD, DesInventar, DHM, Open-Meteo, OpenStreetMap, OCHA/HDX, ICIMOD).
5. **Authoritative Warning Primacy**: Prominently displays disclaimers that official emergency warnings and evacuation directives from DHM and NDRRMA remain the sole legal authority.

---

## 3. High-Level Architecture

```
[ Open-Meteo API ]      [ DHM Hydrology Benchmark ]      [ BIPAD / DesInventar (1971-2026) ]
  (Live NWP Weather)       (Official Gauge Thresholds)         (13,185 Verified Incidents)
         │                           │                                    │
         ▼                           ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 MausamGuard Backend Core                               │
│                                                                                        │
│   ┌─────────────────────┐   ┌─────────────────────────┐   ┌────────────────────────┐   │
│   │ Weather Ingestion   │   │  Hydrology Service      │   │ Historical Analytics   │   │
│   └──────────┬──────────┘   └────────────┬────────────┘   └───────────┬────────────┘   │
│              │                           │                            │                │
│              └───────────────────────────┼────────────────────────────┘                │
│                                          ▼                                             │
│                           ┌──────────────────────────────┐                             │
│                           │  Explainable Risk Engine     │                             │
│                           │  - DHM Rainfall Warn Ref     │                             │
│                           │  - SRTM Logistic Model       │                             │
│                           │  - Crop Stress Model         │                             │
│                           └──────────────┬───────────────┘                             │
│                                          │                                             │
│                                          ▼                                             │
│                           ┌──────────────────────────────┐                             │
│                           │  Early Warning Alert Engine  │                             │
│                           │  - Fingerprint Deduplication │                             │
│                           │  - Priority Classification   │                             │
│                           └──────────────┬───────────────┘                             │
│                                          │                                             │
│                                          ▼                                             │
│                           ┌──────────────────────────────┐                             │
│                           │  FastAPI REST API Endpoints  │                             │
│                           │  (JWT Auth, RBAC, Audit Log) │                             │
│                           └──────────────┬───────────────┘                             │
└──────────────────────────────────────────┼─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Interactive React 18 Frontend                             │
│                                                                                        │
│   ┌──────────────────────┐   ┌────────────────────────┐   ┌────────────────────────┐   │
│   │ Fullscreen GIS Map   │   │ 77 Districts Explorer  │   │ Historical Catalog     │   │
│   │ (Leaflet Choropleth) │   │ (Palika Dossiers)      │   │ (13,185 Incidents)     │   │
│   └──────────────────────┘   └────────────────────────┘   └────────────────────────┘   │
│   ┌──────────────────────┐   ┌────────────────────────┐   ┌────────────────────────┐   │
│   │ Hydrology Monitor    │   │ Agriculture Stress     │   │ Operator Admin Portal  │   │
│   │ (DHM River Gauges)   │   │ (Crop Guidance)        │   │ (Data Quality Audit)   │   │
│   └──────────────────────┘   └────────────────────────┘   └────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Key Functional Modules

| Module | Route | Capabilities |
|---|---|---|
| **National Dashboard** | `/` | Top KPI summary cards, active early warnings, multi-hazard risk matrix, 24h rainfall ranking, river gauge benchmarks, seasonal charts. |
| **Interactive GIS Map** | `/map` | Fullscreen Leaflet map with 77-district GeoJSON choropleth, layer toggles (floods, landslides, rivers), slide-over district inspector. |
| **Districts Explorer** | `/districts` | Complete 77-district directory with province filters, sorting by casualties, events, rainfall, or population. |
| **District Detail** | `/district/:id` | In-depth profile with local palikas, nearest DHM river gauge, 1h-72h rainfall, explainable risk factors, and disaster history. |
| **Disaster Events Catalog**| `/events` | 13,185 verified historical events (1971–2026) filterable by hazard type, district, severity, and precision flags. |
| **Event Dossier** | `/events/:id` | Individual incident report with mini Leaflet pin and explicit geographic precision disclaimer. |
| **Early Warning Alerts** | `/alerts` | Deduplicated active warnings (WATCH, WARNING, HIGH WARNING, CRITICAL) with operator resolution workflow. |
| **Rainfall Monitor** | `/rainfall` | 1h, 3h, 6h, 12h, 24h, 48h, 72h district accumulations benchmarked against official DHM warning thresholds. |
| **River Gauge Monitor** | `/rivers` | Major river basin benchmark stations (Koshi, Narayani, Karnali, etc.) with warning/danger levels and feed transparency. |
| **Weather Forecast** | `/forecast` | 72-hour Open-Meteo numerical predictions and 24-hour hourly meteogram curve for any selected district. |
| **Agriculture Advisory**| `/agriculture` | Crop stress vulnerability (paddy, maize, wheat) examining waterlogging, excess rain, and general farmer advisory. |
| **Multi-Decadal Trends**| `/analytics` | Annual frequency (past 30 years), summer monsoon seasonality (June–Sept peak), and geographic hazard exposure tables. |
| **Data Sources & Licences**| `/sources` | Complete attribution registry covering providers, licenses, access dates, and known operational limitations. |
| **Risk Methodology** | `/methodology` | Mathematical equations, DHM reference levels, and SRTM DEM logistic regression parameters (ROC-AUC = 0.783). |
| **System Status** | `/system-status`| Real-time diagnostic telemetry monitoring backend services, database status, and external weather API freshness. |
| **Operator Admin** | `/admin` | Role-based console with user status toggle, data quality scorecard, manual safe refresh, and audit logs. |

---

## 5. Development & Execution Commands (Windows PowerShell)

### Prerequisites
- Python 3.12 or 3.13 installed
- Node.js v18+ installed

### Step 1: Virtual Environment & Backend Setup
```powershell
# Open Windows PowerShell in project root
cd c:\Users\User\Desktop\EWS

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend/requirements.txt
```

### Step 2: Validate Data & Seed Database
```powershell
# Validate dataset integrity (77 districts, 13,185 events, zero null coordinates)
python scripts/validate_dataset.py

# Import districts, palikas, DHM river gauges, and historical events
python scripts/import_historical_events.py

# Ingest live Open-Meteo weather
python scripts/refresh_weather.py

# Calculate multi-hazard risk engine scores
python scripts/calculate_risk.py

# Run master verification test suite
python scripts/run_all_checks.py
```

### Step 3: Launch Backend REST API
```powershell
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Base: `http://127.0.0.1:8000/api/v1`
- Interactive Swagger: `http://127.0.0.1:8000/docs`
- ReDoc Docs: `http://127.0.0.1:8000/redoc`

### Step 4: Launch Frontend Application
In a second PowerShell terminal:
```powershell
cd c:\Users\User\Desktop\EWS\frontend
npm install
npm run dev
```
- Access application: `http://localhost:5173`

---

## 6. Docker Containerized Deployment
```bash
docker compose up --build -d
```
- **Frontend**: `http://localhost:80`
- **Backend API**: `http://localhost:8000/api/v1`
- **Health Check**: `http://localhost:8000/api/v1/health`

---

## 7. Running Automated Tests

### Backend Unit & Integration Tests (Pytest)
```powershell
python -m pytest backend/tests -v
```
**Status**: **25 passed, 0 failed, 0 errors** across all test suites.

### Frontend TypeScript & Production Build Validation
```powershell
cd c:\Users\User\Desktop\EWS\frontend
npm run build
```
**Status**: **Built cleanly with 0 TypeScript errors (1,621 modules transformed)**.

---

## 8. Data Classification & Freshness Transparency

### What is Actually Real-Time:
- **Numerical Weather Observations**: Temperature, relative humidity, precipitation, wind speed, and soil moisture retrieved live from Open-Meteo every hour.
- **Hourly Forecast Horizons**: 6h, 12h, 24h, 48h, and 72h future precipitation models.
- **Dynamic Multi-Hazard Risk Scoring**: Recalculated dynamically as new weather forcing arrives.
- **Active Early Warning Alerts**: Generated dynamically with SHA-256 fingerprint deduplication.

### What is Historical:
- **Disaster Events Dataset**: 13,185 verified disaster records (1971–2026) cataloguing floods, landslides, and avalanches from BIPAD and DesInventar Sentinel.
- **National Census Baseline**: District population statistics from the 2021 Nepal Census.

### What is Forecast:
- **72-Hour Precipitation Models**: Numerical weather forecast ensembles indicating upcoming storm fronts.

### What is Calculated:
- **Antecedent Precipitation Index ($API_{72\text{h}}$)**: 3-day weighted soil moisture accumulation.
- **Landslide Susceptibility ($P_{\text{static}}$)**: Logistic regression baseline on SRTM DEM terrain slope.
- **Compound Multi-Hazard Score**: Weighted index combining flood, landslide, agriculture, and historical exposure.

### What is Not Available:
- **Real-Time DHM River Stage Heights**: Since official hydrology telemetry is not currently streamed via open public authenticated REST APIs, the system strictly marks these stations with `"Live DHM feed unavailable"` rather than inventing fabricated levels.

---

## 9. Security & Default Credentials
- Passwords hashed using native `bcrypt` with automatic 72-byte safe boundary truncation.
- Stateless HMAC-SHA256 JWT access tokens.
- Role-based permissions: `ADMIN`, `ANALYST`, `OPERATOR`, `VIEWER`.
- OWASP security headers (`CSP`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`).

### Evaluation Seed Credentials:
- **Username**: `admin`
- **Email**: `admin@mausamguard.gov.np`
- **Password**: `MausamGuardAdmin2026!`
- **Role**: `ADMIN`

---

## 10. Disclaimer
> This platform provides risk monitoring and decision-support information using available historical, observational, and forecast data. It is **not** a replacement for official emergency warnings or government instructions. Risk estimates contain uncertainty and may be affected by data availability, resolution, and model limitations. For official warnings and evacuation directives, always follow the relevant authorities: **Department of Hydrology and Meteorology (DHM)** and **National Disaster Risk Reduction and Management Authority (NDRRMA)**.
