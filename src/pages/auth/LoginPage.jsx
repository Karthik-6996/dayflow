// src/pages/auth/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Mail, Send, Shield, User, Info, Hand, Eye, EyeOff } from 'lucide-react';

export const LoginPage = () => {
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
      const user = await login(email, password);
      // Route based on role
      if (user?.role === 'admin') {
        navigate('/dashboard/admin/employees');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@dayflow.internal');
      setPassword('admin@123');
    } else {
      setEmail('karthikgirish2007@gmail.com');
      setPassword('3Karthik$');
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#bea0ff] text-white relative">
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'repeating-radial-gradient(ellipse at 18% 26%, transparent 0 18px, rgba(255,255,255,.28) 19px 21px, transparent 22px 40px)',
        }}
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-5 py-8 lg:px-10">
        <div className="w-full max-w-6xl grid items-center gap-8 lg:grid-cols-[220px_minmax(0,780px)]">
          <div className="hidden lg:flex flex-col items-end gap-4">
            <div className="h-72 w-44 rounded-[1.45rem] bg-[#111112] shadow-[0_22px_35px_rgba(19,11,42,.38)]" />
            <div className="mr-[-3.25rem] h-16 w-28 rounded-br-full border-b-[5px] border-r-[5px] border-[#1f1531] rotate-[18deg]" />
          </div>

          <section className="mx-auto grid w-full max-w-[780px] overflow-hidden rounded-[2rem] bg-[#111112] shadow-[0_24px_52px_rgba(28,13,58,.42)] lg:min-h-[500px] lg:grid-cols-[1fr_365px] lg:rounded-[2.2rem]">
            <div className="flex flex-col justify-center px-7 py-10 sm:px-12 lg:px-16">
              <div className="mb-8 flex items-center justify-center gap-2">
                <h1 className="text-[1.7rem] font-extrabold tracking-normal text-white sm:text-3xl">
                  Welcome back
                </h1>
                <Hand className="h-6 w-6 rotate-12 text-[#ffbd66]" />
              </div>

              {isMockMode && (
                <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#bba4ff]">
                    <Info className="h-3.5 w-3.5" /> Demo Accounts
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => fillQuickDemo('employee')}
                      className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[11px] font-semibold text-zinc-200 transition hover:bg-white/[0.1]"
                    >
                      <User className="h-3.5 w-3.5" /> Employee
                    </button>
                    <button
                      type="button"
                      onClick={() => fillQuickDemo('admin')}
                      className="flex items-center justify-center gap-2 rounded-full border border-[#7a34e6]/40 bg-[#7230d8]/20 px-3 py-2 text-[11px] font-semibold text-[#d6c5ff] transition hover:bg-[#7230d8]/30"
                    >
                      <Shield className="h-3.5 w-3.5" /> Admin
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[255px] space-y-3">
                {error && (
                  <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-200">
                    {error}
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="h-12 w-full rounded-full border-2 border-zinc-600 bg-transparent pl-10 pr-4 text-sm font-medium text-white placeholder:text-zinc-500 outline-none transition focus:border-[#7b35df] focus:ring-4 focus:ring-[#7b35df]/20"
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
                      placeholder="Password"
                      className="h-12 w-full rounded-full border-2 border-zinc-600 bg-transparent pl-10 pr-11 text-sm font-medium text-white placeholder:text-zinc-500 outline-none transition focus:border-[#7b35df] focus:ring-4 focus:ring-[#7b35df]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
                      tabIndex={-1}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="mt-2 text-right">
                    <button type="button" className="text-[11px] font-semibold text-zinc-300 transition hover:text-white">
                      Forgot Password?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#7130d8] text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(113,48,216,.32)] transition hover:bg-[#7d38e7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      Log In <Send className="h-4 w-4 fill-white" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 text-center space-y-3">
                <p className="text-[11px] text-zinc-400">
                  Credentials provided by Company HR & IT.
                </p>

                <div className="pt-3 border-t border-white/5">
                  <Link
                    to="/admin/login"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-300 hover:text-purple-200 transition"
                  >
                    <Shield className="h-3.5 w-3.5" /> Switch to Admin & HR Portal →
                  </Link>
                </div>
              </div>
            </div>

            <div className="hidden p-4 lg:block">
              <div className="relative h-full min-h-[468px] overflow-hidden rounded-[2rem] bg-[#ff9b6e]">
                <div className="absolute inset-x-0 top-0 h-32 bg-[#ffa06d]" />
                <div className="absolute -right-8 top-6 h-6 w-36 rounded-full bg-slate-100" />
                <div className="absolute right-1 top-3 h-12 w-24 rounded-t-full bg-slate-100" />
                <div className="absolute -left-16 top-92 h-40 w-[30rem] rounded-[50%] bg-[#5131b8]" />
                <div className="absolute -right-24 top-14 h-48 w-[30rem] rounded-[50%] bg-[#6d38cb]" />
                <div className="absolute -left-12 top-24 h-48 w-[26rem] rounded-[50%] bg-[#43219a]" />
                <div className="absolute -right-20 top-48 h-28 w-80 rounded-l-full bg-[#32155f]" />
                <div className="absolute left-24 top-48 h-8 w-20 rounded-t-full bg-[#1a0b2d]" />
                <div className="absolute left-28 top-40 h-20 w-1 rotate-[-8deg] bg-[#1a0b2d]" />
                <div className="absolute left-16 top-80 h-64 w-[34rem] rounded-[45%] border-[26px] border-[#4d2182] bg-[#ddecff]" />
                <div className="absolute -left-6 top-60 h-60 w-[35rem] rounded-[45%] border-[26px] border-[#4d2182] bg-[#e9f2ff]" />
                <div className="absolute -left-16 top-80 h-64 w-[34rem] rounded-[45%] border-[26px] border-[#4d2182] bg-[#ddecff]" />
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-[#d9e9ff]" />
                <div className="absolute inset-x-0 bottom-0 h-36 opacity-55 [background-image:repeating-linear-gradient(90deg,transparent_0_19px,#7894cf_20px_22px,transparent_23px_42px)]" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
