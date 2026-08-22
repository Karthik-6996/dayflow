// src/components/ui/Badge.jsx
import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  dot = true,
  className = ''
}) => {
  const variants = {
    // Attendance statuses
    present: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dot-emerald-500',
    absent: 'bg-rose-50 text-rose-700 border-rose-200/80 dot-rose-500',
    'half-day': 'bg-amber-50 text-amber-700 border-amber-200/80 dot-amber-500',
    leave: 'bg-sky-50 text-sky-700 border-sky-200/80 dot-sky-500',

    // Leave statuses
    pending: 'bg-amber-50 text-amber-700 border-amber-200/80 dot-amber-500',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dot-emerald-500',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200/80 dot-rose-500',
    cancelled: 'bg-slate-100 text-slate-600 border-slate-200 dot-slate-400',

    // Leave types
    paid: 'bg-teal-50 text-teal-700 border-teal-200/80 dot-teal-500',
    sick: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dot-indigo-500',
    unpaid: 'bg-slate-100 text-slate-700 border-slate-200 dot-slate-400',

    // Roles
    admin: 'bg-purple-50 text-purple-700 border-purple-200/80 dot-purple-500',
    employee: 'bg-blue-50 text-blue-700 border-blue-200/80 dot-blue-500',

    // Generic
    default: 'bg-slate-100 text-slate-700 border-slate-200 dot-slate-400',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dot-emerald-500',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80 dot-amber-500',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80 dot-rose-500',
    info: 'bg-teal-50 text-teal-700 border-teal-200/80 dot-teal-500'
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold'
  };

  const selectedVariant = variants[variant] || variants.default;
  const dotColorClass = selectedVariant.split(' ').find(c => c.startsWith('dot-'))?.replace('dot-', 'bg-') || 'bg-current';

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border
        ${sizes[size]}
        ${selectedVariant}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColorClass} animate-pulse-subtle`}></span>
      )}
      <span className="capitalize">{children}</span>
    </span>
  );
};
