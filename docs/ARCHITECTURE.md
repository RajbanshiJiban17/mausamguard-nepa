# MausamGuard Nepal - System Architecture

## 1. High-Level Architectural Overview

MausamGuard Nepal is architected as a layered, decoupled, resilient multi-hazard early warning and risk analytics system specifically tailored for Nepal's mountainous topography and river networks.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA INGESTION LAYER                            │
│  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────────────┐ │
│  │ Historical Feed  │  │ Live Weather API  │  │ DHM Warning Baseline │ │
│  │ (events.geojson) │  │  (Open-Meteo)     │  │ (Thresholds/Sensors) │ │
│  └─────────┬────────┘  └─────────┬─────────┘  └──────────┬───────────┘ │
└────────────┼─────────────────────┼───────────────────────┼─────────────┘
             │                     │                       │
             ▼                     ▼                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA PIPELINE & CACHE                           │
│  - Validation & Deduplication                                          │
│  - In-memory / Redis Cache (TTL: 20-30 min)                            │
│  - Antecedent Precipitation Accumulator (1h, 3h, 6h, 12h, 24h, 72h)    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         MULTI-HAZARD RISK ENGINE                       │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌─────────────────┐ │
│  │     Flood Model      │ │   Landslide Model    │ │Agriculture Model│ │
│  │ - DHM rain thresholds│ │ - SRTM terrain model │ │- Crop stress    │ │
│  │ - Drainage proximity │ │ - Antecedent rain API│ │- Waterlogging   │ │
│  │ - River status/trend │ │ - 24h/72h saturation │ │- Action guidance│ │
│  └──────────┬───────────┘ └──────────┬───────────┘ └────────┬────────┘ │
└─────────────┼────────────────────────┼──────────────────────┼──────────┘
              └────────────────────┬───┘                      │
                                   ▼                          │
┌─────────────────────────────────────────────────────────────┼──────────┐
│                   EARLY WARNING & ALERT ENGINE              │          │
│  - Multi-tier priority: INFO, WATCH, WARNING, HIGH, CRITICAL│          │
│  - Deduplication Fingerprinting                             │          │
│  - Escalation & Expiration Lifecycle                        │          │
└──────────────────────────────────┬──────────────────────────┴──────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND API SERVICE (FastAPI)                   │
│  - RESTful API (v1) with Pydantic v2 schemas                           │
│  - JWT Authentication, bcrypt password hashing                         │
│  - Role-Based Access Control (ADMIN, ANALYST, OPERATOR, VIEWER)        │
│  - Security Headers (CSP, X-Frame, HSTS, Permissions-Policy)           │
│  - Audit Logging & Health Diagnostics                                  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ JSON / GeoJSON
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND PRESENTATION LAYER (React)                 │
│  - Leaflet GIS Interactive Map (77 Districts, Events, Choropleth)      │
│  - Live Dashboard, KPI Cards, Historical Analytics                     │
│  - District Details, Event Inspector, River & Rainfall Monitors        │
│  - Admin Console & System Status Diagnostics                           │
└────────────────────────────────────────────────────────────────────────┘
```

## 2. Core Subsystems

### A. Data Segregation Layer
Data is strictly segregated into discrete tiers:
1. `historical`: Static baseline of 13,185 verified records (1971–2026).
2. `observations`: Live meteorological and hydrological readings.
3. `forecast`: 6h to 72h forecast horizons.
4. `risk`: Dynamically derived risk scores (0–100) and levels.
5. `alerts`: Active, expired, and resolved early warnings.
6. `boundaries`: Administrative polygons for all 77 districts and 753 palikas.

### B. Risk Calculation Engine
- **Flood Risk**: Compares current/antecedent precipitation directly against DHM warning levels (60mm/1h, 80mm/3h, 100mm/6h, 120mm/12h, 140mm/24h), adds river trend modifiers and Height Above Nearest Drainage (HAND).
- **Landslide Risk**: Applies an empirical logistic regression model calibrated on SRTM terrain features (`slope_deg`, `hand`, `steep_near`, `relief_up`, `elev`, held-out AUC 0.783) modulated by the Antecedent Precipitation Index ($API_{72h}$).
- **Agriculture Risk**: Evaluates soil moisture saturation, extreme temperatures, and inundation exposure to output actionable farming guidance.
- **Explainability**: Every risk score produces a list of human-readable trigger factors and an audit snapshot.

### C. Alert Deduplication & Fingerprinting
Alerts are identified by a deterministic fingerprint:
`fingerprint = district:hazard:risk_level:trigger_type`
This prevents alert storms on repeated ingestion cycles and only updates when risk levels escalate or expire.
