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
  MapPin,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { api } from '../api/client';
import RiskBadge from '../components/RiskBadge';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { DonutChart, MiniBarChart } from '../components/Charts';
import { DistrictDetail, HistoricalEvent } from '../types';

const getPalikaHydrology = (districtName: string, palikaName: string, nearestStation: any) => {
  const p = palikaName.toLowerCase();
  const d = (districtName || '').toLowerCase();

  if (d.includes('kailali')) {
    if (p.includes('joshipur')) {
      return {
        nepaliName: 'जोशीपुर गाउँपालिका',
        rivers: ['कान्द्रा / काढा नदी (Kandra/Kadha River)', 'पथरिया नदी (Patharaiya River)', 'कठौतिया खोला'],
        status: 'उच्च बाढी तथा डुबान जोखिम क्षेत्र (High Inundation Risk)',
        level: 'WARNING',
        advice: 'काढा र पथरिया नदीमा जलसतह बढ्दा होचो भूभाग तथा वडा नं १, ३, ७ डुबानमा पर्ने सम्भावना रहेकाले नदी किनार नजिक सतर्क रहनुहोस्।',
        station: 'भजनी / जोशीपुर कान्द्रा गेज स्टेसन'
      };
    }
    if (p.includes('bhajani')) {
      return {
        nepaliName: 'भजनी नगरपालिका',
        rivers: ['मोहना नदी (Mohana River)', 'काढा / कान्द्रा नदी (Kadha River)', 'पथरिया नदी'],
        status: 'अत्यधिक बाढी तथा डुबान संवेदनशील क्षेत्र (Critical Flood Confluence)',
        level: 'CRITICAL',
        advice: 'मोहना, कान्द्रा र पथरिया नदीको दोभान क्षेत्र भएकाले कर्णालीको पानी ब्याक हुँदा ठूलो डुबान हुने गर्दछ। उच्च सुरक्षित आश्रयस्थल तयारी अवस्थामा राख्नुहोस्।',
        station: 'भजनी कान्द्रा-मोहना बाढी स्टेसन'
      };
    }
    if (p.includes('tikapur')) {
      return {
        nepaliName: 'टीकापुर नगरपालिका',
        rivers: ['कर्णाली नदी (Karnali River)', 'पथरिया नदी (Patharaiya River)', 'जमुहा नाला'],
        status: 'कर्णाली तटीय बाढी निगरानी (Riverbank Monitoring)',
        level: 'WARNING',
        advice: 'चिसापानी स्टेसनमा कर्णालीको सतह १० मिटर नाघ्दा टीकापुर तटीय क्षेत्र (सनकट्टी, दौलतपुर) जोखिममा पर्छ।',
        station: 'चिसापानी कर्णाली स्टेसन (१०.०m सतर्कता / १०.८m खतरा)'
      };
    }
    if (p.includes('dhangadhi')) {
      return {
        nepaliName: 'धनगढी उपमहानगरपालिका',
        rivers: ['मोहना नदी (Mohana River)', 'खुटिया नदी (Khutiya River)', 'सुकुटी खोला'],
        status: 'सहरी डुबान तथा मोहना तटीय जोखिम (Urban & River Inundation)',
        level: 'WARNING',
        advice: 'मोहना नदी तटीय बस्ती र सहरी ढल निकास अवरुद्ध भई डुबान हुन सक्ने भएकाले सतर्क रहनुहोस्।',
        station: 'धनगढी / मोहना सीमा स्टेसन'
      };
    }
    if (p.includes('godawari')) {
      return {
        nepaliName: 'गोदावरी नगरपालिका',
        rivers: ['गोदावरी नदी (Godawari River)', 'खुटीया नदी तटीय जलाधार'],
        status: 'पहाडी तथा तराई दोभान बाढी जोखिम',
        level: 'WATCH',
        advice: 'चुरे जलाधारमा भारी वर्षा हुँदा गोदावरी नदीमा आकस्मिक बाढी (Flash Flood) आउन सक्ने चेतावनी।',
        station: 'गोदावरी / अत्तरिया स्टेसन'
      };
    }
    if (p.includes('gauriganga')) {
      return {
        nepaliName: 'गौरीगंगा नगरपालिका',
        rivers: ['शिवगंगा नदी (Shivganga)', 'गौरीगंगा खोला', 'कान्द्रा जलाधार'],
        status: 'मध्यम बाढी तथा गेग्रान बहाव जोखिम',
        level: 'WATCH',
        advice: 'पूर्वपश्चिम राजमार्ग तथा खोला छेउका बस्तीहरूमा पानीको सतह बढ्न सक्ने सम्भावना।',
        station: 'गौरीगंगा / कान्द्रा अपस्ट्रिम'
      };
    }
    if (p.includes('ghodaghodi')) {
      return {
        nepaliName: 'घोडाघोडी नगरपालिका',
        rivers: ['डोडा नदी (Doda)', 'कान्द्रा सहायक खोलाहरू', 'घोडाघोडी सिमसार'],
        status: 'सिमसार तथा सहायक खोला जलसतह निगरानी',
        level: 'WATCH',
        advice: 'सिमसार जलाधार क्षेत्रमा निरन्तर वर्षा हुँदा पानीको निकास ढिला भई खेतबारी डुबानको सम्भावना।',
        station: 'पहलमानपुर / घोडाघोडी स्टेसन'
      };
    }
    if (p.includes('lamki')) {
      return {
        nepaliName: 'लम्की चुहा नगरपालिका',
        rivers: ['पथरिया सहायक खोला', 'कर्णाली पश्चिम सिँचाइ नहर जलाधार'],
        status: 'मध्यम सतर्कता',
        level: 'WATCH',
        advice: 'स्थानिय खोलानालाहरूमा पानीको बहाव बढ्न सक्ने।',
        station: 'चिसापानी डाउनस्ट्रिम'
      };
    }
    if (p.includes('chure')) {
      return {
        nepaliName: 'चुरे गाउँपालिका',
        rivers: ['खुटिया मुहान', 'चुरे खोलानाला'],
        status: 'उच्च पहिरो तथा भेलबाढी जोखिम (High Landslide Threat)',
        level: 'HIGH WARNING',
        advice: 'भीरालो जमिन र कमजोर भूभाग भएकाले निरन्तर वर्षा हुँदा पहिरो र सडक अवरोधको उच्च जोखिम।',
        station: 'चुरे वर्षा मापन स्टेसन'
      };
    }
    if (p.includes('kailari')) {
      return {
        nepaliName: 'कैलारी गाउँपालिका',
        rivers: ['मोहना नदी (Mohana River)', 'कतैनी खोला', 'कान्द्रा तटीय क्षेत्र'],
        status: 'उच्च बाढी तथा तटीय कटान जोखिम',
        level: 'WARNING',
        advice: 'मोहना नदीको कटान र डुबानबाट जोगिन नदी तटीय वडाका बासिन्दाले सुरक्षित रहनुहोस्।',
        station: 'मोहना / कैलारी स्टेसन'
      };
    }
    if (p.includes('mohanyal')) {
      return {
        nepaliName: 'मोहन्याल गाउँपालिका',
        rivers: ['सेती नदी (Seti River)', 'कर्णाली खोँच जलाधार'],
        status: 'उच्च पहिरो तथा नदी कटान जोखिम',
        level: 'HIGH WARNING',
        advice: 'कर्णाली र सेती नदीको खोँचमा भेलबाढी र पहिरोको उच्च जोखिम।',
        station: 'दिपायल / कर्णाली स्टेसन'
      };
    }
    if (p.includes('bardagoriya')) {
      return {
        nepaliName: 'बर्दगोरिया गाउँपालिका',
        rivers: ['मुढा खोला', 'कान्द्रा सहायक खोलानाला'],
        status: 'स्थानिय खोला बाढी निगरानी',
        level: 'WATCH',
        advice: 'स्थानीय खोलाहरूको जलस्तरमा ध्यान दिनुहोस्।',
        station: 'कान्द्रा स्टेसन'
      };
    }
  }

  // Fallback for any other district or palika
  return {
    nepaliName: `${palikaName} स्थानीय तह`,
    rivers: [nearestStation?.station_name || `${districtName} जलाधार तथा स्थानीय खोलानाला`],
    status: 'स्थानीय जलसतह तथा मौसम निगरानी',
    level: 'WATCH',
    advice: `स्थानीय खोलानालाहरूमा वर्षाको समयमा आकस्मिक बहाव बढ्न सक्ने भएकाले सतर्क रहनुहोस्। नजिकको स्टेसन: ${nearestStation?.station_name || districtName}।`,
    station: nearestStation?.station_name || 'जिल्ला बाढी मापन केन्द्र'
  };
};

export default function DistrictDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [district, setDistrict] = useState<DistrictDetail | null>(null);
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [selectedPalika, setSelectedPalika] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setSelectedPalika(null);
    setCurrentPage(1);
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
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Municipalities & Rural Municipalities ({district.municipalities.length} Palikas / स्थानीय तहहरू)</span>
              </h3>
              <span className="text-[11px] text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2.5 py-0.5 rounded-full">
                कुनै पनि पालिकामा थिचेर स्थानीय नदी तथा सतर्कता हेर्नुहोस् (Click to Inspect)
              </span>
            </div>
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
                const isSelected = selectedPalika === name;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedPalika((prev) => (prev === name ? null : name));
                      setCurrentPage(1);
                    }}
                    className={`p-3 rounded-xl text-xs transition-all flex flex-col justify-between text-left shadow-sm border cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/80 border-blue-400 ring-2 ring-blue-500/50 shadow-blue-900/40'
                        : 'bg-slate-950/70 border-slate-800/90 hover:border-blue-500/50 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 w-full">
                      <div className={`font-bold text-xs leading-snug ${isSelected ? 'text-blue-300' : 'text-white'}`} title={name}>
                        {name}
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/60 text-[10px] w-full">
                      <span className={isSelected ? 'text-blue-200 font-bold' : 'text-cyan-400 font-medium'}>{typeLabel}</span>
                      {palika.total_events !== undefined && palika.total_events > 0 && (
                        <span className="text-slate-400 font-mono">{palika.total_events} events</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Palika Hydrology & Early Warning Panel */}
            {selectedPalika && (() => {
              const hydro = getPalikaHydrology(district.district_name, selectedPalika, district.nearest_river_station);
              const palikaFilteredCount = events.filter((ev) =>
                (ev.municipality || '').toLowerCase().includes(selectedPalika.toLowerCase()) ||
                selectedPalika.toLowerCase().includes((ev.municipality || '').toLowerCase())
              ).length;

              return (
                <div className="mt-5 bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-slate-950/80 border border-blue-500/60 rounded-2xl p-5 shadow-2xl animate-fadeIn">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-900/50 pb-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-inner">
                        <Waves className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-white">
                            {selectedPalika} ({hydro.nepaliName})
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              hydro.level === 'CRITICAL'
                                ? 'bg-red-950/90 text-red-200 border-red-600'
                                : hydro.level === 'HIGH WARNING'
                                ? 'bg-amber-950/90 text-amber-200 border-amber-600'
                                : 'bg-blue-950/90 text-blue-200 border-blue-600'
                            }`}
                          >
                            {hydro.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          स्थानीय नदी प्रणाली, जलसतह सतर्कता र पूर्वचेतावनी विवरण
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPalika(null);
                        setCurrentPage(1);
                      }}
                      className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                      <span>सबै पालिकाहरू देखाउनुहोस् (Clear Filter)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                    <div className="bg-slate-950/80 border border-slate-800/90 p-3.5 rounded-xl space-y-2">
                      <div className="text-[11px] font-semibold text-sky-400 flex items-center gap-1.5">
                        <Droplets className="w-4 h-4" />
                        <span>जोखिमयुक्त मुख्य नदीहरू (Key Rivers & Tributaries)</span>
                      </div>
                      <ul className="space-y-1.5 text-slate-200 font-medium">
                        {hydro.rivers.map((r, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800/90 p-3.5 rounded-xl space-y-2">
                      <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" />
                        <span>अनुगमन स्टेसन र सतर्कता (Monitoring Station)</span>
                      </div>
                      <p className="text-slate-200 font-semibold">{hydro.station}</p>
                      <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                        यस पालिकामा हालसम्म <strong>{palikaFilteredCount}</strong> वटा आधिकारिक विपद् घटनाहरू सूचीकृत छन्।
                      </div>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800/90 p-3.5 rounded-xl space-y-2">
                      <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                        <Info className="w-4 h-4" />
                        <span>सुरक्षा तथा पूर्वतयारी सुझाव (Precaution Advice)</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{hydro.advice}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Historical Events Table with Pagination and Palika Filter */}
        {(() => {
          const filteredEvents = selectedPalika
            ? events.filter((ev) =>
                (ev.municipality || '').toLowerCase().includes(selectedPalika.toLowerCase()) ||
                selectedPalika.toLowerCase().includes((ev.municipality || '').toLowerCase())
              )
            : events;

          const totalPages = Math.ceil(filteredEvents.length / pageSize) || 1;
          const paginatedEvents = filteredEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

          return (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Historical Disaster Events Log</span>
                    {selectedPalika && (
                      <span className="text-xs bg-blue-900/50 text-blue-300 border border-blue-700 px-2.5 py-0.5 rounded-md font-mono">
                        Filtered: {selectedPalika}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">Verifiable hazard incidents catalogued in this district.</p>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Showing {filteredEvents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, filteredEvents.length)} of {filteredEvents.length} entries
                </span>
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
                    {paginatedEvents.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-500">
                          {selectedPalika
                            ? `No disaster records catalogued for "${selectedPalika}" in this dataset.`
                            : 'No disaster records catalogued for this district in the current dataset.'}
                        </td>
                      </tr>
                    ) : (
                      paginatedEvents.map((ev) => (
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

              {/* Table Pagination Controls */}
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
        })()}
      </main>
    </div>
  );
}
