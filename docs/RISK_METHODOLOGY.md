# MausamGuard Nepal - Multi-Hazard Risk Methodology

## 1. Principles of Explainable Disaster Risk Analytics
Disaster risk analytics must prioritize transparency over black-box complexity. MausamGuard Nepal formulates risk assessments through physically grounded, auditable equations that relate meteorological forcing, terrain susceptibility, and historical exposure.

---

## 2. Multi-Hazard Composite Formulation
The district-level Compound Hazard Score ($R_{\text{total}}$) is calculated as:

$$R_{\text{total}} = 0.40 \cdot R_{\text{flood}} + 0.35 \cdot R_{\text{landslide}} + 0.15 \cdot R_{\text{agri}} + 0.10 \cdot H_{\text{exposure}}$$

Where:
- $R_{\text{flood}} \in [0.0, 1.0]$: Flood inundation and riverine surge risk.
- $R_{\text{landslide}} \in [0.0, 1.0]$: Slope instability and debris flow risk.
- $R_{\text{agri}} \in [0.0, 1.0]$: Agricultural crop stress index.
- $H_{\text{exposure}} \in [0.0, 1.0]$: Historical disaster frequency density from 1971–2026.

Risk scores are categorized into five non-deterministic operational levels:
- **LOW**: $[0.00, 0.25)$
- **MODERATE**: $[0.25, 0.45)$
- **HIGH**: $[0.45, 0.65)$
- **VERY HIGH**: $[0.65, 0.85)$
- **CRITICAL**: $[0.85, 1.00]$

---

## 3. Flood Risk Engine
Flood hazard evaluates observed and forecast precipitation against the official **Department of Hydrology and Meteorology (DHM) Nepal** rainfall warning reference thresholds:
- $P_{\text{1h}} \ge 60\text{ mm}$ (Flash flood alert)
- $P_{\text{3h}} \ge 80\text{ mm}$ (Surface runoff inundation)
- $P_{\text{6h}} \ge 100\text{ mm}$ (Sub-catchment saturation)
- $P_{\text{12h}} \ge 120\text{ mm}$ (Catchment-wide flooding)
- $P_{\text{24h}} \ge 140\text{ mm}$ (Severe basin flood danger)

### Modifiers:
1. **Topographic Confinement**: Height Above Nearest Drainage (HAND) factor penalizes river valley floors.
2. **Forecast Velocity**: Upcoming 24-hour Open-Meteo precipitation trajectory.
3. **River Stage Proximity**: Distance of nearest active DHM river station to Warning and Danger markers.

---

## 4. Landslide Susceptibility & Dynamic Triggering
Landslide risk combines a static terrain susceptibility baseline with dynamic antecedent moisture:

### A. Static Geomorphometric Susceptibility ($P_{\text{static}}$)
Calibrated via logistic regression from Shuttle Radar Topography Mission (SRTM) DEM variables (validated ROC-AUC = 0.783):

$$z = -2.85 + 0.082 \cdot \text{slope\_deg} - 0.004 \cdot \text{hand} + 0.025 \cdot \text{steep\_near} + 0.0012 \cdot \text{relief\_up}$$
$$P_{\text{static}} = \frac{1}{1 + e^{-z}}$$

### B. Antecedent Precipitation Index ($API_{72\text{h}}$)
Soil saturation decay formula:

$$API_{72\text{h}} = P_{24\text{h}} + (0.80 \cdot P_{48\text{h}}) + (0.64 \cdot P_{72\text{h}})$$

Dynamic landslide risk elevates sharply when $API_{72\text{h}} > 80\text{ mm}$ coincides with slopes $> 25^\circ$.

---

## 5. Early Warning Fingerprint Deduplication
To prevent alert flooding, the system computes a SHA-256 state fingerprint:

$$\text{Fingerprint} = \text{hash}(\text{district} + \text{hazard} + \text{risk\_level} + \text{trigger\_type})$$

A new alert is dispatched only when:
1. A previously active alert has expired.
2. The risk level escalates (e.g. from WATCH to WARNING).
3. A material change in hydrometeorological forcing is observed.
