import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Droplets,
  Mountain,
  AlertTriangle,
  Users,
  Compass,
  ChevronRight,
  RefreshCw,
  Layers,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import { api } from '../api/client';
import RiskBadge from '../components/RiskBadge';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { DistrictSummary, RiskLevel } from '../types';

export default function DistrictsPage() {
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('events');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  useEffect(() => {
    loadDistricts();
  }, [selectedProvince]);

  const loadDistricts = async () => {
    try {
      setLoading(true);
      const data = await api.getDistricts({
        province: selectedProvince !== 'all' ? selectedProvince : undefined,
      });
      setDistricts(data || []);
    } catch (err) {
      console.error('Failed to load districts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDistricts = districts
    .filter((d) => {
      const matchesSearch = d.district_name.toLowerCase().includes(search.toLowerCase());
      const matchesRisk = selectedRisk === 'all' || d.current_overall_risk === selectedRisk;
      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortField === 'name') {
        valA = a.district_name;
        valB = b.district_name;
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (sortField === 'events') {
        valA = a.total_events || 0;
        valB = b.total_events || 0;
      } else if (sortField === 'deaths') {
        valA = a.total_deaths || 0;
        valB = b.total_deaths || 0;
      } else if (sortField === 'population') {
        valA = a.population || 0;
        valB = b.population || 0;
      } else if (sortField === 'rainfall') {
        valA = a.latest_rainfall_mm || 0;
        valB = b.latest_rainfall_mm || 0;
      }

      return sortAsc ? valA - valB : valB - valA;
    });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DisclaimerBanner />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              <Compass className="w-4 h-4" />
              <span>National Geographic Coverage</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              77 Districts Risk Directory
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              District-by-district multi-hazard risk assessments, live weather observations, historical hazard densities (1971–2026), and local government palika breakdowns.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/map"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 rounded-xl transition-all"
            >
              <Layers className="w-4 h-4 text-blue-400" />
              <span>View On Interactive Map</span>
            </Link>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 mb-6 backdrop-blur-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search district name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Province Filter */}
            <div>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Provinces (7)</option>
                <option value="Koshi">Koshi Province</option>
                <option value="Madhesh">Madhesh Province</option>
                <option value="Bagmati">Bagmati Province</option>
                <option value="Gandaki">Gandaki Province</option>
                <option value="Lumbini">Lumbini Province</option>
                <option value="Karnali">Karnali Province</option>
                <option value="Sudurpashchim">Sudurpashchim Province</option>
              </select>
            </div>

            {/* Risk Filter */}
            <div>
              <select
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="LOW">Low Risk</option>
                <option value="MODERATE">Moderate Risk</option>
                <option value="HIGH">High Risk</option>
                <option value="VERY HIGH">Very High Risk</option>
                <option value="CRITICAL">Critical Risk</option>
              </select>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-300 py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="events">Sort by Historical Events</option>
                <option value="deaths">Sort by Total Fatalities</option>
                <option value="population">Sort by Population</option>
                <option value="rainfall">Sort by Latest Rainfall</option>
                <option value="name">Sort by Name</option>
              </select>
              <button
                onClick={() => setSortAsc(!sortAsc)}
                title="Toggle sort direction"
                className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <span className="text-white font-semibold">{filteredDistricts.length}</span> of {districts.length} districts
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Low</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Moderate</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span> High</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Very High</span>
            </div>
          </div>
        </div>

        {/* Districts Cards Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm">Loading 77 districts database...</p>
          </div>
        ) : filteredDistricts.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <Building2 className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Districts Found</h3>
            <p className="text-xs text-slate-500">Try adjusting your province or risk level filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDistricts.map((d) => (
              <Link
                key={d.id}
                to={`/district/${d.district_name}`}
                className="group bg-slate-900/50 hover:bg-slate-900/90 border border-slate-800/80 hover:border-blue-500/40 rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between shadow-lg hover:shadow-blue-500/5"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {d.province}
                      </span>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                        {d.district_name}
                      </h3>
                    </div>
                    <RiskBadge level={d.current_overall_risk || 'LOW'} size="sm" />
                  </div>

                  {/* Sub-hazards */}
                  <div className="grid grid-cols-3 gap-1.5 my-3 bg-slate-950/60 p-2 rounded-xl border border-slate-800/50 text-center">
                    <div>
                      <div className="text-[9px] text-slate-500 flex items-center justify-center gap-1">
                        <Droplets className="w-2.5 h-2.5 text-blue-400" /> Flood
                      </div>
                      <div className="text-[10px] font-bold text-slate-300 mt-0.5">
                        {d.current_flood_risk || 'LOW'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 flex items-center justify-center gap-1">
                        <Mountain className="w-2.5 h-2.5 text-amber-400" /> Landslide
                      </div>
                      <div className="text-[10px] font-bold text-slate-300 mt-0.5">
                        {d.current_landslide_risk || 'LOW'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 flex items-center justify-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5 text-emerald-400" /> Agri
                      </div>
                      <div className="text-[10px] font-bold text-slate-300 mt-0.5">
                        {d.current_agriculture_risk || 'LOW'}
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Historical Events:</span>
                      <span className="text-white font-mono font-medium">{d.total_events}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Fatalities (1971–2026):</span>
                      <span className="text-red-400 font-mono font-medium">{d.total_deaths}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Latest 24h Rain:</span>
                      <span className="text-sky-400 font-mono font-medium">
                        {d.latest_rainfall_mm !== undefined && d.latest_rainfall_mm !== null
                          ? `${d.latest_rainfall_mm.toFixed(1)} mm`
                          : '0.0 mm'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-blue-400 font-medium group-hover:text-blue-300">
                  <span>View Full Profile</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
