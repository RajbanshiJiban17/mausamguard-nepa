import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Users,
  Building,
  RefreshCw,
  Info,
  Compass,
  Search,
  Filter,
  ShieldAlert,
  Droplets,
  Waves,
  PhoneCall,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { api } from '../api/client';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { BarChart, AreaChart, DonutChart } from '../components/Charts';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [yearlyTrends, setYearlyTrends] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [allDistricts, setAllDistricts] = useState<any[]>([]);
  const [districtSearch, setDistrictSearch] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [hazardSort, setHazardSort] = useState<'events' | 'flood' | 'landslide' | 'deaths'>('events');
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
      setAllDistricts(distRes || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartYearly = (yearlyTrends || []).slice(-25).map((y: any) => ({
    label: String(y.year),
    value: y.event_count ?? y.count ?? 0,
  }));

  const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartMonthly = (monthlyTrends || []).map((m: any) => ({
    label: m.month_name ? m.month_name.slice(0, 3) : (MONTH_NAMES[m.month] || String(m.month)),
    value: m.event_count ?? m.count ?? 0,
  }));

  const rawHazards = summary?.by_hazard || summary?.hazards || {};
  const chartHazards = Object.entries(rawHazards).map(([k, v]) => ({
    label: k.toUpperCase(),
    value: Number(v),
    color: k.toLowerCase().includes('flood') ? '#3b82f6' : k.toLowerCase().includes('landslide') ? '#f59e0b' : '#38bdf8'
  }));

  const filteredDistricts = allDistricts
    .filter((d: any) => {
      const q = districtSearch.toLowerCase().trim();
      const matchText = (d.district_name || '').toLowerCase().includes(q) || (d.province || '').toLowerCase().includes(q);
      const matchProv = selectedProvince === 'all' || d.province?.toLowerCase() === selectedProvince.toLowerCase();
      return matchText && matchProv;
    })
    .sort((a: any, b: any) => {
      if (hazardSort === 'flood') {
        const fA = a.hazard_breakdown?.flood || 0;
        const fB = b.hazard_breakdown?.flood || 0;
        return fB - fA;
      }
      if (hazardSort === 'landslide') {
        const lA = a.hazard_breakdown?.landslide || 0;
        const lB = b.hazard_breakdown?.landslide || 0;
        return lB - lA;
      }
      if (hazardSort === 'deaths') {
        return (b.total_deaths || 0) - (a.total_deaths || 0);
      }
      return (b.total_events || 0) - (a.total_events || 0);
    });

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
              Disaster history, casualty trends, monsoon seasonality, and 77-district hazard vulnerability records compiled from BIPAD portal and DHM historical datasets.
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
              {summary?.total_houses_destroyed?.toLocaleString() || summary?.houses_destroyed?.toLocaleString() || '0'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Severe structural loss</div>
          </div>
        </div>

        {/* Live Flood Early Action & Village Preparedness Banner */}
        <div className="bg-gradient-to-r from-blue-950/60 via-slate-900/80 to-cyan-950/60 border border-blue-800/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Waves className="w-48 h-48 text-cyan-400" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    बाढी तथा भारी वर्षा पूर्वतयारी कार्ययोजना (Flood Preparedness & Early Action)
                  </h2>
                  <p className="text-xs text-blue-200/80">
                    आज, भोलि र पर्सि (७२ घण्टे) अत्यधिक वर्षात जोखिममा रहेका तटीय गाउँबस्ती तथा नदी जलाधार क्षेत्रका लागि।
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/forecast"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <Droplets className="w-3.5 h-3.5" />
                  <span>72h Forecast हेर्नुहोस्</span>
                </Link>
                <Link
                  to="/rivers"
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                >
                  <Waves className="w-3.5 h-3.5 text-cyan-400" />
                  <span>नदी जलसतह (Rivers)</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
              <div className="bg-slate-950/80 border border-blue-900/40 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>१. बाढी आउनुपूर्व (Early Warning Phase)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  अन्नपात, महत्त्वपूर्ण कागजात, प्राथमिक उपचार औषधि र मूल्यवान सामान सुरक्षित अग्लो ठाउँमा सार्नुहोस्। गर्भवती, बालबालिका तथा ज्येष्ठ नागरिकलाई समयमै सुरक्षित आश्रयस्थलमा पुर्‍याउनुहोस्।
                </p>
              </div>

              <div className="bg-slate-950/80 border border-blue-900/40 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>२. जोखिमयुक्त नदी जलाधार सतर्कता</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  कैलालीको मोहना, कान्द्रा, पथरैया र कर्णाली तटीय क्षेत्र (जोशीपुर, टीकापुर, भजनी) तथा तराईका अन्य नदी किनारमा जलसतह खतराको तह नजिक पुगेमा तुरुन्त साइरन/SMS सतर्कता अपनाउनुहोस्।
                </p>
              </div>

              <div className="bg-slate-950/80 border border-blue-900/40 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>३. आपतकालीन हटलाइन (Emergency Toll-Free)</span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>बाढी सूचना केन्द्र (DHM):</span>
                    <strong className="text-white font-mono">११५५</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>सशस्त्र प्रहरी बल (APF Rescue):</span>
                    <strong className="text-white font-mono">१११४</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>नेपाल प्रहरी (Police):</span>
                    <strong className="text-white font-mono">१००</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 1: Yearly & Seasonal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Yearly Trends */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Annual Disaster Frequency (Past 25 Years)</h3>
                <p className="text-xs text-slate-400">Recorded disaster occurrences per calendar year across Nepal</p>
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
                <p className="text-xs text-slate-400">Disaster distribution showing clear June–September peak exposure</p>
              </div>
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>
            <BarChart data={chartMonthly} height={180} color="#f59e0b" />
          </div>
        </div>

        {/* Charts Row 2: Hazard Distribution & District-Wise Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hazard Breakdown Donut */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-1">Hazard Category Share</h3>
              <p className="text-xs text-slate-400 mb-4">Historical division between floods, landslides & avalanches</p>
              {chartHazards.length > 0 ? (
                <DonutChart data={chartHazards} size={170} />
              ) : (
                <div className="text-xs text-slate-500 py-12 text-center">Loading hazard breakdown...</div>
              )}
            </div>
            <div className="text-[10px] text-slate-500 pt-3 border-t border-slate-800">
              Source: Compiled BIPAD / DesInventar Sentinel dataset
            </div>
          </div>

          {/* Comprehensive District-Wise Hazards Table */}
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">District-Wise Hazard Exposure & Risk Profiles</h3>
                <p className="text-xs text-slate-400">
                  Search & filter all 77 districts by historical flood incidence, landslides, fatalities, and live risk level.
                </p>
              </div>
              <span className="text-[11px] text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 self-start sm:self-auto">
                {filteredDistricts.length} Districts Found
              </span>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5 bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search district or province (e.g. Kailali, Sudurpashchim)..."
                  value={districtSearch}
                  onChange={(e) => setDistrictSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-white pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-300 px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Provinces</option>
                <option value="Sudurpashchim">Sudurpashchim</option>
                <option value="Koshi">Koshi</option>
                <option value="Madhesh">Madhesh</option>
                <option value="Bagmati">Bagmati</option>
                <option value="Gandaki">Gandaki</option>
                <option value="Lumbini">Lumbini</option>
                <option value="Karnali">Karnali</option>
              </select>

              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-slate-500">Sort:</span>
                <button
                  onClick={() => setHazardSort('events')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    hazardSort === 'events' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  Events
                </button>
                <button
                  onClick={() => setHazardSort('flood')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    hazardSort === 'flood' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  Floods
                </button>
                <button
                  onClick={() => setHazardSort('landslide')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    hazardSort === 'landslide' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  Landslides
                </button>
                <button
                  onClick={() => setHazardSort('deaths')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    hazardSort === 'deaths' ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  Fatalities
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="sticky top-0 bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 z-10">
                  <tr>
                    <th className="py-2.5 px-3">District</th>
                    <th className="py-2.5 px-3">Province</th>
                    <th className="py-2.5 px-3 font-mono">Total Events</th>
                    <th className="py-2.5 px-3 font-mono text-cyan-400">Floods</th>
                    <th className="py-2.5 px-3 font-mono text-amber-400">Landslides</th>
                    <th className="py-2.5 px-3 font-mono text-red-400">Fatalities</th>
                    <th className="py-2.5 px-3 font-mono">Destroyed</th>
                    <th className="py-2.5 px-3">Risk Level</th>
                    <th className="py-2.5 px-3 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-500 mb-2" />
                        Loading district hazard records...
                      </td>
                    </tr>
                  ) : filteredDistricts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        No districts match the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredDistricts.map((d: any, i: number) => {
                      const floodCount = d.hazard_breakdown?.flood || 0;
                      const landslideCount = d.hazard_breakdown?.landslide || 0;
                      const risk = d.current_flood_risk || d.current_overall_risk || 'LOW';

                      return (
                        <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-white">
                            <Link to={`/district/${d.district_name}`} className="hover:text-blue-400 text-sky-200">
                              {d.district_name}
                            </Link>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">{d.province}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-400">{d.total_events}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{floodCount}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{landslideCount}</td>
                          <td className="py-2.5 px-3 font-mono text-red-400">{d.total_deaths}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">{d.houses_destroyed}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                risk === 'HIGH' || risk === 'VERY HIGH'
                                  ? 'bg-red-950 text-red-400 border border-red-800'
                                  : risk === 'MODERATE'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              }`}
                            >
                              {risk}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Link
                              to={`/district/${d.district_name}`}
                              className="text-blue-400 hover:text-blue-300 font-semibold"
                            >
                              View
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
        </div>
      </main>
    </div>
  );
}
