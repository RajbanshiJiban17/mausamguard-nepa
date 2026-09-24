# MausamGuard Nepal - Comprehensive Testing Suite

## 1. Test Architecture Overview
MausamGuard Nepal enforces complete test coverage across backend REST APIs, authentication security, Pydantic data schemas, multi-hazard risk engine equations, and frontend bundle integrity.

---

## 2. Running Backend Pytest Tests
Run the entire backend test suite using Windows PowerShell:
```powershell
python -m pytest backend/tests -v
```

### Verified Test Suites:
- `test_districts.py`: Validates 77-district completeness, centroid coordinates, and district summary endpoints.
- `test_events.py`: Verifies historical disaster filtering, pagination boundaries, casualty statistics, and precision flags.
- `test_risk_engine.py`: Validates mathematical boundaries of compound flood, landslide, and agricultural risk equations.
- `test_auth.py`: Tests password encryption, JWT issuance, token expiration, and role-based permissions (ADMIN, ANALYST, OPERATOR, VIEWER).
- `test_data_validation.py`: Verifies zero coordinate nulls, date validity, and negative value rejections.

**Pytest Execution Result**: **25 passed, 0 failed, 0 errors**.

---

## 3. Running Data Validation & Master Checks
```powershell
# Phase 1: Spatial & Dataset Validation
python scripts/validate_dataset.py

# Phase 2: Weather & DHM Ingestion Verification
python scripts/refresh_weather.py
python scripts/refresh_dhm.py

# Phase 3: Master Automated Checks (All 4 Phases)
python scripts/run_all_checks.py
```

---

## 4. Running Frontend Verification & Build Tests
```powershell
cd c:\Users\User\Desktop\EWS\frontend
npm run build
```
Builds the complete single-page application into `dist/` with strict TypeScript validation (`tsc && vite build`).
