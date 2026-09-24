# MausamGuard Nepal - Operational Limitations & Uncertainty

## 1. Decision Support, Not Deterministic Prediction
MausamGuard Nepal is a **multi-hazard risk monitoring and decision-support system**. It does **not** claim 100% deterministic disaster prediction. Slope failures and flash floods are complex non-linear physical phenomena influenced by subsurface lithology, seismic shaking history, tectonic shear zones, anthropogenic slope cutting (road construction), and localized cloudburst dynamics that exceed current gridded sensor resolution.

---

## 2. Live DHM River Telemetry Access
While benchmark DHM river gauge stations and official warning/danger threshold elevations are integrated, **real-time river stage height feeds are subject to government portal availability**. When DHM telemetry APIs are not publicly streaming authenticated REST data, the system strictly reports:
> `"Live DHM feed unavailable"`

**Under no circumstances does this platform fabricate artificial river stage readings.** Users must refer to `hydrology.gov.np` for live siren monitoring.

---

## 3. Spatial Resolution Constraints
- **Numerical Weather Prediction (Open-Meteo)**: Forecast grids typically operate at resolutions between ~2 km and ~11 km. Extreme localized micro-climate phenomena (such as high-altitude Himalayan cloudbursts) may fall between grid centroids.
- **Topographic DEM (SRTM)**: Digital elevation parameters are derived from 30m resolution SRTM datasets. Micro-topographic features smaller than 30m (such as newly cut roadside retaining walls) are not represented.
- **Historical Event Georeferencing**: Approximately 12% of historical disaster records (particularly pre-2000 events) are geocoded to the municipal or district centroid rather than exact GPS waypoints. Such records are explicitly marked with `geo_precision: approximate` or `centroid` in the user interface.

---

## 4. Agricultural Micro-Plot Boundaries
Agro-meteorological risk assessments apply to general district-level cereal cropping zones. Farm-level soil pH, micro-irrigation systems, and localized terrace drainage systems are not individually surveyed. All recommendations are general agricultural preparedness advisories.

---

## 5. Authoritative Emergency Directives
**Official warnings issued by the Department of Hydrology and Meteorology (DHM) and the National Disaster Risk Reduction and Management Authority (NDRRMA) remain the sole legal and authoritative emergency directives for Nepal.**
