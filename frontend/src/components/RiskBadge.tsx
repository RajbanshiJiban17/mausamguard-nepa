import React from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, Flame, AlertOctagon } from 'lucide-react';
import { RiskLevel, AlertPriority } from '../types';

interface RiskBadgeProps {
  level: RiskLevel | AlertPriority | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md', showIcon = true }) => {
  const norm = (level || 'LOW').toUpperCase();

  let badgeClass = 'badge-low';
  let Icon = ShieldCheck;
  let nepaliLabel = 'न्यून';

  if (norm === 'MODERATE' || norm === 'WATCH') {
    badgeClass = 'badge-moderate';
    Icon = AlertCircle;
    nepaliLabel = 'मध्यम';
  } else if (norm === 'HIGH' || norm === 'WARNING') {
    badgeClass = 'badge-high';
    Icon = AlertTriangle;
    nepaliLabel = 'उच्च';
  } else if (norm === 'VERY HIGH' || norm === 'HIGH WARNING') {
    badgeClass = 'badge-very-high';
    Icon = Flame;
    nepaliLabel = 'अति उच्च';
  } else if (norm === 'CRITICAL') {
    badgeClass = 'badge-critical';
    Icon = AlertOctagon;
    nepaliLabel = 'खतरा';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={`inline-flex items-center rounded-full transition-all ${badgeClass} ${sizeClasses[size]}`}
      role="status"
      aria-label={`Risk level: ${norm} (${nepaliLabel})`}
    >
      {showIcon && <Icon size={iconSizes[size]} className="shrink-0" />}
      <span>{norm} • {nepaliLabel}</span>
    </span>
  );
};

export default RiskBadge;
