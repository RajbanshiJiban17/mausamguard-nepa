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
  ShieldCheck,
  Waves,
  Mountain,
  Building2,
  ChevronLeft
} from 'lucide-react';
import { api } from '../api/client';
import RiskBadge from '../components/RiskBadge';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { Alert, AlertPriority } from '../types';

const getImpactedPalikasAndRivers = (district: string, hazard: string) => {
  const d = (district || '').toLowerCase();
  if (d.includes('kailali')) {
    return {
      palikas: ['जोशीपुर (Joshipur)', 'भजनी (Bhajani)', 'टीकापुर (Tikapur)', 'धनगढी (Dhangadhi)', 'कैलारी (Kailari)', 'लम्की चुहा (Lamki)'],
      rivers: ['कान्द्रा / काढा नदी (Kandra/Kadha)', 'मोहना नदी (Mohana)', 'पथरिया नदी (Patharaiya)'],
      nepaliAdvice: 'नदी तटीय क्षेत्र तथा होचा बस्तीहरूमा बाढी र पानी ब्याक भई डुबानको उच्च जोखिम रहेकाले सुरक्षित रहनुहोस्।'
    };
  }
  if (d.includes('kanchanpur')) {
    return {
      palikas: ['दोधारा चाँदनी (Dodhara Chandani)', 'भीमदत्त (Bhimdatta)', 'बेलौरी (Belauri)', 'पुनर्वास (Punarwas)'],
      rivers: ['महाकाली नदी (Mahakali)', 'जोगबुढा नदी (Jogbudha)'],
      nepaliAdvice: 'महाकाली नदीको तीव्र बहाव र तटीय कटानबाट बच्न नदी किनार नजानुहोस्।'
    };
  }
  if (d.includes('bardiya')) {
    return {
      palikas: ['राजापुर (Rajapur)', 'गेरुवा (Geruwa)', 'गुलरिया (Gulariya)', 'मधुवन (Madhuwan)'],
      rivers: ['कर्णाली नदी (Karnali downstream)', 'बबई नदी (Babai)'],
      nepaliAdvice: 'राजापुर टापु तथा बबई तटीय बस्तीहरूमा जलसतह बढ्ने भएकाले होशियार रहनुहोस्।'
    };
  }
  if (d.includes('bajura')) {
    return {
      palikas: ['गौमुल (Gaumul)', 'बडीमालिका (Badimalika)', 'त्रिवेणी (Triveni)', 'बुढीगंगा (Budhiganga)'],
      rivers: ['बुढीगंगा नदी (Budhiganga River)'],
      nepaliAdvice: 'बुढीगंगा नदीमा आकस्मिक बाढी र पहाडी पाखामा पहिरोको उच्च जोखिम।'
    };
  }
  if (d.includes('achham')) {
    return {
      palikas: ['साँफेबगर (Sanfebagar)', 'मङ्गलसेन (Mangalsen)', 'पञ्चदेवल विनायक'],
      rivers: ['बुढीगंगा नदी (Budhiganga)', 'सेती नदी (Seti)', 'कैलाश खोला'],
      nepaliAdvice: 'साँफेबगर बजार क्षेत्र र बुढीगंगा तटीय बस्तीहरूमा उच्च सतर्कता अपनाउनुहोस्।'
    };
  }
  return {
    palikas: [`${district} स्थानीय तहहरू (Local Palikas)`],
    rivers: [`स्थानीय नदी प्रणाली र जलाधार`],
    nepaliAdvice: 'मौसम तथा जलसतहको अवस्था निरन्तर अनुगमन गर्नुहोस्।'
  };
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [hazardFilter, setHazardFilter] = useState<string>('all');
  const [searchDistrict, setSearchDistrict] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [resolveNotes, setResolveNotes] = useState<string>('');
  const [resolving, setResolving] = useState<boolean>(false);

  useEffect(() => {
    setCurrentPage(1);
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

        {/* Filter Toolbar & Quick Filter Buttons */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-md space-y-3">
          {/* Quick Filter Buttons with Icons */}
          <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-slate-800/60">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">द्रुत फिल्टर (Quick Filter):</span>

            <button
              onClick={() => { setHazardFilter('all'); setPriorityFilter('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                hazardFilter === 'all' && priorityFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <BellRing className="w-3.5 h-3.5 text-blue-400" />
              <span>All Alerts (सबै)</span>
            </button>

            <button
              onClick={() => { setHazardFilter('flood'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                hazardFilter === 'flood'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-900/50'
                  : 'bg-slate-950 border border-slate-800 text-sky-300 hover:bg-slate-800'
              }`}
            >
              <Waves className="w-3.5 h-3.5 text-sky-400" />
              <span>Flood Risk (बाढी डुबान)</span>
            </button>

            <button
              onClick={() => { setHazardFilter('landslide'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                hazardFilter === 'landslide'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/50'
                  : 'bg-slate-950 border border-slate-800 text-amber-300 hover:bg-slate-800'
              }`}
            >
              <Mountain className="w-3.5 h-3.5 text-amber-400" />
              <span>Landslide Risk (पहिरो)</span>
            </button>

            <button
              onClick={() => { setHazardFilter('agriculture'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                hazardFilter === 'agriculture'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                  : 'bg-slate-950 border border-slate-800 text-emerald-300 hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Agriculture Risk (कृषि जोखिम)</span>
            </button>

            <button
              onClick={() => { setPriorityFilter('CRITICAL'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                priorityFilter === 'CRITICAL'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                  : 'bg-slate-950 border border-slate-800 text-purple-300 hover:bg-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>Critical (आपतकालीन)</span>
            </button>

            <button
              onClick={() => { setPriorityFilter('HIGH WARNING'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                priorityFilter === 'HIGH WARNING'
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/50'
                  : 'bg-slate-950 border border-slate-800 text-red-300 hover:bg-slate-800'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
              <span>High Warning (उच्च चेतावनी)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Search District</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter district..."
                  value={searchDistrict}
                  onChange={(e) => {
                    setSearchDistrict(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">System Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Priorities (सबै)</option>
                <option value="CRITICAL">Critical • आपतकालीन खतरा</option>
                <option value="HIGH WARNING">High Warning • उच्च चेतावनी</option>
                <option value="WARNING">Warning • सतर्कता चेतावनी</option>
                <option value="WATCH">Watch • मध्यम निगरानी</option>
                <option value="INFO">Info • सामान्य सूचना</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Hazard Category</label>
              <select
                value={hazardFilter}
                onChange={(e) => {
                  setHazardFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Hazards (सबै जोखिम)</option>
                <option value="flood">Flood Risk (बाढी डुबान)</option>
                <option value="landslide">Landslide Risk (पहिरो)</option>
                <option value="agriculture">Agriculture Risk (कृषि बाली)</option>
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
          (() => {
            const totalPages = Math.ceil(filteredAlerts.length / pageSize) || 1;
            const paginatedAlerts = filteredAlerts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
                  <span>
                    Showing {filteredAlerts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
                    {Math.min(currentPage * pageSize, filteredAlerts.length)} of {filteredAlerts.length} active warnings
                  </span>
                  <span>Page {currentPage} of {totalPages}</span>
                </div>

                <div className="space-y-3">
                  {paginatedAlerts.map((alt) => {
                    const localInfo = getImpactedPalikasAndRivers(alt.district, alt.hazard);

                    return (
                      <div
                        key={alt.id}
                        className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 shadow-sm"
                      >
                        <div className="space-y-2 flex-1">
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

                          <p className="text-xs text-slate-200 leading-relaxed font-sans">
                            {alt.message}
                          </p>

                          {/* Impacted Local Governments (Palikas) & Rivers Highlight */}
                          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                              <span className="text-[10px] uppercase font-bold text-sky-400 mb-1.5 flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />
                                <span>प्रभावित स्थानीय तहहरू (Impacted Palikas):</span>
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {localInfo.palikas.map((p, idx) => (
                                  <span key={idx} className="bg-sky-950/70 border border-sky-800/60 text-sky-200 text-[10px] px-2 py-0.5 rounded-md font-medium">
                                    {p}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                              <span className="text-[10px] uppercase font-bold text-cyan-400 mb-1.5 flex items-center gap-1">
                                <Waves className="w-3.5 h-3.5" />
                                <span>जोखिमयुक्त मुख्य नदीहरू (Monitored Rivers):</span>
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {localInfo.rivers.map((r, idx) => (
                                  <span key={idx} className="bg-cyan-950/70 border border-cyan-800/60 text-cyan-200 text-[10px] px-2 py-0.5 rounded-md font-medium">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {alt.trigger_factors && alt.trigger_factors.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {alt.trigger_factors.map((tf, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-2 py-0.5 bg-slate-950/90 border border-slate-800/90 rounded text-slate-300"
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

                        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                          <Link
                            to={`/district/${alt.district}`}
                            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-blue-400 transition-colors"
                          >
                            View District
                          </Link>

                          <button
                            onClick={() => setSelectedAlert(alt)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Resolve Alert
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800 mt-4 text-xs">
                    <div className="text-slate-400 font-mono">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Prev</span>
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                        .map((p, idx, arr) => {
                          const prev = arr[idx - 1];
                          const hasGap = prev && p - prev > 1;
                          return (
                            <React.Fragment key={p}>
                              {hasGap && <span className="px-1 text-slate-600">...</span>}
                              <button
                                onClick={() => setCurrentPage(p)}
                                className={`w-8 h-8 rounded-lg font-mono text-xs transition-all cursor-pointer ${
                                  currentPage === p
                                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/50'
                                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                              >
                                {p}
                              </button>
                            </React.Fragment>
                          );
                        })}

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()
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
