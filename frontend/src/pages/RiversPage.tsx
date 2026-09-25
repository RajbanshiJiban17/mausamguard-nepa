import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Waves,
  ShieldAlert,
  AlertTriangle,
  Info,
  RefreshCw,
  Search,
  CheckCircle2,
  ExternalLink,
  Radio,
  Clock
} from 'lucide-react';
import { api } from '../api/client';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function RiversPage() {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [basinFilter, setBasinFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    loadStations();
  }, [basinFilter]);

  const loadStations = async () => {
    try {
      setLoading(true);
      const data = await api.getRiverStations({
        basin: basinFilter !== 'all' ? basinFilter : undefined,
      });
      setStations(data || []);
    } catch (err) {
      console.error('Failed to load river stations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = stations.filter((st) =>
    st.station_name.toLowerCase().includes(search.toLowerCase()) ||
    st.district.toLowerCase().includes(search.toLowerCase()) ||
    (st.river_name && st.river_name.toLowerCase().includes(search.toLowerCase())) ||
    (st.basin && st.basin.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DisclaimerBanner />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
              <Waves className="w-4 h-4" />
              <span>Hydrological Network</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              River Level & Gauge Stations Monitor
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Official Department of Hydrology and Meteorology (DHM) major river basin benchmark stations, danger thresholds, and telemetry status.
            </p>
          </div>

          <button
            onClick={loadStations}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 rounded-xl transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Check Telemetry Feeds</span>
          </button>
        </div>

        {/* Live DHM River Feed Status Transparency Banner */}
        <div className="bg-sky-950/20 border border-sky-800/40 p-5 rounded-2xl flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-sky-900/40 border border-sky-700/50 text-sky-400 shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                Live DHM River Feed Status:
              </h3>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-amber-950 text-amber-400 border border-amber-800">
                Live DHM feed unavailable
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In accordance with strict operational data transparency standards, <strong>we do NOT fabricate simulated water levels</strong> when live government telemetry APIs are unreachable or lack authenticated public REST streaming. The benchmark gauges below display official DHM warning and danger levels for hydrological flood baseline modeling.
            </p>
            <div className="text-[11px] text-slate-400 pt-1">
              For real-time river stage heights and official siren alerts, consult the official DHM portal at <a href="http://hydrology.gov.np" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">hydrology.gov.np</a>.
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40 border border-slate-800 p-3 rounded-2xl">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search station, river, or district..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400">River Basin:</span>
            <select
              value={basinFilter}
              onChange={(e) => setBasinFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 py-1.5 px-3 rounded-xl focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Basins</option>
              <option value="Mahakali">Mahakali Basin (Sudurpashchim)</option>
              <option value="Seti">Seti Basin (Sudurpashchim)</option>
              <option value="Budhiganga">Budhiganga Basin (Sudurpashchim)</option>
              <option value="Mohana">Mohana Basin (Kailali)</option>
              <option value="Karnali">Karnali Basin</option>
              <option value="West Rapti">West Rapti</option>
              <option value="Narayani">Narayani / Gandaki</option>
              <option value="Bagmati">Bagmati Basin</option>
              <option value="Koshi">Koshi Basin</option>
            </select>
          </div>
        </div>

        {/* River Stations Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-500" />
            <p className="text-sm">Connecting to DHM river stations registry...</p>
          </div>
        ) : filteredStations.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <Waves className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Stations Found</h3>
            <p className="text-xs text-slate-500">Try selecting a different river basin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredStations.map((st) => (
              <div
                key={st.id}
                className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-cyan-500/40 transition-colors shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">
                      {st.basin} Basin
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-800">
                      ID: {st.station_id}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-0.5">
                    {st.station_name}
                  </h3>
                  <div className="text-xs text-slate-400 mb-4">
                    District: <Link to={`/district/${st.district}`} className="text-blue-400 hover:underline">{st.district}</Link>
                  </div>

                  {/* Thresholds Box */}
                  <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl space-y-2 text-xs mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Warning Level:</span>
                      <span className="font-mono font-bold text-amber-400">
                        {st.warning_level_m !== null ? `${st.warning_level_m} m` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Danger Level:</span>
                      <span className="font-mono font-bold text-red-400">
                        {st.danger_level_m !== null ? `${st.danger_level_m} m` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400">Live Stage:</span>
                      <span className="font-mono text-[11px] text-amber-500 italic">
                        {st.water_level !== null ? `${st.water_level} m` : 'Feed unavailable'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Source: {st.source}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Benchmark Ref
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
