import React from 'react';
import {
  Brain,
  ShieldCheck,
  Droplets,
  Mountain,
  Wheat,
  Sliders,
  Layers,
  Info,
  AlertTriangle,
  Compass,
  FileCode2
} from 'lucide-react';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DisclaimerBanner />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <Brain className="w-4 h-4" />
            <span>Explainable Disaster Risk Analytics</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            Multi-Hazard Early Warning Methodology
          </h1>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Technical formulation of the hybrid multi-hazard risk engine combining official DHM rainfall thresholds, topographic terrain parameters (SRTM DEM), and antecedent precipitation indices.
          </p>
        </div>

        {/* 1. Transparent Architecture Overview */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-md">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <span>1. Explainable Hybrid Risk Architecture</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            In disaster response and civil defense, black-box machine learning models that generate opaque predictions without audit trails are dangerous. MausamGuard Nepal implements an <strong>explainable, auditable hybrid risk engine</strong>. Every computed risk score explicitly links to verifiable physical inputs: rainfall accumulation, antecedent moisture, terrain slope, drainage proximity, and historical hazard density.
          </p>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl font-mono text-xs text-blue-300 space-y-1">
            <div>// Master Multi-Hazard Compound Risk Index Formulation</div>
            <div className="text-slate-200">R_total = 0.40 * R_flood + 0.35 * R_landslide + 0.15 * R_agriculture + 0.10 * H_exposure</div>
            <div className="text-slate-500">// Bounded [0.0 - 1.0] mapping to LOW, MODERATE, HIGH, VERY HIGH, CRITICAL</div>
          </div>
        </section>

        {/* 2. Flood Risk Model */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-md">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Droplets className="w-5 h-5 text-sky-400" />
            <span>2. Inundation & Flood Risk Formulation</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            The flood module correlates real-time and antecedent precipitation against official <strong>Department of Hydrology and Meteorology (DHM) Nepal</strong> warning reference thresholds, coupled with Height Above Nearest Drainage (HAND) topographic valley constraints.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
              <div className="font-semibold text-slate-200 mb-1">DHM Rainfall Warning References:</div>
              <ul className="space-y-1 text-slate-400">
                <li>• 1 hour: <strong>60 mm</strong> (Flash flood initiation)</li>
                <li>• 3 hours: <strong>80 mm</strong> (Rapid surface inundation)</li>
                <li>• 6 hours: <strong>100 mm</strong> (Medium basin saturation)</li>
                <li>• 12 hours: <strong>120 mm</strong> (Catchment overflow)</li>
                <li>• 24 hours: <strong>140 mm</strong> (Major regional flood warning)</li>
              </ul>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
              <div className="font-semibold text-slate-200 mb-1">Hydromorphologic Modifiers:</div>
              <ul className="space-y-1 text-slate-400">
                <li>• Catchment HAND drainage proximity</li>
                <li>• Historical flood frequency density</li>
                <li>• Forecast 24h precipitation trajectory</li>
                <li>• River gauge stage status & trend</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Landslide Susceptibility Model */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-md">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Mountain className="w-5 h-5 text-amber-400" />
            <span>3. Slope Failure & Landslide Risk Formulation</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            The landslide model integrates a calibrated logistic regression susceptibility baseline derived from high-resolution Shuttle Radar Topography Mission (SRTM) DEM geomorphometry:
          </p>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl font-mono text-xs text-amber-300 space-y-1">
            <div>// Logistic Susceptibility Baseline (Validated ROC-AUC = 0.783)</div>
            <div className="text-slate-200">z = -2.85 + 0.082*slope_deg - 0.004*hand + 0.025*steep_near + 0.0012*relief_up</div>
            <div className="text-slate-200">P_static = 1 / (1 + exp(-z))</div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Static susceptibility is dynamically scaled by the <strong>Antecedent Precipitation Index (API_72h)</strong>:
          </p>
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl font-mono text-xs text-slate-300">
            API_72h = Rain_24h + (0.80 * Rain_48h) + (0.64 * Rain_72h)
          </div>
        </section>

        {/* 4. Agriculture Vulnerability Model */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-md">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Wheat className="w-5 h-5 text-emerald-400" />
            <span>4. Agro-Meteorological Stress Module</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Evaluates abiotic environmental stress factors on dominant cereal and cash crops across Nepal's agro-ecological zones (Terai, Hills, Mountains):
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 pl-4 list-disc">
            <li><strong>Waterlogging / Root Anoxia:</strong> Excessive 24h precipitation exceeding 75 mm in flat terai drainage basins.</li>
            <li><strong>Thermal Extremes:</strong> Temperatures exceeding 38°C (heat stress during grain filling) or falling below 4°C (frost damage in mountain valleys).</li>
            <li><strong>Forecast Trajectory:</strong> Upcoming 48h storm fronts during critical harvest and planting windows.</li>
          </ul>
        </section>

        {/* 5. Non-Deterministic Disclaimers */}
        <section className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Operational Boundary & Disclaimers</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            This system is a <strong>decision-support tool</strong>, not a deterministic disaster predictor. All hazard indicators are expressed as <strong>"Risk Level"</strong> and <strong>"Potential Hazard"</strong>. Official early warnings, flood sirens, and evacuation directives issued by the <strong>Department of Hydrology and Meteorology (DHM)</strong> and the <strong>National Disaster Risk Reduction and Management Authority (NDRRMA)</strong> remain the sole authoritative emergency sources for Nepal.
          </p>
        </section>
      </main>
    </div>
  );
}
