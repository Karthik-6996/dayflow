// src/pages/employee/PayrollPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { payrollService } from '../../services/payrollService';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import {
  CreditCard,
  Download,
  IndianRupee,
  TrendingDown,
  Shield,
  CheckCircle2,
  Calendar,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';

export const PayrollPage = () => {
  const { currentUser, isAdmin } = useAuth();
  const defaultMonthly = currentUser?.salary ? Math.round(currentUser.salary / 12) : 75000;
  const [payroll, setPayroll] = useState({
    base_salary: currentUser?.salary || 900000,
    deductions: Math.round((currentUser?.salary || 900000) * 0.12),
    net_salary: Math.round((currentUser?.salary || 900000) * 0.88),
    monthly_net: Math.round(defaultMonthly * 0.88)
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPayroll = async () => {
      if (!currentUser) return;
      try {
        const { data, error } = await payrollService.getEmployeePayroll(currentUser.id);
        if (data) setPayroll(data);
      } catch (e) {
        console.warn("Payroll load background:", e);
      }
    };
    loadPayroll();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-400 text-xs">
        Loading compensation data...
      </div>
    );
  }

  const base = payroll?.base_salary || 900000;
  const deductions = payroll?.deductions || 24000;
  const net = payroll?.net_salary || (base - deductions);
  const monthlyNet = payroll?.monthly_net || Math.round(net / 12);
  const monthlyBase = Math.round(base / 12);
  const monthlyDed = Math.round(deductions / 12);

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Payroll & Payslip</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            View your salary slip and net monthly take-home earnings
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Monthly Take-Home"
          value={`₹${monthlyNet.toLocaleString()}`}
          subtitle="Net deposited amount"
          icon={CreditCard}
        />
        <StatCard
          title="Gross Monthly Wage"
          value={`₹${monthlyBase.toLocaleString()}`}
          subtitle="Base total before deductions"
          icon={CreditCard}
        />
        <StatCard
          title="Monthly Deductions"
          value={`-₹${monthlyDed.toLocaleString()}`}
          subtitle="Statutory PF & Professional Tax"
          icon={TrendingDown}
        />
      </div>

      {/* Salary Slip Card */}
      <Card className="p-6">
        <CardHeader
          title="Monthly Payslip Statement"
          subtitle="Disbursal details and breakdown for August 2026"
        />

        <div className="mt-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-3 text-xs">
          <div className="flex justify-between pb-2 border-b border-zinc-200 dark:border-zinc-700">
            <span className="text-zinc-600 dark:text-zinc-400">Employee Name:</span>
            <span className="font-semibold text-zinc-900 dark:text-white">{currentUser?.name}</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-zinc-200 dark:border-zinc-700">
            <span className="text-zinc-600 dark:text-zinc-400">Login ID:</span>
            <span className="font-mono font-semibold text-zinc-900 dark:text-white">{currentUser?.employee_id || currentUser?.login_id}</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-zinc-200 dark:border-zinc-700">
            <span className="text-zinc-600 dark:text-zinc-400">Department:</span>
            <span className="text-zinc-900 dark:text-white">{currentUser?.department || 'Operations'}</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-zinc-200 dark:border-zinc-700">
            <span className="text-zinc-600 dark:text-zinc-400">Basic Salary:</span>
            <span className="font-mono font-semibold text-zinc-900 dark:text-white">₹{Math.round(monthlyBase * 0.5).toLocaleString()}</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-zinc-200 dark:border-zinc-700">
            <span className="text-zinc-600 dark:text-zinc-400">HRA Allowance:</span>
            <span className="font-mono font-semibold text-zinc-900 dark:text-white">₹{Math.round(monthlyBase * 0.25).toLocaleString()}</span>
          </div>
          <div className="flex justify-between pb-2 border-b border-zinc-200 dark:border-zinc-700">
            <span className="text-zinc-600 dark:text-zinc-400">PF & Tax Deductions:</span>
            <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">-₹{monthlyDed.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-1 font-bold text-sm">
            <span className="text-zinc-900 dark:text-white">Net Disbursed:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">₹{monthlyNet.toLocaleString()}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
