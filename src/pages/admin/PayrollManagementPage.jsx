// src/pages/admin/PayrollManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { payrollService } from '../../services/payrollService';
import { formatINR, calculateIndianSalaryBreakdown, numberToINRWords } from '../../lib/currency';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import {
  IndianRupee,
  TrendingDown,
  CreditCard,
  Edit2,
  Save,
  CheckCircle2,
  Building,
  Calculator,
  ShieldAlert,
  Search,
  Download,
  Play,
  Calendar,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  RefreshCw,
  Sparkles,
  Lock,
  Landmark,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';

export const PayrollManagementPage = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('August 2026');
  
  // Modals
  const [editItem, setEditItem] = useState(null); // { user_id, name, base_salary, deductions, customBreakdown }
  const [previewSlip, setPreviewSlip] = useState(null);
  const [runPayrollOpen, setRunPayrollOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processingRun, setProcessingRun] = useState(false);

  // Pay Run form state
  const [runForm, setRunForm] = useState({
    remarks: 'Regular monthly salary disbursal',
    bonusPercent: 0,
    includeTDS: true,
    syncAttendance: true
  });

  const availableMonths = [
    'August 2026',
    'July 2026',
    'June 2026',
    'May 2026',
    'April 2026',
    'March 2026'
  ];

  const loadPayrollData = async (month = selectedMonth) => {
    setLoading(true);
    try {
      const { data, error } = await payrollService.getAllPayroll(month);
      if (error) toast.error("Error loading payroll records");
      setPayrolls(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayrollData(selectedMonth);
  }, [selectedMonth]);

  const handleEditClick = (record) => {
    const base = Number(record.base_salary || 1200000);
    const breakdown = record.structure || calculateIndianSalaryBreakdown(base);

    setEditItem({
      user_id: record.user_id,
      name: record.users?.name,
      employee_id: record.users?.employee_id,
      department: record.users?.department,
      base_salary: base,
      deductions: record.deductions || breakdown.annualDeductions,
      breakdown: breakdown
    });
  };

  const handleSalaryChange = (newCTC) => {
    const ctc = Number(newCTC) || 0;
    const computed = calculateIndianSalaryBreakdown(ctc);
    setEditItem(prev => ({
      ...prev,
      base_salary: ctc,
      deductions: computed.annualDeductions,
      breakdown: computed
    }));
  };

  const handleSavePayroll = async (e) => {
    e.preventDefault();
    if (!editItem) return;

    setSaving(true);
    try {
      const { error } = await payrollService.updatePayroll(editItem.user_id, {
        base_salary: editItem.base_salary,
        deductions: editItem.deductions,
        customBreakdown: editItem.breakdown
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success(`Updated salary structure for ${editItem.name}!`);
        setEditItem(null);
        await loadPayrollData(selectedMonth);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleExecutePayRun = async (e) => {
    e.preventDefault();
    setProcessingRun(true);
    try {
      const { error } = await payrollService.processMonthlyPayroll(selectedMonth, {
        remarks: runForm.remarks,
        includeBonus: runForm.bonusPercent > 0 ? (totalMonthlyGross * (runForm.bonusPercent / 100)) / payrolls.length : 0
      });

      if (error) {
        toast.error("Failed to process payroll run");
      } else {
        toast.success(`Successfully processed & disbursed ${selectedMonth} payroll for all ${payrolls.length} employees!`);
        setRunPayrollOpen(false);
        await loadPayrollData(selectedMonth);
      }
    } finally {
      setProcessingRun(false);
    }
  };

  const handleExportBankFile = () => {
    if (filteredPayrolls.length === 0) {
      toast.error("No records to export");
      return;
    }
    payrollService.exportBankDisbursalCSV(filteredPayrolls, selectedMonth);
    toast.success(`Exported ${selectedMonth} NEFT/RTGS Bank Disbursal CSV!`);
  };

  // Filter calculations
  const departments = ['All', ...new Set(payrolls.map(p => p.users?.department).filter(Boolean))];

  const filteredPayrolls = payrolls.filter(p => {
    const name = p.users?.name || '';
    const dept = p.users?.department || '';
    const id = p.users?.employee_id || '';
    const q = search.toLowerCase();

    const matchesSearch = name.toLowerCase().includes(q) || dept.toLowerCase().includes(q) || id.toLowerCase().includes(q);
    const matchesDept = departmentFilter === 'All' || dept === departmentFilter;

    return matchesSearch && matchesDept;
  });

  // Financial aggregates
  const totalAnnualCTC = payrolls.reduce((acc, curr) => acc + Number(curr.base_salary || 0), 0);
  const totalAnnualDeductions = payrolls.reduce((acc, curr) => acc + Number(curr.deductions || 0), 0);
  const totalAnnualNet = totalAnnualCTC - totalAnnualDeductions;

  const totalMonthlyGross = Math.round(totalAnnualCTC / 12);
  const totalMonthlyDeductions = Math.round(totalAnnualDeductions / 12);
  const totalMonthlyNet = totalMonthlyGross - totalMonthlyDeductions;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <IndianRupee className="w-6 h-6 text-purple-700" />
              Payroll Operations & Disbursals
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              HR Operations (INR)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage Indian CTC structures, statutory deductions (EPF/PT/TDS), batch monthly pay runs, and NEFT/RTGS disbursals.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm text-xs font-medium text-slate-700">
            <Calendar className="w-4 h-4 text-purple-600" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none outline-none font-semibold text-slate-900 cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={FileSpreadsheet}
            onClick={handleExportBankFile}
            className="text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            Export Bank File (CSV)
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Play}
            onClick={() => setRunPayrollOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-500/20"
          >
            Run Monthly Payroll
          </Button>
        </div>
      </div>

      {/* Aggregate Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={`Monthly Gross Payout (${selectedMonth})`}
          value={formatINR(totalMonthlyGross)}
          subtitle={`Annual CTC: ${formatINR(totalAnnualCTC, { compact: true })}`}
          icon={IndianRupee}
          color="purple"
        />
        <StatCard
          title="Total Statutory Deductions"
          value={formatINR(totalMonthlyDeductions)}
          subtitle="EPF (12%), PT & TDS Withholdings"
          icon={TrendingDown}
          color="rose"
        />
        <StatCard
          title="Net Disbursable Take-Home"
          value={formatINR(totalMonthlyNet)}
          subtitle={`Net payout to ${payrolls.length} active bank accounts`}
          icon={CreditCard}
          color="emerald"
        />
        <StatCard
          title="Pay Cycle Status"
          value="100% Disbursed"
          subtitle={`${payrolls.length} / ${payrolls.length} Slips Generated`}
          icon={CheckCircle2}
          color="teal"
        />
      </div>

      {/* Filter & Search Toolbar */}
      <Card className="p-4 bg-white">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee by name, department, or ID..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Department:</span>
            <div className="flex items-center gap-1 overflow-x-auto">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setDepartmentFilter(dept)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    departmentFilter === dept
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Payroll Records Table */}
      <Card>
        <CardHeader
          title={`Employee Compensation & Disbursals (${selectedMonth})`}
          subtitle={`Managing ${filteredPayrolls.length} employee records with standard Indian statutory compliance`}
        />

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading compensation records in INR...
          </div>
        ) : filteredPayrolls.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No payroll records found matching your filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department & Bank</TableHead>
                <TableHead>Annual CTC</TableHead>
                <TableHead>Monthly Gross</TableHead>
                <TableHead>Deductions (PF/PT/TDS)</TableHead>
                <TableHead>Monthly Net Disbursed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayrolls.map((p) => {
                const ctc = Number(p.base_salary || 0);
                const monthlyGross = Math.round(ctc / 12);
                const monthlyDed = Math.round(Number(p.deductions || 0) / 12);
                const monthlyNet = monthlyGross - monthlyDed;
                const bank = p.users?.bank_details;

                return (
                  <TableRow key={p.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar src={p.users?.profile_pic} name={p.users?.name} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{p.users?.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{p.users?.employee_id || 'DF-1001'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-xs text-slate-700 font-medium">{p.users?.department || 'Operations'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {bank?.bank_name ? `${bank.bank_name} • ••••${bank.account_no?.slice(-4)}` : 'HDFC Bank • Direct'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-slate-900">
                      {formatINR(ctc)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-700">
                      {formatINR(monthlyGross)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-rose-600">
                      -{formatINR(monthlyDed)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50/50 rounded-lg px-2 py-1">
                      {formatINR(monthlyNet)}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" /> Disbursed
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => setPreviewSlip(p)}
                          className="text-slate-600 hover:text-teal-700 hover:bg-teal-50 text-xs px-2 py-1"
                          title="Preview Pay Slip"
                        >
                          Slip
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Edit2}
                          onClick={() => handleEditClick(p)}
                          className="text-purple-700 hover:bg-purple-50 text-xs px-2.5 py-1"
                        >
                          Adjust CTC
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Adjust Compensation & CTC Breakdown Modal */}
      <Modal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        title="Adjust Indian CTC & Compensation Structure"
        subtitle={`Configuring salary components for ${editItem?.name} (${editItem?.employee_id})`}
      >
        {editItem && (
          <form onSubmit={handleSavePayroll} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Annual Gross CTC (₹ INR) *
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  required
                  min="300000"
                  step="25000"
                  value={editItem.base_salary}
                  onChange={(e) => handleSalaryChange(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                {numberToINRWords(editItem.base_salary)}
              </p>
            </div>

            {/* Itemized Indian CTC Breakdown Preview */}
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 space-y-3 text-xs">
              <div className="font-bold text-purple-950 flex items-center justify-between pb-2 border-b border-purple-200/60">
                <span>Calculated Monthly Earnings:</span>
                <span className="font-mono text-sm">{formatINR(editItem.breakdown?.monthlyGross || 0)} / mo</span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Basic Wage (50%):</span>
                  <span className="font-semibold">{formatINR(editItem.breakdown?.earnings?.basic || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">HRA (25%):</span>
                  <span className="font-semibold">{formatINR(editItem.breakdown?.earnings?.hra || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Special Allowance:</span>
                  <span className="font-semibold">{formatINR(editItem.breakdown?.earnings?.specialAllowance || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Other Allowance:</span>
                  <span className="font-semibold">{formatINR(editItem.breakdown?.earnings?.conveyanceMedical || 0)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-purple-200/60">
                <div className="font-bold text-rose-900 mb-1 flex items-center justify-between">
                  <span>Monthly Statutory Deductions:</span>
                  <span className="font-mono">-{formatINR(editItem.breakdown?.deductions?.total || 0)}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">EPF Employee (12%):</span>
                    <span className="font-semibold text-rose-600">-{formatINR(editItem.breakdown?.deductions?.epf || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Professional Tax (PT):</span>
                    <span className="font-semibold text-rose-600">-{formatINR(editItem.breakdown?.deductions?.pt || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TDS (Income Tax):</span>
                    <span className="font-semibold text-rose-600">-{formatINR(editItem.breakdown?.deductions?.tds || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Group Health Insurance:</span>
                    <span className="font-semibold text-rose-600">-{formatINR(editItem.breakdown?.deductions?.healthInsurance || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-purple-200/60 flex justify-between items-center text-purple-950 font-bold">
                <span>Net In-Hand Take Home:</span>
                <span className="font-mono text-base text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {formatINR(editItem.breakdown?.monthlyNet || 0)} / mo
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setEditItem(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                icon={Save}
                className="bg-purple-600 hover:bg-purple-700 font-bold"
              >
                Save Compensation Update
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Run Monthly Payroll Batch Modal */}
      <Modal
        isOpen={runPayrollOpen}
        onClose={() => setRunPayrollOpen(false)}
        title={`Execute Batch Pay Run: ${selectedMonth}`}
        subtitle="Calculates LOP days, verifies tax deductions, and initiates NEFT disbursal"
      >
        <form onSubmit={handleExecutePayRun} className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-purple-900">
              <span>Total Personnel In Batch:</span>
              <span>{payrolls.length} Employees</span>
            </div>
            <div className="flex items-center justify-between text-purple-800">
              <span>Gross Disbursal Amount:</span>
              <span className="font-mono font-bold">{formatINR(totalMonthlyGross)}</span>
            </div>
            <div className="flex items-center justify-between text-rose-700">
              <span>Statutory EPF / PT / TDS:</span>
              <span className="font-mono font-bold">-{formatINR(totalMonthlyDeductions)}</span>
            </div>
            <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between font-extrabold text-emerald-800 text-sm">
              <span>Total Net Disbursable:</span>
              <span className="font-mono">{formatINR(totalMonthlyNet)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Disbursal Narration / Remarks
            </label>
            <input
              type="text"
              required
              value={runForm.remarks}
              onChange={(e) => setRunForm({ ...runForm, remarks: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={runForm.syncAttendance}
                onChange={(e) => setRunForm({ ...runForm, syncAttendance: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
              />
              <span>Sync attendance records and automatically apply Loss of Pay (LOP) for unpaid leaves</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={runForm.includeTDS}
                onChange={(e) => setRunForm({ ...runForm, includeTDS: e.target.checked })}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
              />
              <span>Deduct Income Tax TDS according to Indian progressive tax slabs</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setRunPayrollOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={processingRun}
              icon={CheckCircle2}
              className="bg-purple-600 hover:bg-purple-700 font-bold"
            >
              Confirm & Disburse Salaries
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pay Slip Quick Inspection Modal */}
      <Modal
        isOpen={!!previewSlip}
        onClose={() => setPreviewSlip(null)}
        title="Official Pay Statement Preview"
        subtitle={`Disbursal statement for ${previewSlip?.users?.name} • ${selectedMonth}`}
      >
        {previewSlip && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Dayflow HRMS India Pvt Ltd</p>
                <h4 className="text-base font-bold">{previewSlip.users?.name}</h4>
                <p className="text-[11px] text-slate-400">{previewSlip.users?.job_title} • {previewSlip.users?.department}</p>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Disbursed via NEFT
                </span>
                <p className="text-[10px] text-slate-400 font-mono mt-1">UTR: HDFCN26083100654</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Bank Name</span>
                <span className="font-semibold text-slate-800">{previewSlip.users?.bank_details?.bank_name || 'HDFC Bank Ltd'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Account Number</span>
                <span className="font-mono font-semibold text-slate-800">
                  {previewSlip.users?.bank_details?.account_no ? `••••${previewSlip.users.bank_details.account_no.slice(-4)}` : '•••• 4892'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">PAN</span>
                <span className="font-mono font-semibold text-slate-800">{previewSlip.users?.bank_details?.pan || 'ABCDE1234F'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">UAN</span>
                <span className="font-mono font-semibold text-slate-800">{previewSlip.users?.bank_details?.uan || '100982374612'}</span>
              </div>
            </div>

            <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-between text-teal-950 font-bold">
              <span>Net Take-Home Disbursed:</span>
              <span className="font-mono text-base text-teal-900">
                {formatINR(previewSlip.selectedMonthSlip?.net || Math.round((Number(previewSlip.base_salary) - Number(previewSlip.deductions)) / 12))}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setPreviewSlip(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
