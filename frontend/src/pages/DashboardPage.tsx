import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  AlertTriangle, 
  Waves, 
  Mountain, 
  Sprout, 
  CloudRain, 
  Activity, 
  RefreshCw, 
  ArrowRight, 
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  MapPin
} from 'lucide-react';
import { api } from '../api/client';
import { KpiCard } from '../components/KpiCard';
import { RiskBadge } from '../components/RiskBadge';
import { YearlyTrendChart, MonthlySeasonalityChart } from '../components/Charts';
import { Alert, DistrictSummary } from '../types';

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [riskData, setRiskData] = useState<any>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rainfall, setRainfall] = useState<any>(null);
  const [rivers, setRivers] = useState<any>(null);
  const [yearlyTrends, setYearlyTrends] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('ALL');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [rOverview, alData, rainData, rivData, yTrends, mTrends] = await Promise.all([
        api.getNationalRiskOverview(),
        api.getActiveAlerts(),
        api.getRainfallOverview(),
        api.getRiverStations(),
        api.getYearlyTrends(),
        api.getMonthlyTrends(),
      ]);

      setRiskData(rOverview);
      setAlerts(alData.alerts || []);
      setRainfall(rainData);
      setRivers(rivData);
      setYearlyTrends(yTrends || []);
      setMonthlyTrends(mTrends || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setTimeout(() => setRefreshing(false), 600);
  };

  const provinces = ['ALL', 'Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'];

  // Filter districts for the matrix table
  const filteredDistricts = (riskData?.districts || []).filter((d: any) => {
    const matchesProv = selectedProvince === 'ALL' || d.province === selectedProvince;
    const matchesSearch = !searchDistrict || d.district_name.toLowerCase().includes(searchDistrict.toLowerCase());
    return matchesProv && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner & Live Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              National Situational Dashboard
            </h1>
            <span className="text-xs px-2 py-0.5 font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
              77 Districts
            </span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Real-time flood, landslide, water-level and agricultural hazard monitoring across Nepal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-400' : ''} />
            <span>{refreshing ? 'Updating Feeds...' : 'Refresh Data'}</span>
          </button>
          <Link
            to="/map"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 flex items-center gap-1.5 transition-all"
          >
            <Layers size={14} />
            <span>Launch GIS Map</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Monitored Districts"
          value={riskData?.total_districts || 77}
          subtitle="All 7 provinces active"
          icon={Building2}
          variant="blue"
        />
        <KpiCard
          title="Active Early Warnings"
          value={alerts.length}
          subtitle={`${riskData?.critical_districts_count || 0} Critical priority`}
          icon={AlertTriangle}
          variant={alerts.length > 0 ? 'rose' : 'emerald'}
        />
        <KpiCard
          title="High / Critical Flood Risk"
          value={riskData?.flood_high_plus_count || 0}
          subtitle="Rainfall & river threshold based"
          icon={Waves}
          variant="orange"
        />
        <KpiCard
          title="High / Critical Landslide Risk"
          value={riskData?.landslide_high_plus_count || 0}
          subtitle="SRTM slope & antecedent saturation"
          icon={Mountain}
          variant="amber"
        />
      </div>

      {/* Main Grid: Early Warnings + Map Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Early Warnings Feed (1 col) */}
        <div className="glass-panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-amber-400" size={18} />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active Risk Alerts</h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                {alerts.length} Active
              </span>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <ShieldCheck size={28} className="mx-auto text-emerald-400 mb-2 opacity-80" />
                  <p>No high-severity early warnings active.</p>
                  <p className="text-[10px] text-slate-600 mt-1">Normal seasonal monitoring active.</p>
                </div>
              ) : (
                alerts.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <MapPin size={12} className="text-blue-400" />
                        {a.district}
                      </span>
                      <RiskBadge level={a.priority} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                      {a.message}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1.5 border-t border-slate-800/60">
                      <span>Hazard: <strong className="text-slate-400 uppercase">{a.hazard}</strong></span>
                      <span className="font-mono">Expires {a.expires_at ? a.expires_at.slice(11, 16) : ''}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4">
            <Link
              to="/alerts"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
            >
              <span>View All Alerts & Resolution History</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* GIS Map Spotlight / Quick Preview (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="text-blue-400" size={18} />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Nepal Multi-Hazard GIS Map</h2>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[11px] text-slate-400 hidden sm:inline">Choropleth Risk Overlay</span>
                <Link
                  to="/map"
                  className="px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[11px] font-medium flex items-center gap-1 hover:bg-blue-600/30"
                >
                  <span>Interactive Mode</span>
                  <ExternalLink size={10} />
                </Link>
              </div>
            </div>

            {/* Visual Map Preview Card with Live Overlay Link */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 h-64 flex flex-col items-center justify-center text-center p-6 group">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent z-10" />
              
              {/* Graphic background simulation */}
              <div className="absolute inset-0 opacity-20 flex items-center justify-center">
                <div className="w-96 h-96 rounded-full border border-blue-500/40 animate-pulse" />
                <div className="absolute w-64 h-64 rounded-full border border-indigo-500/30" />
              </div>

              <div className="relative z-20 space-y-3 max-w-md">
                <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <MapPin size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Full-Screen GIS Layer Explorer</h3>
                <p className="text-xs text-slate-400">
                  Explore 77 district boundaries, 13,185 historical flood/landslide markers, active warning polygons, and live river sensor gauges.
                </p>
                <div className="pt-2">
                  <Link
                    to="/map"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
                  >
                    <span>Open Live GIS Map</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Footer */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-center text-xs mt-4">
            <div>
              <p className="text-slate-500 text-[10px]">Highest 24h Rain</p>
              <p className="font-mono font-bold text-white mt-0.5">{rainfall?.highest_24h_mm || 0} mm</p>
              <p className="text-[10px] text-blue-400 truncate">{rainfall?.highest_24h_district || 'N/A'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px]">DHM River Telemetry</p>
              <p className="font-bold text-slate-300 mt-0.5 text-[11px] truncate">
                {rivers?.feed_status_summary || 'Reference Active'}
              </p>
              <p className="text-[10px] text-slate-500">{rivers?.total_stations || 8} Gauges</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px]">Historical Database</p>
              <p className="font-mono font-bold text-white mt-0.5">13,185 Events</p>
              <p className="text-[10px] text-emerald-400">1971–2026 Verified</p>
            </div>
          </div>
        </div>

      </div>

      {/* 77-District Risk Matrix Table */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="text-blue-400" size={18} />
              <span>77 District Risk Matrix</span>
            </h2>
            <p className="text-xs text-slate-400">
              Rule-based multi-hazard scores combining precipitation accumulation, terrain slope, and historical frequency.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search district..."
              value={searchDistrict}
              onChange={(e) => setSearchDistrict(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <div className="flex items-center gap-1 overflow-x-auto">
              {provinces.map((prov) => (
                <button
                  key={prov}
                  onClick={() => setSelectedProvince(prov)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    selectedProvince === prov
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {prov}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">Province</th>
                <th className="px-4 py-3">Overall Risk</th>
                <th className="px-4 py-3">Flood Risk</th>
                <th className="px-4 py-3">Landslide Risk</th>
                <th className="px-4 py-3">Agriculture</th>
                <th className="px-4 py-3">Key Trigger Factor</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredDistricts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 font-sans">
                    No districts found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDistricts.slice(0, 15).map((d: any) => (
                  <tr key={d.district_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-sans font-bold text-white">
                      <Link to={`/district/${d.district_name}`} className="hover:text-blue-400 flex items-center gap-1.5">
                        {d.district_name}
                        {d.active_alerts > 0 && (
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Active alerts" />
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-sans">{d.province}</td>
                    <td className="px-4 py-3">
                      <RiskBadge level={d.overall_risk} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge level={d.flood_risk} size="sm" showIcon={false} />
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge level={d.landslide_risk} size="sm" showIcon={false} />
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge level={d.agriculture_risk} size="sm" showIcon={false} />
                    </td>
                    <td className="px-4 py-3 font-sans text-slate-400 max-w-xs truncate text-[10px]">
                      {d.top_factor}
                    </td>
                    <td className="px-4 py-3 text-right font-sans">
                      <Link
                        to={`/district/${d.district_name}`}
                        className="text-blue-400 hover:text-blue-300 font-semibold text-xs"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>Showing top 15 of {filteredDistricts.length} districts</span>
          <Link to="/districts" className="text-blue-400 hover:underline flex items-center gap-1">
            <span>Explore all 77 districts with comparison table</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Historical Hazard Trends & Seasonality Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Annual Trend 1971-2026 */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Historical Trend (1971–2026)</h3>
              <p className="text-[11px] text-slate-400">Annual disaster occurrence counts from 13,185 verified disaster records</p>
            </div>
            <Link to="/analytics" className="text-xs text-blue-400 hover:underline">Full Analytics →</Link>
          </div>
          <YearlyTrendChart data={yearlyTrends} />
        </div>

        {/* Monsoon Seasonality Chart */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Seasonal Distribution (Jan–Dec)</h3>
              <p className="text-[11px] text-slate-400">Peak landslide & flood hazard frequency during summer monsoon (June–Sept)</p>
            </div>
            <span className="text-[11px] text-amber-400 font-medium">Monsoon Peak</span>
          </div>
          <MonthlySeasonalityChart data={monthlyTrends} />
        </div>

      </div>

    </div>
  );
};

export default DashboardPage;
