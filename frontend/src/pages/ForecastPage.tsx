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
  Clock
} from 'lucide-react';
import { api } from '../api/client';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { AreaChart } from '../components/Charts';

export default function ForecastPage() {
  const [districtsList, setDistrictsList] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Kathmandu');
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    api.getDistricts().then((d) => {
      setDistrictsList(d || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDistrict) return;
    loadForecast(selectedDistrict);
  }, [selectedDistrict]);

  const loadForecast = async (district: string) => {
    try {
      setLoading(true);
      const res = await api.getDistrictForecast(district);
      setForecastData(res);
    } catch (err) {
      console.error('Failed to load district forecast:', err);
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

  const hourlyItems = (forecastData?.hourly_series || forecastData?.hourly_forecast || []).map((h: any) => ({
    time: h.time,
    temperature: h.temperature ?? h.temperature_2m ?? h.temperature_c ?? null,
    precipitation: h.precipitation ?? h.precipitation_mm ?? 0.0,
    humidity: h.relative_humidity ?? h.relative_humidity_2m ?? h.relative_humidity_pct ?? null,
    wind: h.wind_speed ?? h.wind_speed_10m ?? h.wind_speed_kmh ?? null,
    soil_moisture: h.soil_moisture ?? h.soil_moisture_m3m3 ?? null,
  }));

  const chartHourlyPrecip = hourlyItems.slice(0, 24).map((h: any) => ({
    label: h.time ? h.time.split('T')[1]?.slice(0, 5) || h.time : '',
    value: h.precipitation || 0,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DisclaimerBanner />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
              <CloudSun className="w-4 h-4" />
              <span>Numerical Weather Prediction</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              72-Hour Weather & Precipitation Forecast
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              High-resolution hourly weather models powered by Open-Meteo European Centre (ECMWF) / GFS ensembles for early hazard anticipation across Nepal.
            </p>
          </div>

          {/* District Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Target District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-white py-2 px-3 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
            >
              {districtsList.map((d) => (
                <option key={d.id} value={d.district_name}>
                  {d.district_name} ({d.province})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Forecast Overview Card */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="text-sm">Retrieving Open-Meteo forecast models for {selectedDistrict}...</p>
          </div>
        ) : !forecastData ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <CloudRain className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Forecast Unavailable</h3>
            <p className="text-xs text-slate-500">Live Open-Meteo service temporarily unreachable for this location.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards across horizons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">6h Horizon</div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {getHorizonSum(6)} mm
                </div>
                <div className="text-[10px] text-slate-500">Accumulated</div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">12h Horizon</div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {getHorizonSum(12)} mm
                </div>
                <div className="text-[10px] text-slate-500">Accumulated</div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">24h Horizon</div>
                <div className="text-xl font-bold font-mono text-sky-400 mt-1">
                  {getHorizonSum(24)} mm
                </div>
                <div className="text-[10px] text-slate-500">Accumulated</div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">48h Horizon</div>
                <div className="text-xl font-bold font-mono text-blue-400 mt-1">
                  {getHorizonSum(48)} mm
                </div>
                <div className="text-[10px] text-slate-500">Accumulated</div>
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
                    <h3 className="text-base font-bold text-white">Next 24-Hour Precipitation Forecast Curve</h3>
                    <p className="text-xs text-slate-400">Hourly expected rainfall in {selectedDistrict} (mm)</p>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">Source: Open-Meteo API</span>
                </div>
                <AreaChart data={chartHourlyPrecip} height={160} color="#38bdf8" />
              </div>
            )}

            {/* Detailed Hourly Table */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Hourly Meteogram Forecast Matrix</h3>
                <span className="text-xs text-slate-400">Showing upcoming hours</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Time</th>
                      <th className="py-2.5 px-4">Temperature (°C)</th>
                      <th className="py-2.5 px-4">Rainfall (mm)</th>
                      <th className="py-2.5 px-4">Humidity (%)</th>
                      <th className="py-2.5 px-4">Wind (km/h)</th>
                      <th className="py-2.5 px-4">Soil Moisture (0-7cm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {hourlyItems.slice(0, 24).map((h: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-200">
                          {h.time?.replace('T', ' ')}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-amber-400">
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
