// src/pages/auth/VerifyEmailPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MailCheck, ArrowRight, RefreshCw } from 'lucide-react';

export const VerifyEmailPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-slate-950/80 border-slate-800 p-8 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
            <MailCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Check your mailbox
          </h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            We sent a secure verification link to your email address. Please click the link to confirm your Dayflow workspace account.
          </p>

          <div className="mt-8 space-y-3">
            <Link to="/login" className="block">
              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5">
                Proceed to Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Resend verification email
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
