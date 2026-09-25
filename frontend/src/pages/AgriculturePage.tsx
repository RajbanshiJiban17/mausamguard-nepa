import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wheat,
  Sprout,
  AlertTriangle,
  Droplets,
  Thermometer,
  ShieldAlert,
  Search,
  RefreshCw,
  Info,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { api } from '../api/client';
import RiskBadge from '../components/RiskBadge';
import DisclaimerBanner from '../components/DisclaimerBanner';
import Pagination from '../components/Pagination';

export default function AgriculturePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedRisk]);

  useEffect(() => {
    loadAgricultureData();
  }, []);

  const loadAgricultureData = async () => {
    try {
      setLoading(true);
      const res = await api.getAgricultureOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to load agriculture overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const rawAssessments: any[] = data?.districts || data?.district_assessments || (Array.isArray(data) ? data : []);
  const assessments = rawAssessments.filter((a: any) => {
    const distName = (a.district_name || a.district || '').toLowerCase();
    const provName = (a.province || '').toLowerCase();
    const q = search.toLowerCase().trim();
    const matchSearch = !q || distName.includes(q) || provName.includes(q);
    const matchRisk = selectedRisk === 'all' || (a.crop_risk_level || '').toUpperCase() === selectedRisk.toUpperCase();
    return matchSearch && matchRisk;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DisclaimerBanner />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
              <Wheat className="w-4 h-4" />
              <span>Agrometeorological Advisory</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              Agriculture & Crop Stress Risk Monitoring
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              District-wise crop vulnerability assessment analyzing excessive precipitation, waterlogging, flood exposure, and thermal extremes for staple crops across Nepal.
            </p>
          </div>

          <button
            onClick={loadAgricultureData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 rounded-xl transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Advisory</span>
          </button>
        </div>

        {/* Guidance Notice Banner */}
        <div className="bg-emerald-950/20 border border-emerald-900/40 p-5 rounded-2xl flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-emerald-900/40 border border-emerald-700/50 text-emerald-400 shrink-0">
            <Sprout className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="text-sm font-bold text-white">
              General Agricultural Risk Guidance (Operational Advisory)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This system evaluates hydrometeorological stress on regional farming (paddy, maize, wheat, millet, mustard). <strong>Where specific micro-farm plot surveys are absent, recommendations represent broad agro-advisory practices</strong> designed to prevent waterlogging and crop rot.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 border border-slate-800 p-3 rounded-2xl">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search district..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400">Crop Risk Level:</span>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 py-1.5 px-3 rounded-xl focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Levels</option>
              <option value="LOW">Low Stress</option>
              <option value="MODERATE">Moderate Stress</option>
              <option value="HIGH">High Stress</option>
              <option value="VERY HIGH">Very High / Critical</option>
            </select>
          </div>
        </div>

        {/* Assessment Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
            <p className="text-sm">Calculating agro-climatic stress models across 77 districts...</p>
          </div>
        ) : assessments.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <Wheat className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Matching Assessments</h3>
            <p className="text-xs text-slate-500">Try changing your search query or risk filter.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assessments
                .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                .map((a: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-colors shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        {a.province || 'Nepal'}
                      </span>
                      <RiskBadge level={a.crop_risk_level || 'LOW'} size="sm" />
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">
                      <Link to={`/district/${a.district_name || a.district}`} className="hover:text-emerald-400 text-sky-200">
                        {a.district_name || a.district} District
                      </Link>
                    </h3>

                    {/* Stressors Breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Rain Stress:</span>
                        <span className="font-semibold text-slate-200">{a.rainfall_stress_level || a.rainfall_stress || 'Low'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Thermal:</span>
                        <span className="font-semibold text-slate-200">{a.temperature_stress_level || a.temperature_stress || 'Optimal'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Flood Risk:</span>
                        <span className="font-semibold text-slate-200">{a.flood_exposure_level || a.flood_exposure || 'Low'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Forecast Rain:</span>
                        <span className="font-mono text-sky-400 font-bold">
                          {(a.forecast_rainfall_mm ?? a.recent_rainfall_mm ?? a.latest_rainfall_mm ?? 0).toFixed(1)} mm
                        </span>
                      </div>
                    </div>

                    {/* Suggested Action */}
                    <div className="bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-xl text-xs space-y-1">
                      <div className="font-semibold text-emerald-400 flex items-center gap-1.5 text-[11px]">
                        <Info className="w-3.5 h-3.5" /> General Agro-Guidance
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        {a.suggested_action || 'Maintain normal drainage channels. Monitor localized river overflow if rainfall intensifies.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-blue-400">
                    <Link to={`/district/${a.district}`} className="hover:underline flex items-center gap-1">
                      <span>District Disaster Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="rounded-2xl overflow-hidden border border-slate-800">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(assessments.length / PAGE_SIZE) || 1}
                totalRecords={assessments.length}
                pageSize={PAGE_SIZE}
                onPageChange={(p) => setCurrentPage(p)}
                itemName="agricultural risk assessments"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
