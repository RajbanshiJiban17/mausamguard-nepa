import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Users,
  Building,
  RefreshCw,
  Info,
  Compass
} from 'lucide-react';
import { api } from '../api/client';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { BarChart, AreaChart, DonutChart } from '../components/Charts';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [yearlyTrends, setYearlyTrends] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [topDistricts, setTopDistricts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [sumRes, yearRes, monthRes, distRes] = await Promise.all([
        api.getEventStatsSummary(),
        api.getYearlyTrends(),
        api.getMonthlyTrends(),
        api.getDistricts()
      ]);
      setSummary(sumRes);
      setYearlyTrends(yearRes || []);
      setMonthlyTrends(monthRes || []);
      // Top 10 districts by events
      const sorted = [...(distRes || [])].sort((a, b) => (b.total_events || 0) - (a.total_events || 0)).slice(0, 10);
      setTopDistricts(sorted);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartYearly = yearlyTrends.slice(-30).map((y) => ({
    label: String(y.year),
    value: y.count || 0,
  }));

  const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartMonthly = monthlyTrends.map((m) => ({
    label: MONTH_NAMES[m.month] || String(m.month),
    value: m.count || 0,
  }));

  const chartHazards = summary?.hazards
    ? Object.entries(summary.hazards).map(([k, v]) => ({
        label: k.toUpperCase(),
        value: Number(v),
        color: k.toLowerCase().includes('flood') ? '#3b82f6' : k.toLowerCase().includes('landslide') ? '#f59e0b' : '#38bdf8'
      }))
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DisclaimerBanner />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Multi-Decadal Hazard Analytics</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              Historical Hazard & Exposure Statistics (1971–2026)
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Long-term disaster trends, casualties, seasonality analysis, and geographic risk exposure compiled from BIPAD portal, DesInventar Sentinel, and ICIMOD records.
            </p>
          </div>

          <button
            onClick={loadAnalytics}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 rounded-xl transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Analytics</span>
          </button>
        </div>

        {/* Aggregate KPI Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400">Total Catalogued Events</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {summary?.total_events?.toLocaleString() || '13,185'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">1971 to 2026</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400">Total Fatalities</div>
            <div className="text-2xl font-bold font-mono text-red-400 mt-1">
              {summary?.total_deaths?.toLocaleString() || '0'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Lives lost</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400">Missing Persons</div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
              {summary?.total_missing?.toLocaleString() || '0'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Unrecovered</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="text-xs text-slate-400">Houses Destroyed</div>
            <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
              {summary?.houses_destroyed?.toLocaleString() || '0'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Severe structural loss</div>
          </div>
        </div>

        {/* Charts Row 1: Yearly & Seasonal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Yearly Trends */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Annual Disaster Frequency (Past 30 Years)</h3>
                <p className="text-xs text-slate-400">Recorded disaster occurrences per calendar year</p>
              </div>
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <BarChart data={chartYearly} height={180} color="#3b82f6" />
          </div>

          {/* Monsoon Seasonality */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Monsoon Seasonality Pattern (By Month)</h3>
                <p className="text-xs text-slate-400">Disaster distribution showing clear June–September peak</p>
              </div>
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <BarChart data={chartMonthly} height={180} color="#f59e0b" />
          </div>
        </div>

        {/* Charts Row 2: Hazard Distribution & Top Districts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hazard Breakdown */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-1">Hazard Category Share</h3>
              <p className="text-xs text-slate-400 mb-4">Historical division between floods, landslides & avalanches</p>
              {chartHazards.length > 0 && <DonutChart data={chartHazards} size={170} />}
            </div>
            <div className="text-[10px] text-slate-500 pt-3 border-t border-slate-800">
              Source: Compiled BIPAD / DesInventar Sentinel dataset
            </div>
          </div>

          {/* High Exposure Districts (Req 17: Geographic risk analytics, not political ranking) */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-bold text-white">High Historical Hazard Exposure Districts</h3>
                <p className="text-xs text-slate-400">
                  Geographic disaster incidence density (1971–2026). Displayed strictly for risk analytics and mitigation planning.
                </p>
              </div>
              <Compass className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">District</th>
                    <th className="py-2.5 px-3">Province</th>
                    <th className="py-2.5 px-3 font-mono">Recorded Events</th>
                    <th className="py-2.5 px-3 font-mono">Fatalities</th>
                    <th className="py-2.5 px-3 font-mono">Houses Destroyed</th>
                    <th className="py-2.5 px-3 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {topDistricts.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-white">{d.district_name}</td>
                      <td className="py-2.5 px-3 text-slate-400">{d.province}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-400">{d.total_events}</td>
                      <td className="py-2.5 px-3 font-mono text-red-400">{d.total_deaths}</td>
                      <td className="py-2.5 px-3 font-mono">{d.houses_destroyed}</td>
                      <td className="py-2.5 px-3 text-right">
                        <a href={`/district/${d.district_name}`} className="text-blue-400 hover:underline">
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
