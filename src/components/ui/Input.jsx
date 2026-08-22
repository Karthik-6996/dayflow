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
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          className={`
            block w-full rounded-xl border transition-all duration-200 text-sm
            bg-white text-slate-900 placeholder:text-slate-400
            ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2.5
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
              : 'border-slate-200 hover:border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100'}
            disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
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
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        required={required}
        rows={rows}
        className={`
          block w-full rounded-xl border transition-all duration-200 text-sm
          bg-white text-slate-900 placeholder:text-slate-400 p-3.5
          ${error 
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
            : 'border-slate-200 hover:border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100'}
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
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
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        required={required}
        className={`
          block w-full rounded-xl border transition-all duration-200 text-sm
          bg-white text-slate-900 px-3.5 py-2.5
          ${error 
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
            : 'border-slate-200 hover:border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100'}
          disabled:bg-slate-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {children || options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
});

Select.displayName = 'Select';
