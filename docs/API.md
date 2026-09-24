# MausamGuard Nepal - REST API Specification

**Base URL**: `/api/v1`  
**Interactive Swagger Docs**: `http://localhost:8000/docs`  
**ReDoc Reference**: `http://localhost:8000/redoc`

---

## 1. Authentication Endpoints
- `POST /api/v1/auth/login`
  - Body: `{"username_or_email": "admin", "password": "..."}`
  - Response: `{"access_token": "...", "token_type": "bearer", "user": {...}}`
- `POST /api/v1/auth/register`
  - Body: `{"username": "...", "email": "...", "password": "...", "full_name": "..."}`
- `GET /api/v1/auth/me`
  - Header: `Authorization: Bearer <token>`
  - Response: Current user session details

---

## 2. Spatial & Districts Endpoints
- `GET /api/v1/districts`
  - Query Params: `province` (optional), `search` (optional)
  - Returns: Array of all 77 districts with summary hazard and risk metrics.
- `GET /api/v1/districts/geojson`
  - Returns: Valid RFC 7946 FeatureCollection of Nepal district boundaries for Leaflet GIS.
- `GET /api/v1/districts/{district_id_or_name}`
  - Returns: Comprehensive district dossier with municipal palikas, nearest river station, and historical casualty breakdown.
- `GET /api/v1/districts/compare?ids=Kathmandu,Lalitpur,Bhaktapur`
  - Returns: Comparative multi-hazard matrix across selected districts.

---

## 3. Historical Disaster Events Endpoints
- `GET /api/v1/events`
  - Query Params: `page`, `page_size`, `hazard`, `district`, `min_deaths`, `year`
  - Returns: Paginated verified historical disaster events (1971–2026).
- `GET /api/v1/events/geojson`
  - Query Params: `hazard`, `district`, `limit`
  - Returns: FeatureCollection of Point geometries for high-performance map rendering.
- `GET /api/v1/events/{event_id}`
  - Returns: Individual event dossier with coordinates, geo_precision flag, and original source URL.
- `GET /api/v1/events/stats/summary`
  - Returns: Aggregate casualties, total events, and hazard breakdown.
- `GET /api/v1/events/stats/yearly`
  - Returns: Annual incident frequency array for line and bar trend charts.
- `GET /api/v1/events/stats/monthly`
  - Returns: Calendar month distribution showing the summer monsoon peak.

---

## 4. Risk Engine Endpoints
- `GET /api/v1/risk/districts`
  - Query Params: `province`, `min_level`
  - Returns: National risk matrix evaluating Flood, Landslide, and Agriculture risk across all 77 districts.
- `GET /api/v1/risk/{district_id_or_name}`
  - Returns: Localized risk score, risk level, contributing factors, and explainable text rationale.

---

## 5. Early Warning Alerts Endpoints
- `GET /api/v1/alerts`
  - Query Params: `hazard`, `priority`, `district`
  - Returns: Active deduplicated early warning alerts.
- `GET /api/v1/alerts/history`
  - Returns: Historical audit log of expired and resolved alerts.
- `POST /api/v1/alerts/{alert_id}/resolve`
  - Header: `Authorization: Bearer <token>`
  - Body: `{"notes": "Field inspection confirmed receding water levels."}`
  - Returns: Updated alert state marked `resolved`.

---

## 6. Hydrometeorological Endpoints
- `GET /api/v1/rainfall`
  - Returns: National rainfall overview and district 1h to 72h accumulations.
- `GET /api/v1/rainfall/{district_name}`
  - Returns: Local district precipitation series against DHM warning thresholds.
- `GET /api/v1/river-stations`
  - Query Params: `basin`, `district`
  - Returns: Major basin benchmark river stations, warning levels, danger levels, and feed status.
- `GET /api/v1/forecast/{district_name}`
  - Returns: Open-Meteo 72h horizons (6h, 12h, 24h, 48h, 72h) and hourly meteogram forecast.
- `GET /api/v1/agriculture-risk`
  - Query Params: `crop_risk_level`
  - Returns: Agricultural vulnerability scores, waterlogging stress, and seasonal advisory.

---

## 7. Admin & Governance Endpoints
- `GET /api/v1/admin/dashboard`
  - Requires: `ADMIN` or `OPERATOR` role
  - Returns: System overview telemetry.
- `GET /api/v1/admin/data-quality`
  - Returns: Integrity scorecard verifying 0 missing coordinates, 0 invalid dates, 0 duplicates.
- `GET /api/v1/admin/audit-logs`
  - Returns: Immutable security audit trails.
- `POST /api/v1/admin/trigger-refresh`
  - Manually triggers safe background ingestion and risk re-calculation.
