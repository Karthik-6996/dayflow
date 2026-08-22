// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  User,
  Users,
  ShieldCheck,
  ClipboardList,
  IndianRupee,
  LogOut,
  Layers,
  Sparkles,
  FileText,
  BarChart3
} from 'lucide-react';

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { currentUser, isAdmin, logout } = useAuth();

  const employeeLinks = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
    { name: 'Attendance', to: '/dashboard/attendance', icon: CalendarCheck },
    { name: 'Leave Requests', to: '/dashboard/leaves', icon: CalendarDays },
    { name: 'My Payroll', to: '/dashboard/payroll', icon: CreditCard },
    { name: 'Reports & Slips', to: '/dashboard/reports', icon: FileText },
    { name: 'My Profile', to: '/dashboard/profile', icon: User },
  ];

  const adminLinks = [
    { name: 'Employee Directory', to: '/dashboard/admin/employees', icon: Users },
    { name: 'All Attendance', to: '/dashboard/admin/attendance', icon: ClipboardList },
    { name: 'Leave Approvals', to: '/dashboard/admin/leaves', icon: ShieldCheck },
    { name: 'Payroll Operations', to: '/dashboard/admin/payroll', icon: IndianRupee },
    { name: 'Reports & Analytics', to: '/dashboard/admin/reports', icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col
          transition-transform duration-200 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-bold text-sm shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                Dayflow
              </span>
              <span className="text-[10px] ml-1.5 font-semibold text-zinc-400 dark:text-zinc-500 uppercase">HRMS</span>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex-1 px-3 py-5 overflow-y-auto space-y-6">
          {/* Employee section */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Self Service
            </div>
            <nav className="space-y-0.5">
              {employeeLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `
                      group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors
                      ${isActive
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Admin section */}
          {isAdmin && (
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div className="px-3 mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Admin & HR
                </span>
              </div>
              <nav className="space-y-0.5">
                {adminLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) => `
                        group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors
                        ${isActive
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}
                      `}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* User Card in Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between p-2 rounded-lg">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 font-bold text-xs shrink-0">
                {currentUser?.name?.slice(0, 2).toUpperCase() || 'DF'}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">{currentUser?.name || 'Employee'}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize">{currentUser?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
