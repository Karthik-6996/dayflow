// src/components/ui/Card.jsx
import React from 'react';

export const Card = ({
  children,
  className = '',
  hover = false,
  glass = false,
  padding = 'default',
  ...props
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8'
  };

  return (
    <div
      className={`
        rounded-2xl border border-slate-200/80 bg-white
        ${glass ? 'glass-panel shadow-sm' : 'shadow-card'}
        ${hover ? 'hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-0.5' : ''}
        ${paddings[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, title, subtitle, action, className = '' }) => (
  <div className={`flex items-start justify-between pb-4 mb-4 border-b border-slate-100 ${className}`}>
    <div>
      {title && <h3 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h3>}
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      {children}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);
