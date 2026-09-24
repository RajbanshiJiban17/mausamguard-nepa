import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Compass,
  Database,
  Lock,
  Cpu,
  Layers,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DisclaimerBanner />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3 py-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800 text-xs font-semibold text-blue-400">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>MausamGuard Nepal Decision Support System</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Monitor. Assess. Warn.
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Real-Time Flood, Landslide & Agriculture Risk Monitoring and Early Warning Decision Support System for Nepal covering all 77 districts and 752 local municipalities.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl space-y-2">
            <Compass className="w-6 h-6 text-blue-400" />
            <h3 className="font-bold text-white text-base">77-District GIS</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete geographic boundary coverage, topological centroid coordinates, and administrative hierarchy down to municipal palika units.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl space-y-2">
            <Database className="w-6 h-6 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Zero Fabrication</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strict adherence to truth in data. When live DHM telemetry is unreachable, feeds are explicitly labelled "Live feed unavailable" rather than inventing simulated values.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl space-y-2">
            <Lock className="w-6 h-6 text-amber-400" />
            <h3 className="font-bold text-white text-base">Enterprise Security</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              OWASP-hardened FastAPI backend, argon2/bcrypt password protection, JWT authentication, RBAC authorization, and comprehensive audit trail logging.
            </p>
          </div>
        </div>

        {/* System Architecture & Technology */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <span>Technology Architecture</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="font-bold text-blue-400 uppercase text-[10px] tracking-wider">Backend & Risk Engine</div>
              <ul className="space-y-1.5 text-slate-400">
                <li>• <strong>Python 3.12 + FastAPI:</strong> High-performance async REST API</li>
                <li>• <strong>SQLAlchemy ORM + SQLite / PostgreSQL:</strong> Relational schema & PostGIS spatial indexing</li>
                <li>• <strong>Pydantic v2:</strong> Strict request/response validation</li>
                <li>• <strong>APScheduler:</strong> Background weather & telemetry ingestion</li>
                <li>• <strong>SRTM DEM Logistic Model:</strong> Validated AUC = 0.783 for slope failure</li>
              </ul>
            </div>

            <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider">Frontend & GIS</div>
              <ul className="space-y-1.5 text-slate-400">
                <li>• <strong>React 18 + Vite + TypeScript:</strong> Fast modern single-page application</li>
                <li>• <strong>Leaflet GIS:</strong> Dynamic GeoJSON choropleth & vector layers</li>
                <li>• <strong>Tailwind CSS & Vanilla Design Tokens:</strong> Glassmorphism dark mode aesthetic</li>
                <li>• <strong>Lucide Icons:</strong> Consistent accessibility icon system</li>
                <li>• <strong>CartoDB Dark Matter:</strong> High-contrast GIS cartography</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Official Warnings Notice */}
        <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Important Operational Disclaimer</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            This platform provides risk monitoring and decision-support information using available historical, observational and forecast data. It is not a replacement for official emergency warnings or government instructions. Risk estimates contain uncertainty and may be affected by data availability, resolution and model limitations. For official warnings, follow the relevant authorities such as Nepal's <strong>Department of Hydrology and Meteorology (DHM)</strong> and <strong>National Disaster Risk Reduction and Management Authority (NDRRMA)</strong>.
          </p>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link
            to="/map"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
          >
            <span>Launch Live Risk Map</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/sources"
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-semibold transition-all"
          >
            View Data Sources
          </Link>
        </div>
      </main>
    </div>
  );
}
