import React, { useEffect, useState } from 'react';
import {
  Database,
  ExternalLink,
  ShieldCheck,
  Info,
  Calendar,
  Layers,
  FileText,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function SourcesPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getDataSources().then((res) => {
      setSources(res || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DisclaimerBanner />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Open Data Governance & Traceability</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            Data Sources & Attribution Registry
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            In compliance with open science and disaster risk governance standards, every dataset, boundary layer, numerical weather prediction model, and historical incident catalogued in MausamGuard Nepal is fully cited with its original provider, licence terms, and known operational limitations.
          </p>
        </div>

        {/* Source Cards */}
        <div className="space-y-6">
          {sources.map((s, idx) => (
            <div
              key={idx}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <div className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                    {s.provider}
                  </div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {s.source_name}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-950 border border-slate-800 text-slate-300">
                    Licence: {s.licence}
                  </span>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-blue-400 hover:text-blue-300 rounded-lg transition-colors"
                      title="Visit official portal"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <h3 className="font-semibold text-slate-300 mb-1">Operational Purpose</h3>
                  <p className="text-slate-400 leading-relaxed">{s.usage_purpose}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-300 mb-1">Mandatory Attribution</h3>
                  <p className="text-slate-400 leading-relaxed font-mono text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    {s.attribution}
                  </p>
                </div>
              </div>

              {s.limitations && (
                <div className="bg-amber-950/20 border border-amber-900/30 p-3 rounded-xl text-xs space-y-1">
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5 text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5" /> Known Operational Limitations
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {s.limitations}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Verification Footer Note */}
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl text-xs text-slate-400 space-y-2">
          <div className="font-semibold text-slate-200 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span>Strict Zero-Fabrication Policy</span>
          </div>
          <p className="leading-relaxed">
            MausamGuard Nepal does not invent synthetic disaster events, simulated rain gauge heights, or fictitious forecast records. When an external government API or sensor telemetry stream is offline or non-public, the interface explicitly marks the data feed as <strong>"Live feed unavailable"</strong> and relies solely on verified offline historical benchmarks and mathematical risk baselines.
          </p>
        </div>
      </main>
    </div>
  );
}
