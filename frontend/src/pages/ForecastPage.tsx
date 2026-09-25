import React, { useEffect, useState } from 'react';
import {
  CloudSun,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  Calendar,
  Compass,
  Search,
  RefreshCw,
  Info,
  Clock,
  MapPin,
  AlertTriangle,
  Sun,
  CloudLightning,
  Cloud,
  ChevronRight
} from 'lucide-react';
import { api } from '../api/client';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { AreaChart } from '../components/Charts';
import Pagination from '../components/Pagination';

// Weather code interpretation helper
const getWeatherInfo = (code: number | null | undefined) => {
  if (code === null || code === undefined) return { label: 'Clear / Fair', icon: Sun, color: 'text-amber-400' };
  if (code === 0) return { label: 'Clear Sky', icon: Sun, color: 'text-amber-400' };
  if (code === 1 || code === 2) return { label: 'Partly Cloudy', icon: CloudSun, color: 'text-sky-300' };
  if (code === 3) return { label: 'Overcast', icon: Cloud, color: 'text-slate-300' };
  if (code >= 51 && code <= 65) return { label: 'Rain / Drizzle', icon: CloudRain, color: 'text-blue-400' };
  if (code >= 80 && code <= 82) return { label: 'Heavy Showers', icon: CloudRain, color: 'text-sky-400' };
  if (code >= 95) return { label: 'Thunderstorm', icon: CloudLightning, color: 'text-yellow-400' };
  return { label: 'Rainy', icon: CloudRain, color: 'text-blue-400' };
};

export default function ForecastPage() {
  const [districtsList, setDistrictsList] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Kailali');
  const [palikasList, setPalikasList] = useState<any[]>([]);
  const [selectedPalika, setSelectedPalika] = useState<string>('Joshipur');
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Hourly table pagination (24 hours per page = 7 full daily pages)
  const [hourlyPage, setHourlyPage] = useState<number>(1);
  const HOURLY_PAGE_SIZE = 24;

  useEffect(() => {
    api.getDistricts().then((d) => {
      setDistrictsList(d || []);
    }).catch(() => {});
  }, []);

  // When district changes, reload palikas list
  useEffect(() => {
    if (!selectedDistrict) return;
    api.getDistrictPalikas(selectedDistrict)
      .then((palikas) => {
        setPalikasList(palikas || []);
        // If current district is Kailali, default to Joshipur if not set
        if (selectedDistrict.toLowerCase() === 'kailali') {
          setSelectedPalika('Joshipur');
        } else {
          setSelectedPalika('');
        }
      })
      .catch(() => {
        setPalikasList([]);
        setSelectedPalika('');
      });
  }, [selectedDistrict]);

  // Load forecast whenever district or palika changes
  useEffect(() => {
    if (!selectedDistrict) return;
    loadForecast(selectedDistrict, selectedPalika);
    setHourlyPage(1);
  }, [selectedDistrict, selectedPalika]);

  const loadForecast = async (district: string, palika?: string) => {
    try {
      setLoading(true);
      const res = await api.getDistrictForecast(district, palika || undefined, 7);
      setForecastData(res);
    } catch (err) {
      console.error('Failed to load forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHorizonSum = (hours: number): string => {
    if (!forecastData) return '0.0';
    if (Array.isArray(forecastData.horizons)) {
      const item = forecastData.horizons.find((h: any) => h.horizon_hours === hours);
      if (item && item.precipitation_sum !== undefined) return Number(item.precipitation_sum).toFixed(1);
    }
    const key = `${hours}h`;
    const obj = forecastData.horizons?.[key];
    const val = obj?.precipitation_mm ?? obj?.precipitation_sum;
    if (val !== undefined && val !== null) return Number(val).toFixed(1);
    return '0.0';
  };

  const dailyItems: any[] = forecastData?.daily_forecast || [];

  const allHourlyItems = (forecastData?.hourly_series || forecastData?.hourly_forecast || []).map((h: any) => ({
    time: h.time,
    temperature: h.temperature ?? h.temperature_2m ?? h.temperature_c ?? null,
    precipitation: h.precipitation ?? h.precipitation_mm ?? 0.0,
    humidity: h.relative_humidity ?? h.relative_humidity_2m ?? h.relative_humidity_pct ?? null,
    wind: h.wind_speed ?? h.wind_speed_10m ?? h.wind_speed_kmh ?? null,
    weather_code: h.weather_code ?? null,
    soil_moisture: h.soil_moisture ?? h.soil_moisture_m3m3 ?? null,
  }));

  // Paginated hourly slice
  const totalHourlyRecords = allHourlyItems.length;
  const totalHourlyPages = Math.ceil(totalHourlyRecords / HOURLY_PAGE_SIZE) || 1;
  const currentHourlyItems = allHourlyItems.slice(
    (hourlyPage - 1) * HOURLY_PAGE_SIZE,
    hourlyPage * HOURLY_PAGE_SIZE
  );

  const chartHourlyPrecip = allHourlyItems.slice(0, 48).map((h: any) => ({
    label: h.time ? h.time.split('T')[1]?.slice(0, 5) || h.time : '',
    value: h.precipitation || 0,
  }));

  const activePalikaName = forecastData?.palika_name || selectedPalika;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DisclaimerBanner />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header & Location Selectors */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              <CloudSun className="w-4 h-4" />
              <span>7-Day Weather & Precipitation Forecast (स्थानीय तह ७-दिने पूर्वानुमान)</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              Local Government 7-Day Forecast & Warning
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              High-resolution hourly and 7-day weather models powered by Open-Meteo European Centre (ECMWF) / GFS ensembles for early hazard anticipation down to local Palikas across Nepal.
            </p>
          </div>

          {/* District & Local Government Selectors */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            {/* District Selector */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">District (जिल्ला)</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-white py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500 font-semibold cursor-pointer"
              >
                {districtsList.map((d) => (
                  <option key={d.id} value={d.district_name}>
                    {d.district_name} ({d.province})
                  </option>
                ))}
              </select>
            </div>

            {/* Local Government / Palika Selector */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-emerald-400 block">
                Local Palika (स्थानीय तह)
              </label>
              <select
                value={selectedPalika}
                onChange={(e) => setSelectedPalika(e.target.value)}
                className="bg-slate-950 border border-emerald-800/80 text-xs text-emerald-300 py-2 px-3 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer"
              >
                <option value="">सबै स्थानीय तह (District Centroid)</option>
                {palikasList.map((p, idx) => (
                  <option key={idx} value={p.palika_name}>
                    {p.palika_name} {p.palika_name.toLowerCase() === 'joshipur' ? '★ (जोशीपुर)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => loadForecast(selectedDistrict, selectedPalika)}
              className="mt-4 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Refresh Forecast"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Shortcut Buttons for Kailali Flood-Prone Palikas */}
        {selectedDistrict.toLowerCase() === 'kailali' && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-950/20 border border-blue-800/40 rounded-xl text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              कैलालीका बाढी प्रभावित स्थानीय तहहरू:
            </span>
            {['Joshipur', 'Bhajani', 'Tikapur', 'Dhangadhi', 'Kailari'].map((pName) => {
              const isSelected = selectedPalika.toLowerCase() === pName.toLowerCase();
              return (
                <button
                  key={pName}
                  onClick={() => setSelectedPalika(pName)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 border border-blue-400'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {pName} {pName === 'Joshipur' ? '🌊 (जोशीपुर)' : ''}
                </button>
              );
            })}
          </div>
        )}

        {/* Active Target Banner */}
        <div className="bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-slate-950 border border-blue-800/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Selected Target Location:</div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <span>
                  {activePalikaName ? `${activePalikaName} Palika` : selectedDistrict}
                </span>
                <span className="text-xs font-normal text-slate-400">
                  ({selectedDistrict} District)
                </span>
                {forecastData?.latitude && forecastData?.longitude && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-800">
                    {forecastData.latitude.toFixed(3)}°N, {forecastData.longitude.toFixed(3)}°E
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium">
            <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">7-Day Rain Total: </span>
              <strong className="text-sky-400 font-mono text-sm">
                {forecastData?.total_7d_rainfall_mm !== undefined
                  ? `${forecastData.total_7d_rainfall_mm.toFixed(1)} mm`
                  : `${getHorizonSum(72)} mm (3d)`}
              </strong>
            </div>
            <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">Model: </span>
              <strong className="text-emerald-400">ECMWF / GFS Live</strong>
            </div>
          </div>
        </div>

        {/* Loading / Error / Content */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="text-sm">
              Retrieving 7-day Open-Meteo numerical forecast for{' '}
              {activePalikaName ? `${activePalikaName}, ` : ''}{selectedDistrict}...
            </p>
          </div>
        ) : !forecastData ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <CloudRain className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Forecast Unavailable</h3>
            <p className="text-xs text-slate-500">Live Open-Meteo service temporarily unreachable for this location.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 7-DAY FORECAST SUMMARY CARDS */}
            {dailyItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    ७-दिने दैनिक मौसम तथा वर्षा विवरण (7-Day Daily Outlook)
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">DHM Reference Calibrated</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {dailyItems.map((day: any, idx: number) => {
                    const info = getWeatherInfo(day.weather_code);
                    const Icon = info.icon;
                    const dateObj = new Date(day.date);
                    const dayName = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                    const isRainHeavy = (day.precipitation_sum || 0) >= 30;

                    return (
                      <div
                        key={idx}
                        className={`bg-slate-900/60 border rounded-2xl p-3.5 flex flex-col justify-between text-center transition-all hover:bg-slate-900 ${
                          idx === 0
                            ? 'border-blue-500/60 shadow-lg shadow-blue-500/10'
                            : isRainHeavy
                            ? 'border-red-900/60 bg-red-950/10'
                            : 'border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="text-[11px] font-bold text-white uppercase tracking-wider">
                            {dayName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {day.date?.slice(5)}
                          </div>

                          <div className="my-3 flex flex-col items-center justify-center">
                            <Icon className={`w-8 h-8 ${info.color} mb-1`} />
                            <span className="text-[10px] text-slate-300 font-medium leading-tight">
                              {info.label}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-800/60 text-xs">
                          <div className="flex items-center justify-center gap-1.5 font-mono">
                            <span className="text-amber-400 font-bold">
                              {day.temp_max !== null ? `${Math.round(day.temp_max)}°` : '--'}
                            </span>
                            <span className="text-slate-500">/</span>
                            <span className="text-sky-300">
                              {day.temp_min !== null ? `${Math.round(day.temp_min)}°` : '--'}
                            </span>
                          </div>

                          <div className="font-mono font-bold text-sky-400 text-xs">
                            {day.precipitation_sum !== null ? `${Number(day.precipitation_sum).toFixed(1)} mm` : '0.0 mm'}
                          </div>

                          {day.precipitation_probability !== null && (
                            <div className="text-[10px] text-slate-400">
                              {day.precipitation_probability}% Rain Prob
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* KPI Cards across horizons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">6h Horizon</div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {getHorizonSum(6)} mm
                </div>
                <div className="text-[10px] text-slate-500">Immediate</div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">12h Horizon</div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {getHorizonSum(12)} mm
                </div>
                <div className="text-[10px] text-slate-500">Half-day</div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">24h Horizon</div>
                <div className="text-xl font-bold font-mono text-sky-400 mt-1">
                  {getHorizonSum(24)} mm
                </div>
                <div className="text-[10px] text-slate-500">1-Day Total</div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">48h Horizon</div>
                <div className="text-xl font-bold font-mono text-blue-400 mt-1">
                  {getHorizonSum(48)} mm
                </div>
                <div className="text-[10px] text-slate-500">2-Day Total</div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">72h Total</div>
                <div className="text-xl font-bold font-mono text-indigo-400 mt-1">
                  {getHorizonSum(72)} mm
                </div>
                <div className="text-[10px] text-slate-500">3-Day Total</div>
              </div>
            </div>

            {/* Hourly Precipitation Curve */}
            {chartHourlyPrecip.length > 0 && (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">48-Hour Precipitation Forecast Curve</h3>
                    <p className="text-xs text-slate-400">
                      Hourly expected rainfall in {activePalikaName ? `${activePalikaName}, ` : ''}{selectedDistrict} (mm)
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">Source: Open-Meteo API</span>
                </div>
                <AreaChart data={chartHourlyPrecip} height={160} color="#38bdf8" />
              </div>
            )}

            {/* Detailed Hourly Table with PAGINATION */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/70">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Hourly Meteogram Forecast Matrix (घण्टागत मौसम विवरण)</span>
                    <span className="text-xs font-normal text-slate-400">
                      — {activePalikaName ? `${activePalikaName} Palika` : selectedDistrict}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    168-hour continuous forecast timeline paginated by 24 hours per day
                  </p>
                </div>

                {/* Day jump buttons */}
                <div className="flex items-center gap-1 overflow-x-auto text-xs">
                  {Array.from({ length: totalHourlyPages }).map((_, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => setHourlyPage(pIdx + 1)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium font-mono transition-colors whitespace-nowrap ${
                        hourlyPage === pIdx + 1
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Day {pIdx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Time (NPT)</th>
                      <th className="py-2.5 px-4">Condition</th>
                      <th className="py-2.5 px-4 font-mono">Temp (°C)</th>
                      <th className="py-2.5 px-4 font-mono">Rain (mm)</th>
                      <th className="py-2.5 px-4 font-mono">Humidity (%)</th>
                      <th className="py-2.5 px-4 font-mono">Wind (km/h)</th>
                      <th className="py-2.5 px-4 font-mono">Soil Moisture</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {currentHourlyItems.map((h: any, i: number) => {
                      const info = getWeatherInfo(h.weather_code);
                      const Icon = info.icon;
                      return (
                        <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-4 font-mono font-medium text-slate-200">
                            {h.time?.replace('T', ' ')}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="inline-flex items-center gap-1.5 text-xs">
                              <Icon className={`w-3.5 h-3.5 ${info.color}`} />
                              <span>{info.label}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-amber-400 font-semibold">
                            {h.temperature !== null ? `${Number(h.temperature).toFixed(1)}°C` : 'N/A'}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-sky-400">
                            {h.precipitation !== null ? `${Number(h.precipitation).toFixed(1)} mm` : '0.0 mm'}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-blue-300">
                            {h.humidity !== null ? `${Math.round(h.humidity)}%` : 'N/A'}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-300">
                            {h.wind !== null ? `${Number(h.wind).toFixed(1)} km/h` : 'N/A'}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-emerald-400">
                            {h.soil_moisture !== null ? `${(Number(h.soil_moisture) * 100).toFixed(1)}%` : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Hourly Table Pagination Controls */}
              <Pagination
                currentPage={hourlyPage}
                totalPages={totalHourlyPages}
                totalRecords={totalHourlyRecords}
                pageSize={HOURLY_PAGE_SIZE}
                onPageChange={(p) => setHourlyPage(p)}
                itemName="hours of forecast"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
