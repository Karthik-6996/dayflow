// src/components/layout/DashboardLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* Horizontal Header / Navigation Bar (No Sidebar) */}
      <Topbar />

      {/* Main Content Body across full width */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
};
