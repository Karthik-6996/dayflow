// src/pages/employee/PayrollPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { payrollService } from '../../services/payrollService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import {
  CreditCard,
  Download,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Shield,
  FileCheck,
  Building,
  CheckCircle2,
  Printer
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { toast } from 'sonner';

export const PayrollPage = () => {
  const { currentUser } = useAuth();
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayroll = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const { data, error } = await payrollService.getEmployeePayroll(currentUser.id);
        if (error) toast.error("Error loading payroll slip");
        setPayroll(data || null);
      } finally {
        setLoading(false);
      }
    };
    loadPayroll();
  }, [currentUser]);

  const handlePrintSlip = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.success("Downloading official August 2026 Salary Slip PDF...");
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading your compensation data...
      </div>
    );
  }

  const base = payroll?.base_salary || 92000;
  const deductions = payroll?.deductions || 11500;
  const net = payroll?.net_salary || (base - deductions);
  const monthlyNet = Math.round(net / 12);
  const monthlyBase = Math.round(base / 12);
  const monthlyDed = Math.round(deductions / 12);

  const chartData = payroll?.history || [
    { month: "Mar", net: monthlyNet },
    { month: "Apr", net: monthlyNet },
    { month: "May", net: monthlyNet },
    { month: "Jun", net: monthlyNet },
    { month: "Jul", net: monthlyNet },
    { month: "Aug", net: monthlyNet }
  ];

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compensation & Payroll</h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              Read-Only View
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Official salary structure, itemized tax withholdings, and pay slip history</p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={handlePrintSlip}
          >
            Print
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={handleDownload}
            className="bg-teal-600 hover:bg-teal-700 shadow-sm"
          >
            Download Slip (PDF)
          </Button>
        </div>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 print:hidden">
        <StatCard
          title="Annual Gross Base"
          value={`$${base.toLocaleString()}`}
          subtitle={`$${monthlyBase.toLocaleString()} / monthly gross`}
          icon={DollarSign}
          color="teal"
        />
        <StatCard
          title="Total Deductions (Annual)"
          value={`$${deductions.toLocaleString()}`}
          subtitle={`$${monthlyDed.toLocaleString()} / monthly taxes & benefits`}
          icon={TrendingDown}
          color="rose"
        />
        <StatCard
          title="Annual Net Take-Home"
          value={`$${net.toLocaleString()}`}
          subtitle={`$${monthlyNet.toLocaleString()} / monthly direct deposit`}
          icon={CreditCard}
          color="emerald"
        />
      </div>

      {/* Itemized Salary Slip & Trend Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Itemized Pay Slip Card */}
        <div className="lg:col-span-2">
          <Card className="p-6 sm:p-8 bg-white border border-slate-200/80 shadow-card">
            <div className="flex items-start justify-between pb-6 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                  Official Salary Slip
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  August 2026 Pay Statement
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Pay Date: August 31, 2026 • Direct Deposit</p>
              </div>

              <div className="text-right">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Disbursed
                </span>
              </div>
            </div>

            {/* Employee Metadata Subheader */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block uppercase text-[10px]">Employee Name</span>
                <span className="font-bold text-slate-800">{currentUser?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px]">Employee ID</span>
                <span className="font-bold text-slate-800">{currentUser?.employee_id || 'DF-1001'}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px]">Department</span>
                <span className="font-bold text-slate-800">{currentUser?.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[10px]">Designation</span>
                <span className="font-bold text-slate-800">{currentUser?.job_title}</span>
              </div>
            </div>

            {/* Two Column Earnings vs Deductions Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-slate-100 text-xs">
              {/* Earnings column */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 pb-1 border-b border-slate-100">
                  Earnings & Allowances
                </h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Basic Monthly Wage</span>
                    <span className="font-semibold text-slate-900">${Math.round(monthlyBase * 0.65).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Housing Allowance (HRA)</span>
                    <span className="font-semibold text-slate-900">${Math.round(monthlyBase * 0.20).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Transport & Commute</span>
                    <span className="font-semibold text-slate-900">${Math.round(monthlyBase * 0.08).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Special Performance Allowance</span>
                    <span className="font-semibold text-slate-900">${Math.round(monthlyBase * 0.07).toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900 text-sm">
                    <span>Total Gross Earnings</span>
                    <span className="text-teal-700">${monthlyBase.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions column */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 pb-1 border-b border-slate-100">
                  Withholdings & Taxes
                </h4>
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Income Tax (Federal/State)</span>
                    <span className="font-semibold text-rose-600">-${Math.round(monthlyDed * 0.50).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Health & Dental Insurance</span>
                    <span className="font-semibold text-rose-600">-${Math.round(monthlyDed * 0.28).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">401(k) / Retirement Fund</span>
                    <span className="font-semibold text-rose-600">-${Math.round(monthlyDed * 0.22).toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900 text-sm">
                    <span>Total Deductions</span>
                    <span className="text-rose-600">-${monthlyDed.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Pay Highlight Banner */}
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">
                  Net Disbursed Amount
                </span>
                <p className="text-2xl font-extrabold text-teal-950 mt-0.5">
                  ${monthlyNet.toLocaleString()} <span className="text-xs font-medium text-teal-700">USD</span>
                </p>
              </div>
              <div className="text-xs text-teal-900/80">
                Transferred to Chase Bank (Checking •••• 4892)
              </div>
            </div>
          </Card>
        </div>

        {/* 6-Month Salary Trend Chart */}
        <div className="space-y-6 print:hidden">
          <Card className="p-6">
            <CardHeader
              title="6-Month Pay Trends"
              subtitle="Net monthly compensation consistency"
            />

            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Net Salary']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="net" fill="#0d9488" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Payroll adjustments are governed strictly by HR Operations and signed compensation agreements.</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
