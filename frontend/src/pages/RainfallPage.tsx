import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CloudRain,
  Droplets,
  AlertTriangle,
  Info,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldAlert,
  ArrowUpDown,
  Compass
} from 'lucide-react';
import { api } from '../api/client';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function RainfallPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [sortField, setSortField] = useState<string>('rain24h');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  useEffect(() => {
    loadRainfall();
  }, []);

  const loadRainfall = async () => {
    try {
      setLoading(true);
      const res = await api.getRainfallOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to load rainfall:', err);
    } finally {
      setLoading(false);
    }
  };

  const rawDistricts: any[] = data?.district_rainfall || data?.districts || [];
  const districts = rawDistricts
    .filter((d: any) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      const distName = (d.district || d.district_name || '').toLowerCase();
      const provName = (d.province || '').toLowerCase();
      const palikaMatch = Array.isArray(d.palikas) && d.palikas.some((p: string) => p.toLowerCase().includes(q));
      return distName.includes(q) || provName.includes(q) || palikaMatch;
    })
    .sort((a: any, b: any) => {
      let vA = a.rain_24h_mm ?? a.rain_24h ?? 0;
      let vB = b.rain_24h_mm ?? b.rain_24h ?? 0;
      if (sortField === 'rain1h') {
        vA = a.rain_1h_mm ?? a.rain_1h ?? 0;
        vB = b.rain_1h_mm ?? b.rain_1h ?? 0;
      } else if (sortField === 'rain72h') {
        vA = a.rain_72h_mm ?? a.rain_72h ?? 0;
        vB = b.rain_72h_mm ?? b.rain_72h ?? 0;
      } else if (sortField === 'name') {
        const nameA = a.district || a.district_name || '';
        const nameB = b.district || b.district_name || '';
        return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      return sortAsc ? vA - vB : vB - vA;
    });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DisclaimerBanner />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              <CloudRain className="w-4 h-4" />
              <span>Hydrometeorological Monitoring</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              Precipitation & Rainfall Accumulation
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Live district-wise rainfall observations and antecedent precipitation indices (1h, 3h, 6h, 12h, 24h, 48h, 72h) benchmarked against DHM rainfall warning thresholds.
            </p>
          </div>

          <button
            onClick={loadRainfall}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 rounded-xl transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* DHM Official Rainfall Warning Reference Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-400" />
                <span>Department of Hydrology & Meteorology (DHM) Rainfall Warning Reference</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Official national threshold guidelines for torrential rainfall risk escalation.
              </p>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono">
              Ref Standard: DHM Nepal
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl text-center">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">1 Hour</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">60 mm</div>
              <div className="text-[10px] text-slate-400">Flash Flood Alert</div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl text-center">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">3 Hours</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">80 mm</div>
              <div className="text-[10px] text-slate-400">High Inundation</div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl text-center">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">6 Hours</div>
              <div className="text-xl font-bold font-mono text-orange-400 mt-0.5">100 mm</div>
              <div className="text-[10px] text-slate-400">Elevated Warning</div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl text-center">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">12 Hours</div>
              <div className="text-xl font-bold font-mono text-orange-400 mt-0.5">120 mm</div>
              <div className="text-[10px] text-slate-400">Basin Saturation</div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl text-center col-span-2 sm:col-span-1">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">24 Hours</div>
              <div className="text-xl font-bold font-mono text-red-400 mt-0.5">140 mm</div>
              <div className="text-[10px] text-slate-400">Severe Red Warning</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong>Scientific Notice:</strong> These reference thresholds are not universal deterministic triggers. Actual slope failures and riverine inundations depend on antecedent soil moisture, local geomorphology, and catchment drainage network density.
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 border border-slate-800 p-3 rounded-2xl">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search district, province, or local palika (e.g. Joshipur, Tikapur)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-8 py-2 rounded-xl focus:outline-none focus:border-blue-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400">Sort by:</span>
            <button
              onClick={() => setSortField('rain24h')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                sortField === 'rain24h' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              24h Rain
            </button>
            <button
              onClick={() => setSortField('rain72h')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                sortField === 'rain72h' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              72h API
            </button>
            <button
              onClick={() => setSortField('rain1h')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                sortField === 'rain1h' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              1h Intensity
            </button>
          </div>
        </div>

        {/* Districts Rainfall Table */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Province</th>
                  <th className="py-3 px-4 font-mono">1h (mm)</th>
                  <th className="py-3 px-4 font-mono">3h (mm)</th>
                  <th className="py-3 px-4 font-mono">6h (mm)</th>
                  <th className="py-3 px-4 font-mono">12h (mm)</th>
                  <th className="py-3 px-4 font-mono">24h (mm)</th>
                  <th className="py-3 px-4 font-mono">48h (mm)</th>
                  <th className="py-3 px-4 font-mono">72h (mm)</th>
                  <th className="py-3 px-4">DHM 24h Threshold Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                      Loading rainfall telemetry...
                    </td>
                  </tr>
                ) : districts.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-500">
                      No matching district or local palika records found.
                    </td>
                  </tr>
                ) : (
                  districts.map((d: any, idx: number) => {
                    const distName = d.district || d.district_name || 'District';
                    const r24 = d.rain_24h_mm ?? d.rain_24h ?? 0;
                    const r1 = d.rain_1h_mm ?? d.rain_1h ?? 0;
                    const r3 = d.rain_3h_mm ?? d.rain_3h ?? 0;
                    const r6 = d.rain_6h_mm ?? d.rain_6h ?? 0;
                    const r12 = d.rain_12h_mm ?? d.rain_12h ?? 0;
                    const r48 = d.rain_48h_mm ?? d.rain_48h ?? 0;
                    const r72 = d.rain_72h_mm ?? d.rain_72h ?? 0;
                    const isOverWarning = r24 >= 140;
                    const isModerate = r24 >= 70;

                    const trimmedSearch = search.toLowerCase().trim();
                    const matchingPalikas = trimmedSearch && Array.isArray(d.palikas)
                      ? d.palikas.filter((p: string) => p.toLowerCase().includes(trimmedSearch))
                      : [];

                    return (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-white">
                          <Link to={`/district/${distName}`} className="hover:text-blue-400 text-sky-200">
                            {distName}
                          </Link>
                          {matchingPalikas.length > 0 && (
                            <div className="text-[10px] text-emerald-400 font-normal mt-0.5">
                              Matched Palika: {matchingPalikas.slice(0, 3).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400">{d.province || 'Nepal'}</td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-300">
                          {r1.toFixed(1)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {r3.toFixed(1)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {r6.toFixed(1)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {r12.toFixed(1)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-sky-400">
                          {r24.toFixed(1)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {r48.toFixed(1)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {r72.toFixed(1)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isOverWarning
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : isModerate
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            }`}
                          >
                            {isOverWarning ? 'EXCEEDS 140mm REF' : isModerate ? 'Elevated' : 'Below 140mm Ref'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/district/${distName}`}
                            className="text-blue-400 hover:text-blue-300 font-semibold"
                          >
                            Profile
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
