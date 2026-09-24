import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Filter,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Flame,
  ArrowUpDown,
  Building
} from 'lucide-react';
import { api } from '../api/client';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { HistoricalEvent, PaginatedResponse } from '../types';

export default function EventsPage() {
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [hazard, setHazard] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [minDeaths, setMinDeaths] = useState<string>('');
  const [districtsList, setDistrictsList] = useState<any[]>([]);

  useEffect(() => {
    api.getDistricts().then((d) => setDistrictsList(d || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadEvents();
  }, [page, hazard, district, minDeaths]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getEvents({
        page,
        page_size: 25,
        hazard: hazard || undefined,
        district: district || undefined,
        min_deaths: minDeaths ? Number(minDeaths) : undefined,
      });

      setEvents(res.data || []);
      if (res.pagination) {
        setTotalPages(res.pagination.total_pages);
        setTotalRecords(res.pagination.total_records);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadEvents();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DisclaimerBanner />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              Historical Hazard Archive (1971–2026)
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              Disaster Events Catalog
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              13,185 verified historical flood, landslide, and avalanche hazard records across Nepal sourced from BIPAD portal, DesInventar Sentinel, and ICIMOD.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs">
            <span className="text-slate-400">Total Catalogued: </span>
            <span className="text-white font-mono font-bold">{totalRecords.toLocaleString()} events</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Hazard Type */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Hazard Category</label>
              <select
                value={hazard}
                onChange={(e) => {
                  setHazard(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="">All Hazards</option>
                <option value="flood">Flood & Flash Flood</option>
                <option value="landslide">Landslide & Slope Failure</option>
                <option value="avalanche">Avalanche</option>
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">District</label>
              <select
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="">All 77 Districts</option>
                {districtsList.map((d) => (
                  <option key={d.id} value={d.district_name}>
                    {d.district_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Casualties */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Casualty Severity</label>
              <select
                value={minDeaths}
                onChange={(e) => {
                  setMinDeaths(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="">Any Severity</option>
                <option value="1">1+ Fatalities</option>
                <option value="5">5+ Fatalities</option>
                <option value="10">10+ Fatalities (Major)</option>
              </select>
            </div>

            {/* Reset */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setHazard('');
                  setDistrict('');
                  setMinDeaths('');
                  setPage(1);
                }}
                className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium rounded-xl transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Hazard Type</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Municipality</th>
                  <th className="py-3 px-4">Deaths</th>
                  <th className="py-3 px-4">Missing</th>
                  <th className="py-3 px-4">Destroyed</th>
                  <th className="py-3 px-4">Geo Precision</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                      Loading records...
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      No disaster records matched the selected query criteria.
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 font-medium">
                        {ev.event_id}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                        {ev.date}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            ev.hazard_type.toLowerCase().includes('flood')
                              ? 'bg-blue-900/40 text-blue-400 border border-blue-800/50'
                              : ev.hazard_type.toLowerCase().includes('landslide')
                              ? 'bg-amber-900/40 text-amber-400 border border-amber-800/50'
                              : 'bg-sky-900/40 text-sky-400 border border-sky-800/50'
                          }`}
                        >
                          {ev.hazard_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        <Link to={`/district/${ev.district}`} className="hover:underline text-blue-400">
                          {ev.district}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {ev.municipality || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-red-400">
                        {ev.deaths || 0}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {ev.missing || 0}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {ev.houses_destroyed || 0}
                      </td>
                      <td className="py-3 px-4 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {ev.geo_precision || 'approximate'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/events/${ev.event_id}`}
                          className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950/60">
            <div>
              Page <span className="text-white font-semibold">{page}</span> of {totalPages} ({totalRecords.toLocaleString()} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
