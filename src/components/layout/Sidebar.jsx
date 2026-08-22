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
  DollarSign,
  LogOut,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { currentUser, isAdmin, logout } = useAuth();

  const employeeLinks = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, end: true },
    { name: 'Attendance', to: '/dashboard/attendance', icon: CalendarCheck },
    { name: 'Leave Requests', to: '/dashboard/leaves', icon: CalendarDays },
    { name: 'My Payroll', to: '/dashboard/payroll', icon: CreditCard },
    { name: 'My Profile', to: '/dashboard/profile', icon: User },
  ];

  const adminLinks = [
    { name: 'Employee Directory', to: '/dashboard/admin/employees', icon: Users },
    { name: 'All Attendance', to: '/dashboard/admin/attendance', icon: ClipboardList },
    { name: 'Leave Approvals', to: '/dashboard/admin/leaves', icon: ShieldCheck },
    { name: 'Payroll Operations', to: '/dashboard/admin/payroll', icon: DollarSign },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col
          transition-transform duration-300 ease-in-out border-r border-slate-800/80
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                Dayflow <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">HRMS</span>
              </span>
              <p className="text-[10px] text-slate-400">Enterprise Workspace</p>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
          {/* Employee section */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Self Service
            </div>
            <nav className="space-y-1">
              {employeeLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `
                      group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive
                        ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Admin section — only rendered if user has admin role */}
          {isAdmin && (
            <div className="pt-4 border-t border-slate-800/80">
              <div className="px-3 mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
                  Admin & HR Ops
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">
                  HR Portal
                </span>
              </div>
              <nav className="space-y-1">
                {adminLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) => `
                        group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                        ${isActive
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 transition-transform group-hover:scale-110 text-purple-400" />
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-purple-400" />
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* User Card in Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-teal-600/30 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-xs shrink-0">
                {currentUser?.name?.slice(0, 2).toUpperCase() || 'DF'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{currentUser?.name || 'Employee'}</p>
                <p className="text-[10px] text-slate-400 capitalize">{currentUser?.role} • {currentUser?.department || 'Operations'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
