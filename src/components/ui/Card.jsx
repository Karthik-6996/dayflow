// src/components/ui/Card.jsx
import React from 'react';

export const Card = ({
  children,
  className = '',
  hover = false,
  padding = 'default',
  ...props
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  return (
    <div
      className={`
        rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm
        ${hover ? 'hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all duration-200' : ''}
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
  <div className={`flex items-start justify-between pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800/80 ${className}`}>
    <div>
      {title && <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">{title}</h3>}
      {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
      {children}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);
