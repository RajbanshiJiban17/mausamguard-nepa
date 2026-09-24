import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'emerald' | 'amber' | 'orange' | 'rose' | 'purple';
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  onClick,
}) => {
  const variantStyles = {
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/50',
      iconBg: 'bg-blue-500/10 text-blue-400',
      glow: 'hover:shadow-blue-500/10',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/50',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      glow: 'hover:shadow-emerald-500/10',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/50',
      iconBg: 'bg-amber-500/10 text-amber-400',
      glow: 'hover:shadow-amber-500/10',
    },
    orange: {
      border: 'border-orange-500/20 hover:border-orange-500/50',
      iconBg: 'bg-orange-500/10 text-orange-400',
      glow: 'hover:shadow-orange-500/10',
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/50',
      iconBg: 'bg-rose-500/10 text-rose-400',
      glow: 'hover:shadow-rose-500/10',
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/50',
      iconBg: 'bg-purple-500/10 text-purple-400',
      glow: 'hover:shadow-purple-500/10',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={`glass-panel p-5 transition-all duration-300 ${style.border} ${style.glow} hover:shadow-xl ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1 font-mono tracking-tight">
            {value}
          </h3>
          {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${style.iconBg}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
};
