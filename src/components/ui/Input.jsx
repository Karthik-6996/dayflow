// src/components/ui/Input.jsx
import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  required,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          className={`
            block w-full rounded-lg border text-xs transition-all duration-150
            bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400
            ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2
            ${error 
              ? 'border-rose-300 dark:border-rose-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-200' 
              : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600'}
            disabled:bg-zinc-50 dark:disabled:bg-zinc-900 disabled:text-zinc-400 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export const Textarea = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  id,
  required,
  rows = 3,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        required={required}
        rows={rows}
        className={`
          block w-full rounded-lg border text-xs transition-all duration-150
          bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 p-3
          ${error 
            ? 'border-rose-300 dark:border-rose-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-200' 
            : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600'}
          disabled:bg-zinc-50 dark:disabled:bg-zinc-900 disabled:text-zinc-400 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export const Select = forwardRef(({
  label,
  error,
  helperText,
  options = [],
  className = '',
  id,
  required,
  children,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        required={required}
        className={`
          block w-full rounded-lg border text-xs transition-all duration-150
          bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 px-3 py-2
          ${error 
            ? 'border-rose-300 dark:border-rose-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-200' 
            : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600'}
          disabled:bg-zinc-50 dark:disabled:bg-zinc-900 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {children || options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{helperText}</p>}
    </div>
  );
});

Select.displayName = 'Select';
