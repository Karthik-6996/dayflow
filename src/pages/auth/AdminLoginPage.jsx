// src/pages/auth/AdminLoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Lock, Mail, Shield, Eye, EyeOff, Layers, Sun, Moon, ArrowLeft } from 'lucide-react';

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login, isMockMode } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password, 'admin');
      navigate('/dashboard/admin/employees');
    } catch (err) {
      setError(err.message || 'Invalid administrator credentials or access denied');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminDemo = (adminEmail = 'admin@dayflow.internal') => {
    setEmail(adminEmail);
    setPassword('admin@123');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition cursor-pointer"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-purple-900 text-purple-200 shadow-sm mb-3">
          <Shield className="w-5 h-5" />
        </div>
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Admin Portal
          </h2>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Privileged
          </span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Executive access for human resources and administrative governance
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-8 px-6 sm:px-8 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          {/* Quick Demo Credentials */}
          {isMockMode && (
            <div className="mb-5 p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                  Admin Demo Credentials
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillAdminDemo('admin@dayflow.internal')}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800 text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" /> Sys Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillAdminDemo('elena.rostova@dayflow.internal')}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800 text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" /> HR Director
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dayflow.internal"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-purple-400 dark:focus:ring-purple-600 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 text-xs rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-purple-400 dark:focus:ring-purple-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs transition shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In as Administrator'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <Link
              to="/login"
              className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Employee Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
