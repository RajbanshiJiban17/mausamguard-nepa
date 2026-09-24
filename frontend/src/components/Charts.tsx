import React, { useState } from 'react';

// Yearly Trend Chart
interface YearlyTrendProps {
  data: { year: number; event_count: number; flood_count: number; landslide_count: number }[];
}

export const YearlyTrendChart: React.FC<YearlyTrendProps> = ({ data }) => {
  const [hovered, setHovered] = useState<any>(null);

  if (!data || data.length === 0) return <div className="text-xs text-slate-500 py-8 text-center">No trend data available</div>;

  const maxVal = Math.max(...data.map(d => d.event_count), 1);
  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barW = Math.max(4, Math.floor(chartW / data.length) - 2);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px] relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding.top + chartH * (1 - ratio);
            const val = Math.round(maxVal * ratio);
            return (
              <g key={i}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={padding.left - 8} y={y + 3} fill="#64748b" fontSize="10" textAnchor="end">{val}</text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const x = padding.left + i * (chartW / data.length);
            const barH = (d.event_count / maxVal) * chartH;
            const y = padding.top + chartH - barH;
            const isHovered = hovered?.year === d.year;

            return (
              <g key={d.year} onMouseEnter={() => setHovered(d)} onMouseLeave={() => setHovered(null)} className="cursor-pointer">
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(2, barH)}
                  rx={2}
                  fill={isHovered ? '#60a5fa' : '#3b82f6'}
                  className="transition-colors duration-150"
                />
                {d.year % 5 === 0 && (
                  <text x={x + barW / 2} y={height - 8} fill="#64748b" fontSize="10" textAnchor="middle">
                    {d.year}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {hovered && (
          <div className="absolute top-2 right-4 bg-slate-900 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs text-slate-200 pointer-events-none">
            <p className="font-bold text-white mb-1">Year {hovered.year}</p>
            <p className="text-blue-400">Total Events: {hovered.event_count}</p>
            <p className="text-amber-400">Landslides: {hovered.landslide_count}</p>
            <p className="text-cyan-400">Floods: {hovered.flood_count}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Monthly Seasonality Chart
interface MonthlySeasonalityProps {
  data: { month: number; month_name: string; event_count: number; deaths: number }[];
}

export const MonthlySeasonalityChart: React.FC<MonthlySeasonalityProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const maxEvents = Math.max(...data.map(d => d.event_count), 1);

  return (
    <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-2">
      {data.map((m) => {
        const heightPct = Math.round((m.event_count / maxEvents) * 100);
        const isMonsoon = m.month >= 6 && m.month <= 9;
        return (
          <div key={m.month} className="flex flex-col items-center group">
            <span className="text-[10px] text-slate-400 font-mono mb-1">{m.event_count}</span>
            <div className="w-full bg-slate-800/80 rounded-t h-28 flex items-end p-1 relative">
              <div
                style={{ height: `${Math.max(6, heightPct)}%` }}
                className={`w-full rounded-sm transition-all duration-300 ${
                  isMonsoon
                    ? 'bg-gradient-to-t from-red-600 via-orange-500 to-amber-400 shadow-md shadow-orange-500/20'
                    : 'bg-gradient-to-t from-blue-700 to-cyan-500'
                }`}
              />
            </div>
            <span className={`text-[10px] mt-1.5 font-medium ${isMonsoon ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}>
              {m.month_name.slice(0, 3)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Forecast Rainfall Chart
interface RainfallSeriesProps {
  series: { time: string; precipitation: number; temperature?: number }[];
}

export const ForecastRainfallChart: React.FC<RainfallSeriesProps> = ({ series }) => {
  if (!series || series.length === 0) {
    return <div className="text-xs text-slate-500 py-6 text-center">No hourly forecast data available</div>;
  }

  const maxP = Math.max(...series.map(s => s.precipitation), 5.0);

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1.5 h-32 overflow-x-auto py-2">
        {series.slice(0, 36).map((item, idx) => {
          const heightPct = Math.round((item.precipitation / maxP) * 100);
          const timeLabel = item.time.includes('T') ? item.time.split('T')[1].slice(0, 5) : `${idx}h`;
          return (
            <div key={idx} className="flex-1 min-w-[20px] flex flex-col items-center h-full justify-end group relative">
              <div
                style={{ height: `${Math.max(4, heightPct)}%` }}
                className={`w-full rounded-t transition-all ${
                  item.precipitation > 5.0 ? 'bg-amber-500' : 'bg-blue-500 hover:bg-blue-400'
                }`}
              />
              <span className="text-[9px] text-slate-500 mt-1 truncate">{timeLabel}</span>
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-900 border border-slate-700 rounded p-1 text-[9px] text-white whitespace-nowrap z-20">
                {item.precipitation.toFixed(1)} mm
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>Now (Next 36 Hours)</span>
        <span>Peak Expected: {maxP.toFixed(1)} mm/hr</span>
      </div>
    </div>
  );
};

// Generic Bar Chart
interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ data, height = 180, color = '#3b82f6' }) => {
  if (!data || data.length === 0) {
    return <div className="text-xs text-slate-500 py-8 text-center">No chart data</div>;
  }

  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="w-full flex items-end gap-2 overflow-x-auto py-2" style={{ height: `${height}px` }}>
      {data.map((item, i) => {
        const heightPct = Math.round((item.value / maxVal) * 100);
        return (
          <div key={i} className="flex-1 min-w-[22px] flex flex-col items-center h-full justify-end group relative">
            <div
              style={{ height: `${Math.max(4, heightPct)}%`, backgroundColor: color }}
              className="w-full rounded-t opacity-85 group-hover:opacity-100 transition-opacity"
            />
            <span className="text-[9px] text-slate-400 mt-1 truncate font-mono">
              {item.label}
            </span>
            <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-white whitespace-nowrap z-20">
              {item.label}: {item.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Mini Bar Chart
export const MiniBarChart: React.FC<BarChartProps> = ({ data, height = 80, color = '#3b82f6' }) => {
  return <BarChart data={data} height={height} color={color} />;
};

// SVG Area Chart
interface AreaChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export const AreaChart: React.FC<AreaChartProps> = ({ data, height = 180, color = '#38bdf8' }) => {
  if (!data || data.length === 0) {
    return <div className="text-xs text-slate-500 py-8 text-center">No series data</div>;
  }

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const w = 600;
  const h = height;
  const pad = { top: 10, bottom: 25, left: 10, right: 10 };

  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const points = data.map((d, i) => {
    const x = pad.left + (i / Math.max(data.length - 1, 1)) * plotW;
    const y = pad.top + plotH - (d.value / maxVal) * plotH;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`), '');
  const areaD = `${pathD} L ${points[points.length - 1]?.x || 0},${pad.top + plotH} L ${pad.left},${pad.top + plotH} Z`;

  return (
    <div className="w-full relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <path d={areaD} fill={`url(#grad-${color})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />

        {points.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#ffffff" stroke={color} strokeWidth="1.5" />
        ))}

        {/* Labels */}
        {points.filter((_, idx) => idx % Math.ceil(data.length / 8) === 0).map((pt, idx) => (
          <text key={idx} x={pt.x} y={h - 6} fill="#64748b" fontSize="9" textAnchor="middle">
            {pt.label}
          </text>
        ))}
      </svg>
    </div>
  );
};

// SVG Donut Chart
interface DonutChartProps {
  data: { label: string; value: number; color?: string }[];
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, size = 160 }) => {
  if (!data || data.length === 0) return null;

  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = size / 2;
  const strokeW = 24;
  const r = radius - strokeW;
  const circ = 2 * Math.PI * r;

  let accOffset = 0;
  const defaultColors = ['#3b82f6', '#f59e0b', '#38bdf8', '#10b981', '#a855f7'];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <g transform={`rotate(-90 ${radius} ${radius})`}>
          {data.map((item, i) => {
            const strokeDasharray = `${(item.value / total) * circ} ${circ}`;
            const strokeDashoffset = -accOffset;
            accOffset += (item.value / total) * circ;
            const color = item.color || defaultColors[i % defaultColors.length];

            return (
              <circle
                key={i}
                cx={radius}
                cy={radius}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={strokeW}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
              />
            );
          })}
        </g>
        <text x="50%" y="50%" textAnchor="middle" dy=".3em" fill="#ffffff" fontSize="14" fontWeight="bold">
          {total.toLocaleString()}
        </text>
      </svg>

      <div className="flex flex-col gap-1.5 text-xs text-slate-300">
        {data.map((item, i) => {
          const color = item.color || defaultColors[i % defaultColors.length];
          const pct = Math.round((item.value / total) * 100);
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-slate-400 capitalize">{item.label}:</span>
              <span className="font-mono font-bold text-white">{item.value.toLocaleString()}</span>
              <span className="text-slate-500 font-mono text-[10px]">({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
