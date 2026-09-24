# Data Sources & Attribution - MausamGuard Nepal

This document provides transparent, exhaustive attribution for every data source, catalog, API, and boundary model integrated into **MausamGuard Nepal**.

---

## 1. Nepal Multi-Hazard Historical Disaster Dataset

- **Source Name:** Nepal Water & Slope Hazard Explorer / BIPAD & DesInventar Sentinel Compiled Feed
- **Dataset Name:** Compiled Disaster Events in Nepal (1971–2026)
- **Primary Providers:**
  - National Disaster Risk Reduction and Management Authority (NDRRMA) – BIPAD Portal
  - United Nations Office for Disaster Risk Reduction (UNDRR) / DesInventar Sentinel
  - ICIMOD (International Centre for Integrated Mountain Development)
  - Nepal Police & Ministry of Home Affairs (MoHA)
- **URL:** [https://bipadportal.gov.np](https://bipadportal.gov.np) | [https://www.desinventar.net](https://www.desinventar.net)
- **Licence:** Varies by original source. DesInventar and BIPAD represent open government disaster reporting; ICIMOD disaster records are distributed under **CC BY 4.0**.
- **Access Date:** 2026-09-24
- **Usage Purpose:** Provides a 55-year empirical record of 13,185 verified disaster events across all 77 districts, enabling calculation of historical hazard density, decadal trend analysis, and casualty baselines.
- **Attribution Requirement:** *"Historical hazard-event data: Nepal Water & Slope Hazard Explorer, compiled from BIPAD/Nepal DRR Portal, DesInventar Sentinel and documented disaster reports. See source documentation for original-provider licences."*
- **Data Limitations:**
  - Reporting frequency and spatial precision significantly improved post-2011 with the launch of digitized police reporting.
  - Older events (1970s–1990s) frequently lack village-level coordinates and are pinned to district or municipal centroids.
  - Absence of a recorded event does not guarantee absence of physical hazard.

---

## 2. Weather Forecast & Observations API

- **Source Name:** Open-Meteo Weather API
- **Dataset Name:** Seamless High-Resolution NWP Ensemble (GFS, ECMWF, ICON)
- **Provider:** Open-Meteo GmbH
- **URL:** [https://open-meteo.com](https://open-meteo.com)
- **Licence:** Attribution required (**CC BY 4.0**) for open numerical weather prediction model data.
- **Access Date:** Real-time dynamic API queries (with 20–30 minute local cache).
- **Usage Purpose:** Ingests live district-level temperature, relative humidity, precipitation, wind speed, weather code, soil moisture, and 6h/12h/24h/48h/72h forecast accumulations.
- **Attribution Requirement:** *"Weather forecast and current observations provided by Open-Meteo API (CC BY 4.0)."*
- **Data Limitations:**
  - Synoptic numerical weather prediction models have a spatial resolution of ~11 km. Steep mountain slopes and narrow Himalayan gorges can experience localized microclimatic precipitation not captured by regional grids.

---

## 3. Hydrological Warning Thresholds & River Monitoring

- **Source Name:** Department of Hydrology and Meteorology (DHM), Nepal
- **Dataset Name:** Official Rainfall Warning Thresholds & River Gauge Reference Levels
- **Provider:** Ministry of Energy, Water Resources and Irrigation, Government of Nepal
- **URL:** [https://hydrology.gov.np](https://hydrology.gov.np) | [https://dhm.gov.np](https://dhm.gov.np)
- **Licence:** Government of Nepal Open Public Monitoring Data.
- **Access Date:** 2026-09-24
- **Usage Purpose:** Supplies official benchmark rainfall warning levels:
  - **60 mm / 1 hour**
  - **80 mm / 3 hours**
  - **100 mm / 6 hours**
  - **120 mm / 12 hours**
  - **140 mm / 24 hours**
  and major river warning and danger gauge heights (Devghat, Chatara, Chisapani, Kusum, Karmaiya, Betrawati, Mulghat, Parigaon).
- **Attribution Requirement:** *"Rainfall and river warning threshold references provided by Department of Hydrology and Meteorology (DHM), Government of Nepal."*
- **Data Limitations:**
  - Automated public machine-readable JSON feeds for live river sensor telemetry are not currently published on open endpoints. The system displays *"Live DHM feed unavailable"* rather than fabricating simulated river numbers.

---

## 4. Satellite Precipitation Ingestion

- **Source Name:** NASA Global Precipitation Measurement (GPM)
- **Dataset Name:** Integrated Multi-satellitE Retrievals for GPM (IMERG) Late Precipitation L3
- **Provider:** NASA Goddard Earth Sciences Data and Information Services Center (GES DISC)
- **URL:** [https://gpm.nasa.gov](https://gpm.nasa.gov)
- **Licence:** NASA Open Data Policy (Unrestricted access for research and public benefit).
- **Access Date:** 2026-09-22 calibrated release.
- **Usage Purpose:** Basin-wide antecedent precipitation index (API) calibration across high-altitude and trans-Himalayan catchments where surface rain gauges are sparse.
- **Attribution Requirement:** *"NASA GPM IMERG Late daily precipitation provided by NASA GES DISC."*
- **Data Limitations:**
  - Satellite retrieval latency is ~14 to 16 hours. Complex high-relief topography may produce slight convective cloud overestimates or valley shadow underestimates.

---

## 5. Administrative Boundaries

- **Source Name:** UN OCHA Humanitarian Data Exchange (HDX) / Survey Department of Nepal
- **Dataset Name:** Nepal Common Operational Datasets on Administrative Boundaries (COD-AB)
- **Provider:** Survey Department, Government of Nepal / UN OCHA
- **URL:** [https://data.humdata.org/dataset/cod-ab-npl](https://data.humdata.org/dataset/cod-ab-npl)
- **Licence:** Creative Commons Attribution for Intergovernmental Organisations (CC BY-IGO).
- **Access Date:** 2026-08-29
- **Usage Purpose:** Vector geometries and standard administrative codes (P-codes) for all 77 districts and 753 local level administrative units (Palikas).
- **Attribution Requirement:** *"Administrative boundaries provided by Survey Department of Nepal / UN OCHA HDX."*
- **Data Limitations:**
  - Boundaries reflect official federal constitutional demarcations. Minor cartographic simplifications applied for vector rendering efficiency.

---

## 6. Basemap & Geographic Tile Providers

- **Source Name:** OpenStreetMap
- **Dataset Name:** CartoDB Dark Matter / Positron & OpenStreetMap Standard Tiles
- **Provider:** OpenStreetMap Foundation & CARTO
- **URL:** [https://www.openstreetmap.org](https://www.openstreetmap.org) | [https://carto.com](https://carto.com)
- **Licence:** Open Database License (ODbL) © OpenStreetMap contributors.
- **Attribution Requirement:** *"© OpenStreetMap contributors, © CARTO"*
