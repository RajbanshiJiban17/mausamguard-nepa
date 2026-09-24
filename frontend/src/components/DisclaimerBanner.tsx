import React, { useState } from 'react';
import { Info, X, ShieldAlert } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-slate-900/90 border-b border-amber-500/30 px-4 py-2 text-xs text-slate-300 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <ShieldAlert className="text-amber-400 shrink-0" size={16} />
          <span className="truncate">
            <strong className="text-amber-300 font-medium">Decision Support Advisory:</strong> This platform monitors multi-hazard and agricultural risk using observational and forecast models. It is <strong className="text-white">not</strong> an authoritative emergency order. For official warnings, refer to Nepal's <strong className="text-blue-400">Department of Hydrology and Meteorology (DHM)</strong> and <strong className="text-blue-400">NDRRMA</strong>.
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-1 shrink-0 rounded transition-colors"
          title="Dismiss advisory"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default DisclaimerBanner;
