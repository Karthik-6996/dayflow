// src/components/layout/Topbar.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';
import {
  Menu,
  Bell,
  Search,
  Sparkles,
  Shield,
  UserCheck,
  CheckCircle2,
  ChevronDown,
  Clock
} from 'lucide-react';
import { mockUsers } from '../../mocks/users';

export const Topbar = ({ onMenuClick }) => {
  const { currentUser, switchPersona, isAdmin } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications = [
    { id: 1, text: "Your leave request for Aug 14 was approved by HR", time: "2 hours ago", unread: true },
    { id: 2, text: "Payroll slip for August 2026 is generated and ready for view", time: "1 day ago", unread: false },
    { id: 3, text: "Company-wide Q3 Townhall scheduled for Friday at 4 PM", time: "2 days ago", unread: false },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between">
      {/* Left section: Hamburger & Search */}
      <div className="flex items-center gap-3 lg:gap-4 flex-1 max-w-md">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global quick search bar */}
        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees, policies, leaves..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-100/80 border border-transparent focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right section: Persona switcher (Judge friendly) + Notifications + Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Demo Switcher for Hackathon Reviewers */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-semibold text-slate-700 transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            <span className="hidden sm:inline">Role:</span>
            <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[10px] ${isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'}`}>
              {currentUser?.role || 'Employee'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showPersonaMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-scale-in">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  ⚡ Live Switch Persona (Demo Mode)
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Switch perspective to test role permissions</p>
              </div>

              <div className="p-2 space-y-1">
                {mockUsers.slice(0, 4).map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      switchPersona(user.id);
                      setShowPersonaMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
                      currentUser?.id === user.id ? 'bg-teal-50 text-teal-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar src={user.profile_pic} name={user.name} size="xs" />
                      <div>
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-[10px] text-slate-400">{user.job_title} ({user.role})</p>
                      </div>
                    </div>
                    {currentUser?.id === user.id && (
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full ring-2 ring-white"></span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-scale-in">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">1 New</span>
              </div>
              <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-3 text-xs hover:bg-slate-50 transition-colors ${n.unread ? 'bg-teal-50/30' : ''}`}>
                    <p className="text-slate-700 leading-snug">{n.text}</p>
                    <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {n.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User avatar header badge */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <Avatar
            src={currentUser?.profile_pic}
            name={currentUser?.name || 'Dayflow'}
            size="sm"
            role={currentUser?.role}
          />
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser?.name}</p>
            <p className="text-[10px] text-slate-400 capitalize">{currentUser?.department}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
