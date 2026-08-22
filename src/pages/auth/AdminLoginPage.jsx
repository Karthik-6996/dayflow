// src/pages/auth/AdminLoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Mail, Send, Shield, ShieldAlert, KeyRound, Sparkles, Info, Eye, EyeOff } from 'lucide-react';

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login, isMockMode } = useAuth();
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
      // Authenticate requiring 'admin' role
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
    <div className="min-h-screen overflow-hidden bg-[#241242] text-white relative">
      {/* Background patterned overlay with deep administrative violet gradient */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(168, 85, 247, 0.25) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.2) 0%, transparent 50%), repeating-radial-gradient(ellipse at 18% 26%, transparent 0 18px, rgba(255,255,255,.18) 19px 21px, transparent 22px 40px)',
        }}
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-5 py-8 lg:px-10">
        <div className="w-full max-w-6xl grid items-center gap-8 lg:grid-cols-[220px_minmax(0,780px)]">
          {/* Left decorative sidebar element */}
          <div className="hidden lg:flex flex-col items-end gap-4">
            <div className="h-72 w-44 rounded-[1.45rem] bg-[#0c0914] shadow-[0_22px_35px_rgba(10,5,25,.6)] border border-purple-900/30 flex flex-col justify-end p-5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-bold text-purple-200">HR & Ops Gate</p>
              <p className="text-[10px] text-purple-400/80">Secured Access</p>
            </div>
            <div className="mr-[-3.25rem] h-16 w-28 rounded-br-full border-b-[5px] border-r-[5px] border-[#381a63] rotate-[18deg]" />
          </div>

          <section className="mx-auto grid w-full max-w-[780px] overflow-hidden rounded-[2rem] bg-[#0d0a14] border border-purple-500/20 shadow-[0_24px_52px_rgba(20,8,45,.65)] lg:min-h-[520px] lg:grid-cols-[1fr_365px] lg:rounded-[2.2rem]">
            <div className="flex flex-col justify-center px-7 py-10 sm:px-12 lg:px-16">
              {/* Badge & Title */}
              <div className="mb-2 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-[11px] font-bold uppercase tracking-wider text-purple-300">
                  <KeyRound className="h-3.5 w-3.5" /> Management Portal
                </span>
              </div>

              <div className="mb-8 flex items-center justify-center gap-2">
                <h1 className="text-[1.7rem] font-extrabold tracking-normal text-white sm:text-3xl">
                  Admin Sign In
                </h1>
                <Shield className="h-6 w-6 text-[#c084fc]" />
              </div>

              {isMockMode && (
                <div className="mb-5 rounded-2xl border border-purple-500/30 bg-purple-950/40 p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#d8b4fe]">
                    <Info className="h-3.5 w-3.5" /> Admin Demo Credentials
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => fillAdminDemo('alex.rivera@dayflow.internal')}
                      className="flex items-center justify-center gap-1.5 rounded-full border border-purple-400/40 bg-purple-600/30 px-3 py-2 text-[11px] font-semibold text-purple-100 transition hover:bg-purple-600/50"
                    >
                      <Shield className="h-3.5 w-3.5 text-purple-300" /> Alex (HR Lead)
                    </button>
                    <button
                      type="button"
                      onClick={() => fillAdminDemo('elena.rostova@dayflow.internal')}
                      className="flex items-center justify-center gap-1.5 rounded-full border border-purple-400/40 bg-purple-600/30 px-3 py-2 text-[11px] font-semibold text-purple-100 transition hover:bg-purple-600/50"
                    >
                      <Shield className="h-3.5 w-3.5 text-purple-300" /> Elena (Director)
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[270px] space-y-3">
                {error && (
                  <div className="rounded-2xl border border-rose-400/30 bg-rose-500/15 px-4 py-3 text-xs font-medium text-rose-200 flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Admin work email"
                    className="h-12 w-full rounded-full border-2 border-purple-900/60 bg-black/40 pl-10 pr-4 text-sm font-medium text-white placeholder:text-zinc-500 outline-none transition focus:border-[#9333ea] focus:ring-4 focus:ring-[#9333ea]/20"
                  />
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Admin password"
                      className="h-12 w-full rounded-full border-2 border-purple-900/60 bg-black/40 pl-10 pr-11 text-sm font-medium text-white placeholder:text-zinc-500 outline-none transition focus:border-[#9333ea] focus:ring-4 focus:ring-[#9333ea]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-purple-300 transition"
                      tabIndex={-1}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="mt-2 text-right">
                    <button type="button" className="text-[11px] font-semibold text-purple-300/80 transition hover:text-white">
                      Reset Privileges?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#9333ea] to-[#7928ca] text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(147,51,234,.35)] transition hover:from-[#a855f7] hover:to-[#8b35ea] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      Enter Admin Portal <Send className="h-4 w-4 fill-white" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-purple-900/40 text-center space-y-2">
                <p className="text-[12px] font-medium text-zinc-400">
                  Standard employee account?{' '}
                  <Link to="/login" className="font-bold text-purple-300 hover:text-white underline underline-offset-2">
                    Employee Portal Sign In
                  </Link>
                </p>
              </div>
            </div>

            {/* Right Abstract Art Panel with Executive Dark Theme */}
            <div className="hidden p-4 lg:block">
              <div className="relative h-full min-h-[480px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#7e22ce] via-[#581c87] to-[#3b0764]">
                <div className="absolute inset-x-0 top-0 h-32 bg-[#9333ea]/40" />
                <div className="absolute -right-8 top-6 h-6 w-36 rounded-full bg-purple-200/20" />
                <div className="absolute right-1 top-3 h-12 w-24 rounded-t-full bg-purple-300/20" />
                <div className="absolute -left-16 top-92 h-40 w-[30rem] rounded-[50%] bg-[#3b0764]" />
                <div className="absolute -right-24 top-14 h-48 w-[30rem] rounded-[50%] bg-[#6b21a8]" />
                <div className="absolute -left-12 top-24 h-48 w-[26rem] rounded-[50%] bg-[#581c87]" />
                <div className="absolute -right-20 top-48 h-28 w-80 rounded-l-full bg-[#2e1065]" />
                <div className="absolute left-24 top-48 h-8 w-20 rounded-t-full bg-[#1a0b2d]" />
                <div className="absolute left-28 top-40 h-20 w-1 rotate-[-8deg] bg-[#1a0b2d]" />
                <div className="absolute left-16 top-80 h-64 w-[34rem] rounded-[45%] border-[26px] border-[#3b0764] bg-[#ede9fe]/10" />
                <div className="absolute -left-6 top-60 h-60 w-[35rem] rounded-[45%] border-[26px] border-[#3b0764] bg-[#fae8ff]/10" />
                <div className="absolute -left-16 top-80 h-64 w-[34rem] rounded-[45%] border-[26px] border-[#3b0764] bg-[#ede9fe]/10" />
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-[#2e1065]/60" />
                <div className="absolute inset-x-0 bottom-0 h-36 opacity-30 [background-image:repeating-linear-gradient(90deg,transparent_0_19px,#c084fc_20px_22px,transparent_23px_42px)]" />

                {/* Subtle overlay card */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-purple-500/30">
                  <div className="flex items-center gap-2 text-purple-300 text-xs font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5" /> Dayflow Administration
                  </div>
                  <p className="text-[11px] text-purple-200/80">
                    Manage directory, approve leaves, review timesheets, and run payroll.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
