// src/pages/auth/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { changeUserPassword } from '../../services/userService';
import { Modal } from '../../components/ui/Modal';
import { Lock, Mail, Shield, User, Eye, EyeOff, Layers, Sun, Moon, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isMockMode } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Role toggle: 'employee' | 'admin'
  const [selectedRole, setSelectedRole] = useState('employee');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // First Login Password Reset State
  const [firstLoginUser, setFirstLoginUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const { resetPassword: requestPasswordReset } = useAuth();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail || !resetEmail.includes('@')) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setResetLoading(true);
    try {
      await requestPasswordReset(resetEmail.trim());
      setResetSuccess(true);
      toast.success(`Password recovery link sent to ${resetEmail}!`);
    } catch (err) {
      toast.error(err.message || "Failed to send reset link.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Pass the selectedRole so the backend verifies role permission
      const user = await login(loginIdentifier, password, selectedRole);

      // Check if first login password change is required
      if (user?.must_change_password) {
        setFirstLoginUser(user);
        toast.info("First login detected. Please establish your new permanent password.");
        return;
      }

      if (user?.role === 'admin') {
        navigate('/dashboard/employees');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid Login ID / Email or Password');
    } finally {
      setLoading(false);
    }
  };

  const handleFirstPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setUpdatingPassword(true);
    try {
      await changeUserPassword(firstLoginUser.id, { newPassword });
      toast.success("Permanent password configured! Welcome to Dayflow.");
      setFirstLoginUser(null);
      navigate('/dashboard');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const fillQuickDemo = (role) => {
    setSelectedRole(role);
    if (role === 'admin') {
      setLoginIdentifier('admin@dayflow.internal');
      setPassword('admin@123');
    } else {
      setLoginIdentifier('karthikgirish2007@gmail.com');
      setPassword('3Karthik$');
    }
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
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm mb-3">
          <Layers className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Sign in to Dayflow HRMS
        </h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Select your portal role and sign in with your Login ID or Email
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-8 px-6 sm:px-8 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          {/* Portal Role Selector (Employee vs Admin / HR) */}
          <div className="mb-5">
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Sign In As
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('employee');
                  setError('');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  selectedRole === 'employee'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" /> Employee Portal
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('admin');
                  setError('');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" /> Admin / HR Portal
              </button>
            </div>
          </div>

          {/* Quick Demo Credentials Switcher */}
          {isMockMode && (
            <div className="mb-5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  1-Click Demo Accounts
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillQuickDemo('employee')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium transition cursor-pointer ${
                    selectedRole === 'employee'
                      ? 'bg-white dark:bg-zinc-900 border-zinc-400 dark:border-zinc-600 text-zinc-900 dark:text-white font-semibold'
                      : 'bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <User className="w-3.5 h-3.5" /> Employee Demo
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('admin')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium transition cursor-pointer ${
                    selectedRole === 'admin'
                      ? 'bg-white dark:bg-zinc-900 border-zinc-400 dark:border-zinc-600 text-zinc-900 dark:text-white font-semibold'
                      : 'bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" /> Admin Demo
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
                {selectedRole === 'admin' ? 'Admin Email / Login ID' : 'Employee ID or Work Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder={selectedRole === 'admin' ? 'admin@dayflow.internal' : 'e.g. DF-1001 or name@company.com'}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(loginIdentifier.includes('@') ? loginIdentifier : '');
                    setIsForgotModalOpen(true);
                  }}
                  className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 text-xs rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition"
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
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs transition shadow-xs disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  {selectedRole === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  <span>Sign In as {selectedRole === 'admin' ? 'Administrator' : 'Employee'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800 text-center space-y-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Don't have an Account?{' '}
              <Link to="/signup" className="font-semibold text-zinc-900 dark:text-white hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory First Login Password Change Modal */}
      <Modal
        isOpen={!!firstLoginUser}
        onClose={() => {}}
        title="First Login: Change Temporary Password"
        subtitle={`Welcome ${firstLoginUser?.name}. Please choose a secure permanent password to continue.`}
      >
        <form onSubmit={handleFirstPasswordSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">New Permanent Password *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={updatingPassword}
            className="w-full py-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold cursor-pointer"
          >
            {updatingPassword ? 'Saving...' : 'Set Password & Enter Portal'}
          </button>
        </form>
      </Modal>

      {/* Forgot Password Recovery Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => {
          setIsForgotModalOpen(false);
          setResetSuccess(false);
        }}
        title="Reset Account Password"
        subtitle="Enter your registered work email to receive password reset instructions."
      >
        {resetSuccess ? (
          <div className="space-y-4 text-center py-3 text-xs">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Recovery Email Dispatched</h4>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                We've sent recovery instructions to <span className="font-semibold text-zinc-800 dark:text-zinc-200">{resetEmail}</span>. Please check your inbox.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsForgotModalOpen(false);
                setResetSuccess(false);
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs transition cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Registered Work Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resetLoading}
                className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold transition disabled:opacity-60 cursor-pointer"
              >
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
