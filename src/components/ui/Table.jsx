// src/components/ui/Table.jsx
import React from 'react';

export const Table = ({ children, className = '' }) => (
  <div className="w-full overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
    <table className={`w-full text-left text-xs text-zinc-700 dark:text-zinc-300 ${className}`}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children, className = '' }) => (
  <thead className={`bg-zinc-50 dark:bg-zinc-900/80 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 ${className}`}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = '' }) => (
  <tbody className={`divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-white dark:bg-zinc-900/40 ${className}`}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '', hover = true, ...props }) => (
  <tr
    className={`transition-colors duration-150 ${hover ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50' : ''} ${className}`}
    {...props}
  >
    {children}
  </tr>
);

export const TableHead = ({ children, className = '', ...props }) => (
  <th className={`px-4 py-3 whitespace-nowrap ${className}`} {...props}>
    {children}
  </th>
);

export const TableCell = ({ children, className = '', ...props }) => (
  <td className={`px-4 py-3.5 whitespace-nowrap text-zinc-700 dark:text-zinc-300 ${className}`} {...props}>
    {children}
  </td>
);
