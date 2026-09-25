import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  BellRing,
  Flame,
  AlertOctagon,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api/client';
import RiskBadge from '../components/RiskBadge';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { Alert, AlertPriority } from '../types';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [hazardFilter, setHazardFilter] = useState<string>('all');
  const [searchDistrict, setSearchDistrict] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [resolveNotes, setResolveNotes] = useState<string>('');
  const [resolving, setResolving] = useState<boolean>(false);

  useEffect(() => {
    loadAlerts();
  }, [priorityFilter, hazardFilter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data: any = await api.getActiveAlerts({
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        hazard: hazardFilter !== 'all' ? hazardFilter : undefined,
      });
      const list = Array.isArray(data) ? data : (data?.alerts || []);
      setAlerts(list);
    } catch (err) {
      console.error('Failed to load active alerts:', err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      setResolving(true);
      await api.resolveAlert(alertId, resolveNotes || 'Resolved by operator assessment.');
      setSelectedAlert(null);
      setResolveNotes('');
      loadAlerts();
    } catch (err: any) {
      alert(`Resolution failed: ${err.message}`);
    } finally {
      setResolving(false);
    }
  };

  const filteredAlerts = (Array.isArray(alerts) ? alerts : []).filter((a) => {
    if (!a) return false;
    const query = searchDistrict.toLowerCase();
    const dist = (a.district || '').toLowerCase();
    const title = (a.title || '').toLowerCase();
    return dist.includes(query) || title.includes(query);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DisclaimerBanner />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
              <BellRing className="w-4 h-4" />
              <span>Real-Time Decision Support</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              Early Warning Alerts Monitor
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              System-generated early warning alerts calculated from DHM rainfall warning thresholds, antecedent precipitation, DEM terrain slopes, and river gauge proximities.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAlerts}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 rounded-xl transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Alerts</span>
            </button>
          </div>
        </div>

        {/* Warning System Notice */}
        <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-2xl flex items-start gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-slate-300 leading-relaxed">
            <strong className="text-amber-300">System Priority Categories:</strong> Alerts with priority labels (WATCH, WARNING, HIGH WARNING, CRITICAL) are automated analytics decision-support indicators. <strong>They do NOT substitute for authoritative directives from the Department of Hydrology & Meteorology (DHM) or NDRRMA.</strong>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Search District</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter district..."
                  value={searchDistrict}
                  onChange={(e) => setSearchDistrict(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">System Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH WARNING">High Warning</option>
                <option value="WARNING">Warning</option>
                <option value="WATCH">Watch</option>
                <option value="INFO">Info</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Hazard Category</label>
              <select
                value={hazardFilter}
                onChange={(e) => setHazardFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Hazards</option>
                <option value="flood">Flood Risk</option>
                <option value="landslide">Landslide Risk</option>
                <option value="agriculture">Agriculture Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="text-sm">Evaluating active early warning thresholds...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Active Elevated Early Warnings</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Current live precipitation observations and forecast horizons across all 77 districts are currently below triggering warning thresholds.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alt) => (
              <div
                key={alt.id}
                className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {(() => {
                      const getPriorityBadge = (priority: string) => {
                        switch (priority) {
                          case 'CRITICAL':
                            return {
                              label: 'CRITICAL • आपतकालीन खतरा',
                              icon: <Flame className="w-3.5 h-3.5 text-purple-400 animate-pulse" />,
                              style: 'bg-purple-950/70 text-purple-200 border-purple-700/60 shadow-md shadow-purple-950/50'
                            };
                          case 'HIGH WARNING':
                            return {
                              label: 'HIGH WARNING • उच्च चेतावनी',
                              icon: <AlertOctagon className="w-3.5 h-3.5 text-red-400" />,
                              style: 'bg-red-950/70 text-red-200 border-red-700/60 shadow-md shadow-red-950/50'
                            };
                          case 'WARNING':
                            return {
                              label: 'WARNING • सतर्कता चेतावनी',
                              icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
                              style: 'bg-amber-950/70 text-amber-200 border-amber-700/60'
                            };
                          case 'WATCH':
                          default:
                            return {
                              label: 'WATCH / LOW • मध्यम निगरानी',
                              icon: <Info className="w-3.5 h-3.5 text-blue-400" />,
                              style: 'bg-blue-950/70 text-blue-200 border-blue-700/60'
                            };
                        }
                      };
                      const p = getPriorityBadge(alt.priority);
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border ${p.style}`}>
                          {p.icon}
                          <span>{p.label}</span>
                        </span>
                      );
                    })()}

                    <span className="text-sm font-bold text-white">
                      {alt.district} District
                    </span>

                    <span className="text-xs text-slate-400 capitalize">
                      ({alt.hazard} Hazard)
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {alt.message}
                  </p>

                  {alt.trigger_factors && alt.trigger_factors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {alt.trigger_factors.map((tf, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 bg-slate-950/80 border border-slate-800 rounded text-slate-400"
                        >
                          {tf}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 pt-1">
                    <span>Generated: {new Date(alt.created_at).toLocaleString()}</span>
                    <span>Expires: {new Date(alt.expires_at).toLocaleString()}</span>
                    <span>Source: {alt.source}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/district/${alt.district}`}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-blue-400 transition-colors"
                  >
                    View District
                  </Link>

                  <button
                    onClick={() => setSelectedAlert(alt)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Resolve Alert
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for Resolving Alert */}
        {selectedAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <span>Acknowledge & Resolve Early Warning</span>
                </h3>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-2">
                <div>
                  <strong>District:</strong> {selectedAlert.district}
                </div>
                <div>
                  <strong>Alert Message:</strong> {selectedAlert.message}
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 mt-3">Operator Resolution Rationale</label>
                  <textarea
                    rows={3}
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    placeholder="Enter verification notes or field clearance verification..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  disabled={resolving}
                  onClick={() => handleResolve(selectedAlert.alert_id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
                >
                  {resolving ? 'Submitting...' : 'Confirm Resolution'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
