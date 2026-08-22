// src/components/ui/Avatar.jsx
import React, { useState } from 'react';

export const Avatar = ({
  src,
  name = 'User',
  size = 'md',
  role,
  className = ''
}) => {
  const [imgError, setImgError] = useState(false);

  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const sizes = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-xl font-bold',
    '2xl': 'w-24 h-24 text-2xl font-bold'
  };

  // Generate deterministic gradient background for initials
  const colors = [
    'from-teal-500 to-emerald-600',
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-red-600',
    'from-cyan-500 to-blue-600'
  ];
  const charCode = name ? name.charCodeAt(0) : 0;
  const gradient = colors[charCode % colors.length];

  return (
    <div className="relative inline-block shrink-0">
      <div
        className={`
          ${sizes[size]} rounded-2xl overflow-hidden shadow-sm flex items-center justify-center
          border border-white ring-2 ring-slate-100 font-medium select-none
          ${src && !imgError ? 'bg-slate-100' : `bg-gradient-to-br ${gradient} text-white`}
          ${className}
        `}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {role && (
        <span
          title={`Role: ${role}`}
          className={`
            absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white
            ${role === 'admin' ? 'bg-purple-600' : 'bg-emerald-500'}
          `}
        />
      )}
    </div>
  );
};
