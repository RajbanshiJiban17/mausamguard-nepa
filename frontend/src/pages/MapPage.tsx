import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import {
  Layers,
  Search,
  Filter,
  RefreshCw,
  Info,
  Maximize2,
  Minimize2,
  Compass,
  AlertTriangle,
  Droplets,
  Mountain,
  Waves,
  Calendar,
  ExternalLink,
  X,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';
import RiskBadge from '../components/RiskBadge';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { RiskLevel } from '../types';

// Risk Colors
const RISK_COLORS: Record<string, string> = {
  LOW: '#10b981',
  MODERATE: '#f59e0b',
  HIGH: '#f97316',
  'VERY HIGH': '#ef4444',
  CRITICAL: '#a855f7',
  DEFAULT: '#334155'
};

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const eventMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const riverMarkersLayerRef = useRef<L.LayerGroup | null>(null);

  const [districtsData, setDistrictsData] = useState<any[]>([]);
  const [geojsonFeatures, setGeojsonFeatures] = useState<any>(null);
  const [riverStations, setRiverStations] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<any | null>(null);
  const [districtDetails, setDistrictDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Layer Toggles
  const [showDistricts, setShowDistricts] = useState<boolean>(true);
  const [showFloods, setShowFloods] = useState<boolean>(true);
  const [showLandslides, setShowLandslides] = useState<boolean>(true);
  const [showRivers, setShowRivers] = useState<boolean>(true);
  const [showChoroplethRisk, setShowChoroplethRisk] = useState<boolean>(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [28.3949, 84.1240], // Nepal geographic centroid
      zoom: 7,
      minZoom: 6,
      maxZoom: 14,
      zoomControl: false,
    });

    // Dark Basemap (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    const eventGroup = L.layerGroup().addTo(map);
    const riverGroup = L.layerGroup().addTo(map);

    eventMarkersLayerRef.current = eventGroup;
    riverMarkersLayerRef.current = riverGroup;
    mapInstanceRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Fetch Core Spatial Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [geojsonRes, districtsList, riversRes] = await Promise.all([
          api.getDistrictsGeoJSON(),
          api.getDistricts(),
          api.getRiverStations()
        ]);

        setGeojsonFeatures(geojsonRes);
        setDistrictsData(districtsList || []);
        setRiverStations(riversRes || []);
      } catch (err) {
        console.error('Failed to load map data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Render GeoJSON Districts Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geojsonFeatures) return;

    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
      geojsonLayerRef.current = null;
    }

    if (!showDistricts) return;

    // Create district lookup map
    const districtMap = new Map();
    districtsData.forEach((d) => {
      districtMap.set(d.district_name.toLowerCase(), d);
    });

    const geojson = L.geoJSON(geojsonFeatures, {
      style: (feature) => {
        const name = feature?.properties?.district_name || feature?.properties?.district || feature?.properties?.DISTRICT || '';
        const d = districtMap.get(name.toLowerCase());
        const riskLevel = d?.current_overall_risk || 'LOW';
        const color = showChoroplethRisk ? (RISK_COLORS[riskLevel] || RISK_COLORS.DEFAULT) : '#3b82f6';

        const isSelected = selectedDistrict && selectedDistrict.district_name.toLowerCase() === name.toLowerCase();

        return {
          fillColor: color,
          weight: isSelected ? 3 : 1.2,
          opacity: 0.9,
          color: isSelected ? '#60a5fa' : '#475569',
          dashArray: isSelected ? '' : '2',
          fillOpacity: isSelected ? 0.65 : 0.35,
        };
      },
      onEachFeature: (feature, layer) => {
        const name = feature?.properties?.district_name || feature?.properties?.district || feature?.properties?.DISTRICT || '';
        const d = districtMap.get(name.toLowerCase());

        layer.bindTooltip(
          `<div class="p-1 font-sans">
            <div class="font-bold text-sm text-white">${name}</div>
            <div class="text-xs text-slate-300">Province: ${d?.province || 'Nepal'}</div>
            <div class="text-xs font-semibold mt-1" style="color:${RISK_COLORS[d?.current_overall_risk || 'LOW']}">
              Risk: ${d?.current_overall_risk || 'LOW'}
            </div>
          </div>`,
          { sticky: true, className: 'map-custom-tooltip' }
        );

        layer.on({
          click: () => {
            if (d) {
              handleSelectDistrict(d);
            }
          },
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({
              weight: 2.5,
              color: '#93c5fd',
              fillOpacity: 0.55,
            });
          },
          mouseout: (e) => {
            const isSel = selectedDistrict && selectedDistrict.district_name.toLowerCase() === name.toLowerCase();
            if (!isSel && geojsonLayerRef.current) {
              geojsonLayerRef.current.resetStyle(e.target);
            }
          }
        });
      }
    }).addTo(map);

    geojsonLayerRef.current = geojson;
  }, [geojsonFeatures, districtsData, showDistricts, showChoroplethRisk, selectedDistrict]);

  // Render Historical Hazard Events Layer
  useEffect(() => {
    const eventGroup = eventMarkersLayerRef.current;
    if (!eventGroup) return;

    eventGroup.clearLayers();

    if (!showFloods && !showLandslides) return;

    // Load recent historical events for overlay
    api.getEvents({ limit: 120 })
      .then((res) => {
        const events = res.data || [];
        events.forEach((ev: any) => {
          if (!ev.latitude || !ev.longitude) return;
          const hazard = ev.hazard_type.toLowerCase();

          if (hazard.includes('flood') && !showFloods) return;
          if (hazard.includes('landslide') && !showLandslides) return;

          let color = '#3b82f6'; // flood blue
          if (hazard.includes('landslide')) color = '#f59e0b'; // amber
          if (hazard.includes('avalanche')) color = '#38bdf8'; // sky blue

          const marker = L.circleMarker([ev.latitude, ev.longitude], {
            radius: Math.min(Math.max((ev.deaths || 0) * 1.5 + 4, 4), 12),
            fillColor: color,
            color: '#ffffff',
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.6,
          });

          marker.bindPopup(`
            <div class="p-2 text-slate-900 font-sans text-xs">
              <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mb-1" style="background:${color}22; color:${color}">
                ${ev.hazard_type}
              </span>
              <div class="font-bold text-sm mb-1">${ev.district} ${ev.municipality ? ' - ' + ev.municipality : ''}</div>
              <div class="text-slate-600 mb-1">Date: ${ev.date}</div>
              <div class="grid grid-cols-2 gap-1 text-[11px] bg-slate-100 p-1.5 rounded mb-1">
                <div>Deaths: <strong class="text-red-600">${ev.deaths || 0}</strong></div>
                <div>Missing: <strong>${ev.missing || 0}</strong></div>
                <div>Injured: <strong>${ev.injured || 0}</strong></div>
                <div>Destroyed: <strong>${ev.houses_destroyed || 0}</strong></div>
              </div>
              <div class="text-[10px] text-slate-500 italic">Source: ${ev.source}</div>
            </div>
          `);

          eventGroup.addLayer(marker);
        });
      })
      .catch((err) => console.error('Failed to load map events:', err));
  }, [showFloods, showLandslides]);

  // Render River Stations Layer
  useEffect(() => {
    const riverGroup = riverMarkersLayerRef.current;
    if (!riverGroup) return;

    riverGroup.clearLayers();

    if (!showRivers || !riverStations.length) return;

    riverStations.forEach((st: any) => {
      if (!st.latitude || !st.longitude) return;

      const riverIcon = L.divIcon({
        className: 'custom-river-pin',
        html: `<div style="background:#0284c7; width:12px; height:12px; border-radius:50%; border:2px solid #ffffff; box-shadow:0 0 8px #38bdf8;"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      const marker = L.marker([st.latitude, st.longitude], { icon: riverIcon });
      marker.bindPopup(`
        <div class="p-2 text-slate-900 font-sans text-xs">
          <div class="flex items-center gap-1.5 mb-1 text-sky-600 font-bold text-xs uppercase">
            <span class="w-2 h-2 rounded-full bg-sky-500"></span> River Gauge
          </div>
          <div class="font-bold text-sm mb-0.5">${st.station_name}</div>
          <div class="text-slate-600 text-xs mb-1">Basin: ${st.basin} | ${st.district}</div>
          <div class="bg-sky-50 p-1.5 rounded text-[11px] mb-1">
            <div>Warning Level: <strong>${st.warning_level_m ? st.warning_level_m + ' m' : 'N/A'}</strong></div>
            <div>Danger Level: <strong>${st.danger_level_m ? st.danger_level_m + ' m' : 'N/A'}</strong></div>
            <div>Status: <span class="text-amber-700 font-medium">${st.status}</span></div>
          </div>
          <div class="text-[10px] text-slate-500">Source: ${st.source} (DHM Nepal Benchmark)</div>
        </div>
      `);

      riverGroup.addLayer(marker);
    });
  }, [showRivers, riverStations]);

  // Handle District Click / Selection
  const handleSelectDistrict = async (district: any) => {
    setSelectedDistrict(district);
    setLoadingDetails(true);

    if (mapInstanceRef.current && district.latitude && district.longitude) {
      mapInstanceRef.current.flyTo([district.latitude, district.longitude], 9, {
        duration: 1.2
      });
    }

    try {
      const details = await api.getDistrictDetail(district.district_name);
      setDistrictDetails(details);
    } catch (err) {
      console.error('Failed to load district detail:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([28.3949, 84.1240], 7, { duration: 1.0 });
    }
    setSelectedDistrict(null);
    setDistrictDetails(null);
  };

  const filteredDistricts = districtsData.filter((d) => {
    const matchesSearch = d.district_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvince = selectedProvince === 'all' || d.province === selectedProvince;
    return matchesSearch && matchesProvince;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] relative overflow-hidden bg-slate-950">
      <DisclaimerBanner />

      {/* Floating Top Control Toolbar */}
      <div className="absolute top-12 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Search & Filters */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-xl shadow-2xl">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search 77 districts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-white pl-9 pr-3 py-1.5 rounded-lg w-44 md:w-56 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Provinces (7)</option>
            <option value="Koshi">Koshi</option>
            <option value="Madhesh">Madhesh</option>
            <option value="Bagmati">Bagmati</option>
            <option value="Gandaki">Gandaki</option>
            <option value="Lumbini">Lumbini</option>
            <option value="Karnali">Karnali</option>
            <option value="Sudurpashchim">Sudurpashchim</option>
          </select>

          <button
            onClick={handleResetView}
            title="Reset to Nepal view"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>

        {/* Layer Toggles Pill */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-xl shadow-2xl text-xs">
          <button
            onClick={() => setShowChoroplethRisk(!showChoroplethRisk)}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
              showChoroplethRisk ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Risk Choropleth</span>
          </button>

          <button
            onClick={() => setShowFloods(!showFloods)}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
              showFloods ? 'bg-sky-600/30 text-sky-400 border border-sky-500/40' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Floods</span>
          </button>

          <button
            onClick={() => setShowLandslides(!showLandslides)}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
              showLandslides ? 'bg-amber-600/30 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Mountain className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Landslides</span>
          </button>

          <button
            onClick={() => setShowRivers(!showRivers)}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${
              showRivers ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rivers</span>
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 w-full h-full relative">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Map Legend (Bottom-Left) */}
        <div className="absolute bottom-6 left-6 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-2xl max-w-xs text-xs">
          <div className="font-semibold text-slate-200 mb-2 flex items-center justify-between">
            <span>Risk Assessment Legend</span>
            <span className="text-[10px] text-slate-500 font-mono">DHM/Open-Meteo</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500"></span>
              <span className="text-slate-300">Low Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-500"></span>
              <span className="text-slate-300">Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-orange-500"></span>
              <span className="text-slate-300">High Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-500"></span>
              <span className="text-slate-300">Very High</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-purple-500"></span>
              <span className="text-slate-300">Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-white bg-sky-500"></span>
              <span className="text-slate-300">River Gauge</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1.5 leading-tight">
            Click any district to view live weather, multi-hazard risk engine factors & historical exposure.
          </div>
        </div>
      </div>

      {/* Slide-Over District Inspection Drawer */}
      {selectedDistrict && (
        <div className="absolute top-12 right-4 bottom-6 w-96 max-w-[calc(100vw-2rem)] z-[1001] bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-start justify-between bg-slate-950/40">
            <div>
              <div className="text-xs uppercase tracking-wider text-blue-400 font-semibold">
                {selectedDistrict.province} Province
              </div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {selectedDistrict.district_name}
              </h2>
            </div>
            <button
              onClick={() => {
                setSelectedDistrict(null);
                setDistrictDetails(null);
              }}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {loadingDetails ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-xs">Computing district risk profile...</span>
              </div>
            ) : (
              <>
                {/* Overall Risk Card */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Overall Risk Level</span>
                    <RiskBadge level={districtDetails?.current_overall_risk || selectedDistrict.current_overall_risk || 'LOW'} />
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    {districtDetails?.risk_explanation || 'Evaluation based on antecedent precipitation, DEM terrain slope, and historical exposure.'}
                  </div>
                </div>

                {/* Sub-Hazard Matrix */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-950/50 border border-slate-800 p-2.5 rounded-lg text-center">
                    <Droplets className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                    <div className="text-[10px] text-slate-400">Flood</div>
                    <div className="mt-1">
                      <RiskBadge level={districtDetails?.current_flood_risk || selectedDistrict.current_flood_risk || 'LOW'} size="sm" showIcon={false} />
                    </div>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-800 p-2.5 rounded-lg text-center">
                    <Mountain className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <div className="text-[10px] text-slate-400">Landslide</div>
                    <div className="mt-1">
                      <RiskBadge level={districtDetails?.current_landslide_risk || selectedDistrict.current_landslide_risk || 'LOW'} size="sm" showIcon={false} />
                    </div>
                  </div>
                  <div className="bg-slate-950/50 border border-slate-800 p-2.5 rounded-lg text-center">
                    <AlertTriangle className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <div className="text-[10px] text-slate-400">Agri Stress</div>
                    <div className="mt-1">
                      <RiskBadge level={districtDetails?.current_agriculture_risk || selectedDistrict.current_agriculture_risk || 'LOW'} size="sm" showIcon={false} />
                    </div>
                  </div>
                </div>

                {/* Live Weather & Rainfall */}
                <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Latest 24h Rainfall</span>
                    <span className="text-white font-mono font-bold">
                      {selectedDistrict.latest_rainfall_mm !== undefined && selectedDistrict.latest_rainfall_mm !== null
                        ? `${selectedDistrict.latest_rainfall_mm.toFixed(1)} mm`
                        : '0.0 mm'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">DHM Warning Ref (24h)</span>
                    <span className="text-amber-400 font-mono font-medium">140 mm</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Active Warning Alerts</span>
                    <span className="text-red-400 font-bold">
                      {selectedDistrict.active_alert_count || 0} active
                    </span>
                  </div>
                </div>

                {/* Historical Exposure Statistics */}
                <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-xl">
                  <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                    <span>Historical Record (1971–2026)</span>
                    <span className="text-[10px] text-slate-500 font-mono">BIPAD / DesInventar</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/60 p-2 rounded">
                      <div className="text-slate-400 text-[10px]">Total Events</div>
                      <div className="text-base font-bold text-white font-mono">{selectedDistrict.total_events}</div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded">
                      <div className="text-slate-400 text-[10px]">Total Fatalities</div>
                      <div className="text-base font-bold text-red-400 font-mono">{selectedDistrict.total_deaths}</div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded">
                      <div className="text-slate-400 text-[10px]">Houses Destroyed</div>
                      <div className="text-base font-bold text-amber-400 font-mono">{selectedDistrict.houses_destroyed}</div>
                    </div>
                    <div className="bg-slate-900/60 p-2 rounded">
                      <div className="text-slate-400 text-[10px]">Population (2021)</div>
                      <div className="text-base font-bold text-blue-400 font-mono">
                        {selectedDistrict.population ? (selectedDistrict.population / 1000).toFixed(0) + 'k' : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nearest River Station */}
                {districtDetails?.nearest_river_station && (
                  <div className="bg-sky-950/20 border border-sky-900/40 p-3 rounded-xl text-xs space-y-1">
                    <div className="font-semibold text-sky-300 flex items-center gap-1.5">
                      <Waves className="w-3.5 h-3.5" /> Nearest Gauge: {districtDetails.nearest_river_station.station_name}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Basin: {districtDetails.nearest_river_station.basin} | Distance: ~{districtDetails.nearest_river_station.distance_km?.toFixed(1)} km
                    </div>
                    <div className="text-[10px] text-slate-500 italic mt-1">
                      Note: Live telemetry subject to DHM portal availability.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60">
            <Link
              to={`/district/${selectedDistrict.district_name}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
            >
              <span>Explore Full District Analytics</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
