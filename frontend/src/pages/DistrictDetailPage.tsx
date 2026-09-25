import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Compass,
  Droplets,
  Mountain,
  AlertTriangle,
  Waves,
  Building2,
  Calendar,
  Users,
  ShieldAlert,
  CloudRain,
  ExternalLink,
  Info,
  RefreshCw,
  Clock,
  MapPin
} from 'lucide-react';
import { api } from '../api/client';
import RiskBadge from '../components/RiskBadge';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { DonutChart, MiniBarChart } from '../components/Charts';
import { DistrictDetail, HistoricalEvent } from '../types';

export default function DistrictDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [district, setDistrict] = useState<DistrictDetail | null>(null);
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadDistrictData(id);
  }, [id]);

  const loadDistrictData = async (districtId: string) => {
    try {
      setLoading(true);
      setError(null);
      const [detailRes, eventsRes] = await Promise.all([
        api.getDistrictDetail(districtId),
        api.getEvents({ district: districtId, limit: 100 })
      ]);
      setDistrict(detailRes);
      setEvents(eventsRes?.data || []);
    } catch (err: any) {
      console.error('Failed to load district detail:', err);
      setError(err.message || 'District data could not be retrieved.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-2" />
        <p className="text-sm text-slate-400">Loading district risk profile & hazard records...</p>
      </div>
    );
  }

  if (error || !district) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">District Not Found</h2>
          <p className="text-xs text-slate-400 mb-6">{error || 'Requested district does not exist.'}</p>
          <Link
            to="/districts"
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-500 transition-colors"
          >
            Back to 77 Districts
          </Link>
        </div>
      </div>
    );
  }

  const hazardChartData = district.hazard_breakdown
    ? Object.entries(district.hazard_breakdown).map(([k, v]) => ({
        label: k.toUpperCase(),
        value: Number(v),
        color: k === 'flood' ? '#3b82f6' : k === 'landslide' ? '#f59e0b' : '#38bdf8'
      }))
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DisclaimerBanner />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Back Link & Header */}
        <div>
          <Link
            to="/districts"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Districts</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
                <Compass className="w-4 h-4" />
                <span>{district.province} Province</span>
                {district.pcode && <span className="text-slate-500 font-mono">({district.pcode})</span>}
              </div>
              <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                {district.district_name} District
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Lat: {district.latitude.toFixed(3)}, Lon: {district.longitude.toFixed(3)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  Pop: {district.population ? district.population.toLocaleString() : 'N/A'} (Census 2021)
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  Area: {district.area_sqkm ? `${district.area_sqkm} km²` : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-1.5">
              <span className="text-xs text-slate-400">Current Overall Risk:</span>
              <RiskBadge level={district.current_overall_risk || 'LOW'} size="lg" />
              <span className="text-[10px] text-slate-500 font-mono">
                Updated: {district.last_updated ? new Date(district.last_updated).toLocaleTimeString() : 'Recent'}
              </span>
            </div>
          </div>
        </div>

        {/* Explainable Risk Assessment Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Flood Risk</span>
              <Droplets className="w-4 h-4 text-blue-400" />
            </div>
            <RiskBadge level={district.current_flood_risk || 'LOW'} />
            <div className="text-[11px] text-slate-400 mt-2">
              Assessed via DHM rainfall warning reference & terrain drainage (HAND).
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Landslide Risk</span>
              <Mountain className="w-4 h-4 text-amber-400" />
            </div>
            <RiskBadge level={district.current_landslide_risk || 'LOW'} />
            <div className="text-[11px] text-slate-400 mt-2">
              Evaluated via DEM slope, historical landslide density & antecedent rainfall.
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Agriculture Risk</span>
              <AlertTriangle className="w-4 h-4 text-emerald-400" />
            </div>
            <RiskBadge level={district.current_agriculture_risk || 'LOW'} />
            <div className="text-[11px] text-slate-400 mt-2">
              Thermal, waterlogging & forecast heavy precipitation impact on staple crops.
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Active Early Warnings</span>
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {district.active_alerts?.length || district.active_alert_count || 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-2">
              System alerts with deduplicated signature fingerprinting.
            </div>
          </div>
        </div>

        {/* Risk Explanation & Hydrology Context */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              <span>Multi-Hazard Risk Engine Rationale</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              {district.risk_explanation || 'Risk calculation uses rule-based and terrain hazard weightings grounded in genuine historical statistics.'}
            </p>

            {district.risk_factors && district.risk_factors.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Identified Contributing Factors</h4>
                <ul className="space-y-1.5">
                  {district.risk_factors.map((factor: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Nearest River Station Notice */}
            {district.nearest_river_station ? (
              <div className="bg-sky-950/20 border border-sky-900/40 p-4 rounded-xl text-xs space-y-1.5">
                <div className="font-bold text-sky-400 flex items-center gap-2">
                  <Waves className="w-4 h-4" />
                  <span>Nearest River Monitoring Gauge: {district.nearest_river_station.station_name}</span>
                </div>
                <div className="text-slate-400">
                  Basin: <strong className="text-slate-200">{district.nearest_river_station.basin}</strong> | Distance to district centroid: ~
                  <strong className="text-slate-200">{district.nearest_river_station.distance_km?.toFixed(1)} km</strong>
                </div>
                <div className="text-[11px] text-slate-400">
                  Warning Level: {district.nearest_river_station.warning_level_m} m | Danger Level: {district.nearest_river_station.danger_level_m} m
                </div>
                <div className="text-[10px] text-amber-500/90 italic pt-1 border-t border-sky-900/30">
                  Note: Real-time telemetry is dependent on official DHM hydrology feeds.
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl text-xs text-slate-500">
                No immediate primary river gauge mapped in this district perimeter.
              </div>
            )}
          </div>

          {/* Historical Hazard Breakdown */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white mb-1">Historical Exposure</h3>
              <p className="text-xs text-slate-400 mb-4">Cumulative records from 1971 to 2026 (BIPAD / DesInventar)</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">Total Recorded Events</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">{district.total_events}</div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">Total Fatalities</div>
                  <div className="text-xl font-bold font-mono text-red-400 mt-1">{district.total_deaths}</div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">Houses Destroyed</div>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1">{district.houses_destroyed}</div>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500">People Affected</div>
                  <div className="text-xl font-bold font-mono text-blue-400 mt-1">{district.people_affected || 0}</div>
                </div>
              </div>
            </div>

            {hazardChartData.length > 0 && (
              <div className="pt-2">
                <div className="text-xs font-semibold text-slate-400 mb-2">Hazards Distribution</div>
                <DonutChart data={hazardChartData} size={150} />
              </div>
            )}
          </div>
        </div>

        {/* Local Municipalities (Palikas) */}
        {district.municipalities && district.municipalities.length > 0 && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Municipalities & Rural Municipalities ({district.municipalities.length} Palikas / स्थानीय तहहरू)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Official local administrative subdivisions in this district.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
              {district.municipalities.map((palika: any, idx: number) => {
                const name = palika.palika_name || palika.municipality_name || palika.name || 'Palika';
                const lower = name.toLowerCase();
                const isRural = lower.includes('rural') || lower.includes('गाउँ') || lower.includes('gau');
                const isSubMetro = lower.includes('sub-metropolitan') || lower.includes('उपमहानगर');
                const isMetro = lower.includes('metropolitan') && !isSubMetro;
                const typeLabel = palika.type || (
                  isMetro ? 'महानगरपालिका' : isSubMetro ? 'उपमहानगरपालिका' : isRural ? 'गाउँपालिका' : 'नगरपालिका'
                );

                return (
                  <div
                    key={idx}
                    className="bg-slate-950/70 border border-slate-800/90 p-3 rounded-xl text-xs hover:border-blue-500/50 transition-all flex flex-col justify-between shadow-sm"
                  >
                    <div className="font-bold text-white text-xs leading-snug" title={name}>
                      {name}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/60 text-[10px]">
                      <span className="text-cyan-400 font-medium">{typeLabel}</span>
                      {palika.total_events !== undefined && palika.total_events > 0 && (
                        <span className="text-slate-400 font-mono">{palika.total_events} events</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Historical Events Table */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Historical Disaster Events Log</h3>
              <p className="text-xs text-slate-400">Verifiable hazard incidents catalogued in this district.</p>
            </div>
            <span className="text-xs text-slate-500 font-mono">Showing up to 100 entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Hazard</th>
                  <th className="py-2.5 px-3">Municipality</th>
                  <th className="py-2.5 px-3">Deaths</th>
                  <th className="py-2.5 px-3">Missing</th>
                  <th className="py-2.5 px-3">Injured</th>
                  <th className="py-2.5 px-3">Houses</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No disaster records catalogued for this district in the current dataset.
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-300">{ev.date}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            ev.hazard_type.toLowerCase().includes('flood')
                              ? 'bg-blue-900/40 text-blue-400 border border-blue-800/50'
                              : ev.hazard_type.toLowerCase().includes('landslide')
                              ? 'bg-amber-900/40 text-amber-400 border border-amber-800/50'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {ev.hazard_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{ev.municipality || '—'}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-red-400">{ev.deaths || 0}</td>
                      <td className="py-2.5 px-3 font-mono">{ev.missing || 0}</td>
                      <td className="py-2.5 px-3 font-mono">{ev.injured || 0}</td>
                      <td className="py-2.5 px-3 font-mono">{ev.houses_destroyed || 0}</td>
                      <td className="py-2.5 px-3 text-[10px] text-slate-400">{ev.source}</td>
                      <td className="py-2.5 px-3 text-right">
                        <Link
                          to={`/events/${ev.event_id}`}
                          className="text-blue-400 hover:text-blue-300 text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <span>Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
