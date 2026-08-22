// src/components/ui/StatCard.jsx
import React from 'react';
import { Card } from './Card';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  color = 'indigo',
  className = ''
}) => {
  return (
    <Card hover className={`relative ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1 tracking-tight">{value}</h4>
          {subtitle && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold">
              <span className={trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                {trend > 0 ? `+${trend}%` : `${trend}%`}
              </span>
              {trendLabel && <span className="text-[11px] font-normal text-zinc-400">{trendLabel}</span>}
            </div>
          )}
        </div>

        {Icon && (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80 shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </Card>
  );
};
