// src/components/layout/Topbar.jsx
import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar } from '../ui/Avatar';
import { attendanceService } from '../../services/attendanceService';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  CreditCard,
  Sun,
  Moon,
  ChevronDown,
  User,
  LogOut,
  Layers,
  KeyRound,
  ShieldCheck,
  ClipboardList,
  IndianRupee,
  Play,
  Square
} from 'lucide-react';
import { toast } from 'sonner';

export const Topbar = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isPunching, setIsPunching] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  const handleQuickCheck = async () => {
    setIsPunching(true);
    try {
      if (!isCheckedIn) {
        await attendanceService.checkIn(currentUser.id);
        setIsCheckedIn(true);
        toast.success("Checked in successfully for today!");
      } else {
        await attendanceService.checkOut(`att-${currentUser.id}`);
        setIsCheckedIn(false);
        toast.success("Checked out successfully. Shift ended!");
      }
    } catch (e) {
      toast.error("Attendance action failed");
    } finally {
      setIsPunching(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 lg:px-8 flex items-center justify-between">
      {/* Left: Brand & Horizontal Nav Links */}
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
              Dayflow
            </span>
            <span className="text-[10px] ml-1.5 font-bold text-teal-700 dark:text-teal-400 uppercase">HRMS</span>
          </div>
        </Link>

        {/* Center / Navigation Menu (Role-Aware) */}
        <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-zinc-200 dark:border-zinc-800">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) => `
              px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5
              ${isActive ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'}
            `}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </NavLink>

          <NavLink
            to="/dashboard/profile"
            className={({ isActive }) => `
              px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5
              ${isActive ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'}
            `}
          >
            <User className="w-3.5 h-3.5" />
            Profile
          </NavLink>

          <NavLink
            to="/dashboard/attendance"
            className={({ isActive }) => `
              px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5
              ${isActive ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'}
            `}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            Attendance
          </NavLink>

          <NavLink
            to="/dashboard/leaves"
            className={({ isActive }) => `
              px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5
              ${isActive ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'}
            `}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Leave Requests
          </NavLink>

          <NavLink
            to="/dashboard/payroll"
            className={({ isActive }) => `
              px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5
              ${isActive ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'}
            `}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Payroll
          </NavLink>

          {/* Admin Operations Sub-Menu */}
          {isAdmin && (
            <div className="flex items-center gap-1 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <NavLink
                to="/dashboard/admin/employees"
                className={({ isActive }) => `
                  px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5
                  ${isActive ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30'}
                `}
              >
                <Users className="w-3.5 h-3.5" />
                Staff Directory
              </NavLink>

              <NavLink
                to="/dashboard/admin/attendance"
                className={({ isActive }) => `
                  px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5
                  ${isActive ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30'}
                `}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Admin Attendance
              </NavLink>

              <NavLink
                to="/dashboard/admin/leaves"
                className={({ isActive }) => `
                  px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5
                  ${isActive ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30'}
                `}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Leave Approvals
              </NavLink>
            </div>
          )}
        </nav>
      </div>

      {/* Right Controls: Quick Punch + Theme + User Profile Dropdown */}
      <div className="flex items-center gap-3">
        {/* Quick Check-In / Check-Out */}
        <button
          type="button"
          disabled={isPunching}
          onClick={handleQuickCheck}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
            isCheckedIn
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isCheckedIn ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isPunching ? '...' : isCheckedIn ? 'Check Out' : 'Check In'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
        </button>

        {/* User Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <Avatar
              src={currentUser?.profile_pic}
              name={currentUser?.name || 'User'}
              size="sm"
              role={currentUser?.role}
            />
            <div className="hidden sm:block text-left pr-1">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                {currentUser?.name || 'User'}
              </p>
              <p className="text-[10px] text-zinc-500 capitalize">{currentUser?.role || 'Employee'}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {profileDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 animate-scale-in text-xs"
              onClick={() => setProfileDropdownOpen(false)}
            >
              <div className="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{currentUser?.name}</p>
                <p className="text-[11px] text-zinc-500 font-mono">{currentUser?.employee_id || 'DF-1001'}</p>
              </div>

              <Link
                to="/dashboard/profile"
                className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
              >
                <User className="w-3.5 h-3.5 text-zinc-400" />
                My Profile
              </Link>

              <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

              <button
                type="button"
                onClick={logout}
                className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
