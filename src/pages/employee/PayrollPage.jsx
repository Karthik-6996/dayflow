// src/pages/employee/PayrollPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { payrollService } from '../../services/payrollService';
import { formatINR, numberToINRWords } from '../../lib/currency';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import {
  CreditCard,
  Download,
  IndianRupee,
  TrendingDown,
  TrendingUp,
  Shield,
  FileCheck,
  Building,
  CheckCircle2,
  Printer,
  Calendar,
  Landmark,
  FileText,
  Info,
  Layers
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
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0); // 0 = latest (Aug 2026)

  useEffect(() => {
    const loadPayroll = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const { data, error } = await payrollService.getEmployeePayroll(currentUser.id);
        if (error) toast.error("Error loading payroll statement");
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
    toast.success(`Downloading official ${currentSlip?.fullMonth || 'August 2026'} Salary Slip PDF...`);
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-sm">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading your compensation data in INR...
      </div>
    );
  }

  const base = payroll?.base_salary || 1450000;
  const deductions = payroll?.deductions || 237000;
  const net = payroll?.net_salary || (base - deductions);
  const monthlyNet = Math.round(net / 12);
  const monthlyBase = Math.round(base / 12);
  const monthlyDed = Math.round(deductions / 12);

  // History slips
  const slips = payroll?.history || [];
  const reversedSlips = [...slips].reverse();
  const currentSlip = reversedSlips[selectedMonthIndex] || slips[slips.length - 1] || {
    fullMonth: "August 2026",
    calendarDays: 31,
    paidDays: 31,
    lopDays: 0,
    gross: monthlyBase,
    deductions: monthlyDed,
    net: monthlyNet,
    payDate: "2026-08-31",
    utr: "HDFCN26083100654",
    earnings: {
      basic: Math.round(monthlyBase * 0.5),
      hra: Math.round(monthlyBase * 0.25),
      specialAllowance: Math.round(monthlyBase * 0.15),
      conveyanceMedical: monthlyBase - (Math.round(monthlyBase * 0.5) + Math.round(monthlyBase * 0.25) + Math.round(monthlyBase * 0.15)),
      bonus: 0,
      total: monthlyBase
    },
    deductionsBreakdown: {
      epf: Math.round(monthlyBase * 0.5 * 0.12),
      pt: 200,
      tds: Math.max(0, monthlyDed - Math.round(monthlyBase * 0.5 * 0.12) - 200 - 1250),
      healthInsurance: 1250,
      lopDeduction: 0,
      total: monthlyDed
    }
  };

  const chartData = slips.map(s => ({
    month: s.month,
    net: s.net,
    gross: s.gross
  }));

  const bank = currentUser?.bank_details || {
    bank_name: "HDFC Bank Ltd",
    account_no: "50100492817492",
    ifsc: "HDFC0001234",
    pan: "ABCDE1234F",
    uan: "100982374612",
    pf_no: "BG/BNG/1009823/001"
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <IndianRupee className="w-6 h-6 text-teal-700" />
              Compensation & Salary Slips
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              INR (₹) Standard
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official Indian salary structure, itemized EPF/PT/TDS deductions, and verifiable pay statements.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={handlePrintSlip}
            className="shadow-sm"
          >
            Print
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={handleDownload}
            className="bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20"
          >
            Download Slip (PDF)
          </Button>
        </div>
      </div>

      {/* Top 3 Stat Cards (in INR) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 print:hidden">
        <StatCard
          title="Annual Gross CTC"
          value={formatINR(base)}
          subtitle={`${formatINR(monthlyBase)} / monthly gross`}
          icon={IndianRupee}
          color="teal"
        />
        <StatCard
          title="Total Annual Deductions"
          value={formatINR(deductions)}
          subtitle={`${formatINR(monthlyDed)} / monthly EPF, PT & TDS`}
          icon={TrendingDown}
          color="rose"
        />
        <StatCard
          title="Annual Net Take-Home"
          value={formatINR(net)}
          subtitle={`${formatINR(monthlyNet)} / monthly direct bank credit`}
          icon={CreditCard}
          color="emerald"
        />
      </div>

      {/* Pay Slip Month Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 print:hidden">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
          <Calendar className="w-3.5 h-3.5" /> Pay Statement:
        </span>
        {reversedSlips.map((slip, idx) => (
          <button
            key={slip.fullMonth}
            onClick={() => setSelectedMonthIndex(idx)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedMonthIndex === idx
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {slip.fullMonth}
          </button>
        ))}
      </div>

      {/* Main Grid: Itemized Pay Slip & Financial Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Itemized Official Pay Slip Card */}
        <div className="lg:col-span-2">
          <Card className="p-6 sm:p-8 bg-white border border-slate-200/90 shadow-card print:border-none print:shadow-none print:p-0">
            {/* Payslip Header with Company Branding */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-900">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-black text-sm">
                    DF
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                      Dayflow HRMS India Private Limited
                    </h2>
                    <p className="text-[10px] text-slate-500">CIN: U72200KA2026PTC123456 • Bengaluru, Karnataka 560103</p>
                  </div>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-widest bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 block sm:inline-block mb-1">
                  Salary Pay Slip
                </span>
                <p className="text-xs font-extrabold text-slate-900">{currentSlip?.fullMonth || 'August 2026'}</p>
                <p className="text-[10px] text-slate-500 font-mono">Disbursal Date: {currentSlip?.payDate || '2026-08-31'}</p>
              </div>
            </div>

            {/* Employee Metadata Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block uppercase text-[9px] font-bold">Employee Name</span>
                <span className="font-bold text-slate-800">{currentUser?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[9px] font-bold">Employee ID</span>
                <span className="font-mono font-bold text-slate-800">{currentUser?.employee_id || 'DF-1001'}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[9px] font-bold">Department</span>
                <span className="font-semibold text-slate-800">{currentUser?.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[9px] font-bold">Designation</span>
                <span className="font-semibold text-slate-800">{currentUser?.job_title}</span>
              </div>

              <div>
                <span className="text-slate-400 block uppercase text-[9px] font-bold">Bank Name</span>
                <span className="font-semibold text-slate-800">{bank.bank_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[9px] font-bold">Bank Account</span>
                <span className="font-mono font-semibold text-slate-800">•••• {bank.account_no?.slice(-4) || '4892'}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[9px] font-bold">IFSC Code</span>
                <span className="font-mono font-semibold text-slate-800">{bank.ifsc}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[9px] font-bold">Income Tax PAN</span>
                <span className="font-mono font-semibold text-slate-800">{bank.pan}</span>
              </div>

              <div>
                <span className="text-slate-400 block uppercase text-[9px] font-bold">PF / UAN No.</span>
                <span className="font-mono font-semibold text-slate-800">{bank.uan}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[9px] font-bold">Calendar Days</span>
                <span className="font-mono font-semibold text-slate-800">{currentSlip?.calendarDays || 31} Days</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[9px] font-bold">Paid Days</span>
                <span className="font-mono font-semibold text-emerald-700">{currentSlip?.paidDays || 31} Days</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase text-[9px] font-bold">Loss of Pay (LOP)</span>
                <span className="font-mono font-semibold text-slate-800">{currentSlip?.lopDays || 0} Days</span>
              </div>
            </div>

            {/* Two Column Earnings vs Deductions Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-5 border-b border-slate-100 text-xs">
              {/* Earnings column */}
              <div>
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] mb-3 pb-1 border-b border-slate-200 flex justify-between">
                  <span>Gross Earnings</span>
                  <span>Amount (₹)</span>
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-mono font-semibold text-slate-900">{formatINR(currentSlip.earnings?.basic || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">House Rent Allowance (HRA)</span>
                    <span className="font-mono font-semibold text-slate-900">{formatINR(currentSlip.earnings?.hra || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Special Allowance</span>
                    <span className="font-mono font-semibold text-slate-900">{formatINR(currentSlip.earnings?.specialAllowance || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Conveyance & Medical Allowance</span>
                    <span className="font-mono font-semibold text-slate-900">{formatINR(currentSlip.earnings?.conveyanceMedical || 0)}</span>
                  </div>
                  {currentSlip.earnings?.bonus > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Performance Bonus</span>
                      <span className="font-mono font-bold">+{formatINR(currentSlip.earnings.bonus)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-slate-900 text-sm">
                    <span>Total Gross Salary</span>
                    <span className="font-mono text-teal-800">{formatINR(currentSlip.gross)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions column */}
              <div>
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] mb-3 pb-1 border-b border-slate-200 flex justify-between">
                  <span>Statutory Withholdings</span>
                  <span>Amount (₹)</span>
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Provident Fund (EPF 12%)</span>
                    <span className="font-mono font-semibold text-rose-600">-{formatINR(currentSlip.deductionsBreakdown?.epf || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Professional Tax (PT)</span>
                    <span className="font-mono font-semibold text-rose-600">-{formatINR(currentSlip.deductionsBreakdown?.pt || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tax Deducted at Source (TDS)</span>
                    <span className="font-mono font-semibold text-rose-600">-{formatINR(currentSlip.deductionsBreakdown?.tds || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Group Mediclaim Insurance</span>
                    <span className="font-mono font-semibold text-rose-600">-{formatINR(currentSlip.deductionsBreakdown?.healthInsurance || 0)}</span>
                  </div>
                  {currentSlip.deductionsBreakdown?.lopDeduction > 0 && (
                    <div className="flex justify-between text-rose-700">
                      <span>Loss of Pay (LOP Deductions)</span>
                      <span className="font-mono font-bold">-{formatINR(currentSlip.deductionsBreakdown.lopDeduction)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-slate-900 text-sm">
                    <span>Total Deductions</span>
                    <span className="font-mono text-rose-600">-{formatINR(currentSlip.deductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Pay Highlight Banner */}
            <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-teal-800 uppercase tracking-widest block">
                    Net Take-Home Pay (In-Hand)
                  </span>
                  <p className="text-2xl sm:text-3xl font-black text-teal-950 font-mono tracking-tight mt-0.5">
                    {formatINR(currentSlip.net)} <span className="text-xs font-semibold text-teal-700 font-sans">INR</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Disbursed via NEFT
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-teal-200/50 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-teal-900 gap-1">
                <span className="font-medium italic">
                  Amount in words: <strong className="font-bold">{numberToINRWords(currentSlip.net)}</strong>
                </span>
                <span className="font-mono text-[10px] text-teal-800">
                  UTR: {currentSlip.utr || 'HDFCN26083100654'}
                </span>
              </div>
            </div>

            {/* System Generated Disclaimer */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center flex items-center justify-center gap-2">
              <FileCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>This is a computer-generated official pay statement by Dayflow HRMS and requires no signature.</span>
            </div>
          </Card>
        </div>

        {/* Right Column: 6-Month Salary Trend & Indian Statutory Insights */}
        <div className="space-y-6 print:hidden">
          {/* 6-Month Salary Trend Chart */}
          <Card className="p-6">
            <CardHeader
              title="6-Month Pay Trends (INR)"
              subtitle="Net monthly compensation consistency"
            />

            <div className="h-60 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `₹${Math.round(val / 1000)}k`} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(value) => [formatINR(value), 'Net Disbursed']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="net" fill="#0d9488" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Statutory Tax & EPF Accumulation Summary */}
          <Card className="p-6 space-y-4">
            <CardHeader
              title="Annual Statutory Summary"
              subtitle="EPF contributions & tax compliance"
            />

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 font-medium">EPF Accumulation (YTD)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatINR((currentSlip.deductionsBreakdown?.epf || 0) * 12 * 2)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Includes 12% employee + 12% matching employer contribution</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-600 font-medium">Standard Tax Regime</span>
                  <span className="font-semibold text-teal-700">New Tax Regime (Sec 115BAC)</span>
                </div>
                <p className="text-[10px] text-slate-400">Standard ₹75,000 deduction automatically applied</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Compensation governed by employment contract and Indian Labour Law standards.</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
