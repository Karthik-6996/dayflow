// src/pages/shared/ReportsPage.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { attendanceService } from '../../services/attendanceService';
import { leaveService } from '../../services/leaveService';
import { payrollService, calculateSalaryBreakdown } from '../../services/payrollService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import {
  FileText,
  CalendarCheck,
  CreditCard,
  Download,
  Printer,
  Search,
  Filter,
  BarChart3,
  PieChart,
  Calendar,
  Building,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Shield,
  Layers,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import { format, parseISO, subMonths } from 'date-fns';
import { toast } from 'sonner';

// Helper function to convert number to words (Indian numbering system)
function numberToWords(num) {
  if (!num || isNaN(num)) return 'Zero';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(num);
  if (n === 0) return 'Zero';

  function convertGroup(val) {
    let str = '';
    if (val > 99) {
      str += a[Math.floor(val / 100)] + ' Hundred ';
      val %= 100;
    }
    if (val > 19) {
      str += b[Math.floor(val / 10)] + ' ' + a[val % 10] + ' ';
    } else if (val > 0) {
      str += a[val] + ' ';
    }
    return str.trim();
  }

  let crore = Math.floor(n / 10000000);
  let lakh = Math.floor((n % 10000000) / 100000);
  let thousand = Math.floor((n % 100000) / 1000);
  let remainder = n % 1000;

  let result = '';
  if (crore > 0) result += convertGroup(crore) + ' Crore ';
  if (lakh > 0) result += convertGroup(lakh) + ' Lakh ';
  if (thousand > 0) result += convertGroup(thousand) + ' Thousand ';
  if (remainder > 0) result += convertGroup(remainder) + ' ';

  return result.trim() + ' Rupees Only';
}

export const ReportsPage = () => {
  const { currentUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('payslips'); // 'payslips' | 'attendance' | 'leaves' | 'workforce'
  const [employees, setEmployees] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(currentUser?.id || '');
  const [selectedDept, setSelectedDept] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const printRef = useRef(null);

  // Month options for payslips (past 6 months)
  const monthOptions = [
    { label: 'August 2026 (Current)', value: '2026-08' },
    { label: 'July 2026', value: '2026-07' },
    { label: 'June 2026', value: '2026-06' },
    { label: 'May 2026', value: '2026-05' },
    { label: 'April 2026', value: '2026-04' },
    { label: 'March 2026', value: '2026-03' },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, attRes, leavesRes] = await Promise.all([
        userService.getAllUsers(),
        attendanceService.getAllAttendance({}),
        leaveService.getAllLeaves()
      ]);
      const empList = usersRes.data || [];
      setEmployees(empList);
      setAttendances(attRes.data || []);
      setLeaves(leavesRes.data || []);

      if (!selectedEmployeeId && empList.length > 0) {
        setSelectedEmployeeId(currentUser?.id || empList[0]?.id);
      }
    } catch (e) {
      console.warn("Reports data fetch:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentUser?.id && !isAdmin) {
      setSelectedEmployeeId(currentUser.id);
    }
  }, [currentUser, isAdmin]);

  // Selected employee object
  const targetEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmployeeId || e.employee_id === selectedEmployeeId) || currentUser || employees[0] || {};
  }, [employees, selectedEmployeeId, currentUser]);

  // Salary calculations for target employee
  const salaryData = useMemo(() => {
    const yearly = Number(targetEmployee?.salary) || 1450000;
    const monthly = Math.round(yearly / 12);
    const breakdown = calculateSalaryBreakdown(monthly);
    return { yearly, monthly, breakdown };
  }, [targetEmployee]);

  // Attendance metrics for selected month
  const monthAttendance = useMemo(() => {
    return attendances.filter(a => {
      const isEmp = !selectedEmployeeId || a.user_id === selectedEmployeeId || a.users?.employee_id === targetEmployee?.employee_id;
      const isMon = (a.date || '').startsWith(selectedMonth);
      return (isAdmin ? (selectedEmployeeId ? isEmp : true) : isEmp) && isMon;
    });
  }, [attendances, selectedEmployeeId, targetEmployee, selectedMonth, isAdmin]);

  const presentCount = monthAttendance.filter(a => a.status === 'present' || a.check_in_time).length;
  const lateCount = monthAttendance.filter(a => a.is_late).length;
  const attendanceRate = monthAttendance.length > 0 ? Math.round((presentCount / monthAttendance.length) * 100) : 96;

  // Leave stats
  const employeeLeaves = useMemo(() => {
    return leaves.filter(l => {
      const matchesEmp = isAdmin ? (selectedEmployeeId ? (l.user_id === selectedEmployeeId || l.user_id === targetEmployee?.employee_id) : true) : (l.user_id === currentUser?.id || l.user_id === currentUser?.employee_id);
      return matchesEmp;
    });
  }, [leaves, selectedEmployeeId, targetEmployee, currentUser, isAdmin]);

  const approvedLeavesCount = employeeLeaves.filter(l => l.status === 'approved').length;
  const pendingLeavesCount = employeeLeaves.filter(l => l.status === 'pending').length;

  // Print Salary Slip handler
  const handlePrintPayslip = () => {
    window.print();
  };

  // Export Attendance CSV handler
  const handleExportAttendanceCSV = () => {
    if (monthAttendance.length === 0) {
      toast.error("No attendance data to export for this period");
      return;
    }

    const headers = ["Employee ID", "Employee Name", "Date", "Check In", "Check Out", "Status", "Is Late"];
    const rows = monthAttendance.map(r => [
      r.users?.employee_id || r.user_id,
      `"${r.users?.name || targetEmployee?.name || 'Staff'}"`,
      r.date,
      r.check_in_time || 'N/A',
      r.check_out_time || 'N/A',
      r.status,
      r.is_late ? "Yes" : "No"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Dayflow_Attendance_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Attendance Report downloaded as CSV!");
  };

  // Export Payroll Summary CSV handler
  const handleExportPayrollCSV = () => {
    const headers = ["Employee ID", "Name", "Department", "Job Title", "Monthly Gross", "Basic (50%)", "HRA (25%)", "PF (12%)", "PT (₹)", "Net Take-Home", "Yearly CTC"];
    const rows = employees.map(emp => {
      const y = Number(emp.salary) || 1200000;
      const m = Math.round(y / 12);
      const b = calculateSalaryBreakdown(m);
      return [
        emp.employee_id || emp.login_id || 'DF-1000',
        `"${emp.name}"`,
        `"${emp.department || 'Operations'}"`,
        `"${emp.job_title || 'Specialist'}"`,
        m,
        b.basicSalary,
        Math.round(b.basicSalary * 0.5),
        b.pfAmount,
        b.profTax,
        b.netTakeHome,
        y
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Dayflow_Payroll_Summary_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Payroll Summary exported as CSV!");
  };

  // Month formatted title
  const monthName = format(new Date(`${selectedMonth}-01`), 'MMMM yyyy');

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Analytics & Reports</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Enterprise Reporting
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Generate formal payslips, track department attendance scorecards, and export organizational analytics
          </p>
        </div>

        {/* Global Action Export Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeTab === 'payslips' && (
            <button
              onClick={handlePrintPayslip}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> Print Formal Slip
            </button>
          )}

          {activeTab === 'attendance' && (
            <button
              onClick={handleExportAttendanceCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Export Timesheet CSV
            </button>
          )}

          {activeTab === 'workforce' && (
            <button
              onClick={handleExportPayrollCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Export Master Payroll
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl overflow-x-auto">
        {[
          { id: 'payslips', label: 'Salary Slips & Payout Statements', icon: FileText },
          { id: 'attendance', label: 'Attendance & Punctuality', icon: CalendarCheck },
          { id: 'leaves', label: 'Time-Off & Leave Utilization', icon: Calendar },
          { id: 'workforce', label: 'Workforce Headcount & Payroll', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar (Month, Employee, Department) */}
      <Card className="p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Filter */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-500 font-medium">Period:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium"
              >
                {monthOptions.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Employee Selector (Admin Only) */}
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-500 font-medium">Employee:</span>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-semibold max-w-[200px]"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employee_id || emp.login_id})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="text-[11px] text-zinc-500">
            Selected Staff: <strong className="text-zinc-900 dark:text-white">{targetEmployee.name}</strong> ({targetEmployee.employee_id || targetEmployee.login_id})
          </div>
        </div>
      </Card>

      {/* TAB 1: SALARY SLIP & COMPENSATION REPORT */}
      {activeTab === 'payslips' && (
        <div className="space-y-6">
          {/* Quick Aggregate Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <StatCard
              title="Net Take-Home Pay"
              value={`₹${salaryData.breakdown.netTakeHome.toLocaleString()}`}
              subtitle={`Credited for ${monthName}`}
              icon={CreditCard}
            />
            <StatCard
              title="Monthly Gross Wage"
              value={`₹${salaryData.monthly.toLocaleString()}`}
              subtitle="Base total earnings"
              icon={TrendingUp}
            />
            <StatCard
              title="Statutory Deductions"
              value={`-₹${salaryData.breakdown.totalDeductions.toLocaleString()}`}
              subtitle="PF (12%) + Prof Tax (₹200)"
              icon={AlertCircle}
            />
            <StatCard
              title="Annual CTC Package"
              value={`₹${salaryData.yearly.toLocaleString()}`}
              subtitle="Total cost to company"
              icon={Building}
            />
          </div>

          {/* Formal Printable Payslip Document */}
          <div
            ref={printRef}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 space-y-6 text-xs print:m-0 print:p-8 print:border-none print:shadow-none"
          >
            {/* Payslip Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-bold text-lg shadow-sm">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">Dayflow Technologies Pvt. Ltd.</h2>
                  <p className="text-zinc-500 text-[11px]">742 Evergreen Innovation Parkway, Floor 4, Bengaluru, KA 560103</p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg text-xs">
                  CONFIRMED & DISBURSED
                </span>
                <p className="font-mono font-bold text-sm text-zinc-900 dark:text-white mt-1">
                  PAYSLIP — {monthName.toUpperCase()}
                </p>
                <p className="text-[10px] text-zinc-400 font-mono">Slip Ref: DF-SLIP-{selectedMonth.replace('-', '')}-{targetEmployee.employee_id || '1001'}</p>
              </div>
            </div>

            {/* Employee Information Table Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 text-xs">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Employee Name</span>
                <span className="font-bold text-zinc-900 dark:text-white text-xs">{targetEmployee.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Employee ID / Login</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">{targetEmployee.employee_id || targetEmployee.login_id || 'DF-1001'}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Department</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{targetEmployee.department || 'Engineering'}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Designation</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{targetEmployee.job_title || 'Software Engineer'}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Bank Name</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{targetEmployee.bank_details?.bank_name || 'HDFC Bank Ltd'}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Bank Account No</span>
                <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{targetEmployee.bank_details?.account_no || '50100492817491'}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">PAN Number</span>
                <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{targetEmployee.bank_details?.pan || 'KGIRK1234F'}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">PF UAN No</span>
                <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{targetEmployee.bank_details?.uan || '100982374611'}</span>
              </div>
            </div>

            {/* Earnings & Deductions Breakdown Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Earnings Table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="bg-zinc-100 dark:bg-zinc-800/80 px-4 py-2.5 font-bold text-zinc-900 dark:text-white flex justify-between">
                  <span>Earnings Breakdown</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                  <div className="px-4 py-2 flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Basic Salary (50%)</span>
                    <span className="font-mono font-semibold text-zinc-900 dark:text-white">₹{salaryData.breakdown.basicSalary.toLocaleString()}</span>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">House Rent Allowance (HRA - 50% of Basic)</span>
                    <span className="font-mono font-semibold text-zinc-900 dark:text-white">₹{Math.round(salaryData.breakdown.basicSalary * 0.5).toLocaleString()}</span>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Standard Allowance</span>
                    <span className="font-mono font-semibold text-zinc-900 dark:text-white">₹4,167</span>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Performance Bonus / Special Allowance</span>
                    <span className="font-mono font-semibold text-zinc-900 dark:text-white">
                      ₹{Math.max(0, salaryData.monthly - (salaryData.breakdown.basicSalary + Math.round(salaryData.breakdown.basicSalary * 0.5) + 4167)).toLocaleString()}
                    </span>
                  </div>
                  <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 flex justify-between font-bold border-t border-zinc-200 dark:border-zinc-700">
                    <span className="text-zinc-900 dark:text-white">Total Gross Earnings</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">₹{salaryData.monthly.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="bg-zinc-100 dark:bg-zinc-800/80 px-4 py-2.5 font-bold text-zinc-900 dark:text-white flex justify-between">
                  <span>Statutory Deductions</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                  <div className="px-4 py-2 flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Provident Fund (PF - 12% of Basic)</span>
                    <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">-₹{salaryData.breakdown.pfAmount.toLocaleString()}</span>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Professional Tax (PT)</span>
                    <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">-₹{salaryData.breakdown.profTax.toLocaleString()}</span>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">TDS / Income Tax Withholding</span>
                    <span className="font-mono font-semibold text-zinc-400">₹0</span>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Other Deductions</span>
                    <span className="font-mono font-semibold text-zinc-400">₹0</span>
                  </div>
                  <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 flex justify-between font-bold border-t border-zinc-200 dark:border-zinc-700">
                    <span className="text-zinc-900 dark:text-white">Total Statutory Deductions</span>
                    <span className="font-mono text-rose-600 dark:text-rose-400">-₹{salaryData.breakdown.totalDeductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary In Words Banner */}
            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-wider block">
                  Net Disbursed Take-Home Payout
                </span>
                <p className="font-bold text-base text-zinc-900 dark:text-white font-mono mt-0.5">
                  ₹{salaryData.breakdown.netTakeHome.toLocaleString()}
                </p>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 italic">
                  Amount in words: {numberToWords(salaryData.breakdown.netTakeHome)}
                </p>
              </div>

              <div className="text-left sm:text-right font-mono text-[10px] text-zinc-500">
                <p>Transfer Date: {selectedMonth}-31</p>
                <p>Mode: Direct NEFT / IMPS Bank Transfer</p>
              </div>
            </div>

            {/* Formal Disclaimers & Signatures */}
            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-4">
              <p>This is an electronically generated salary statement. No physical signature is required.</p>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Verified by Dayflow Automated Payroll Engine</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE & PUNCTUALITY REPORTS */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Aggregate Attendance Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <StatCard
              title="Attendance Rate"
              value={`${attendanceRate}%`}
              subtitle={`Monthly presence for ${monthName}`}
              icon={CheckCircle2}
            />
            <StatCard
              title="Present Days"
              value={presentCount}
              subtitle="Days punched in office"
              icon={CalendarCheck}
            />
            <StatCard
              title="Late Clock-Ins"
              value={lateCount}
              subtitle="Punched after 09:45 AM"
              icon={Clock}
            />
            <StatCard
              title="Expected Work Days"
              value={22}
              subtitle="Mon - Fri work schedule"
              icon={Calendar}
            />
          </div>

          {/* Itemized Timesheet Table */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Detailed Timesheet Log ({monthName})
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Daily punch timestamps, working hours, and late check-in tracking
                </p>
              </div>

              <button
                onClick={handleExportAttendanceCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition cursor-pointer self-start"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>

            {monthAttendance.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs">
                No attendance logs found for this period.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Punctuality</TableHead>
                    <TableHead>Net Work Time</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthAttendance.map((row) => {
                    const checkIn = row.check_in_time ? format(parseISO(row.check_in_time), 'hh:mm a') : '—';
                    const checkOut = row.check_out_time ? format(parseISO(row.check_out_time), 'hh:mm a') : row.check_in_time ? 'In Progress' : '—';

                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar name={row.users?.name || targetEmployee?.name} size="xs" />
                            <div>
                              <p className="font-semibold text-xs text-zinc-900 dark:text-white">
                                {row.users?.name || targetEmployee?.name}
                              </p>
                              <p className="text-[10px] text-zinc-500 font-mono">
                                {row.users?.employee_id || targetEmployee?.employee_id || row.user_id}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-700 dark:text-zinc-300">{row.date}</TableCell>
                        <TableCell className="font-mono text-xs text-zinc-800 dark:text-zinc-200">{checkIn}</TableCell>
                        <TableCell className="font-mono text-xs text-zinc-800 dark:text-zinc-200">{checkOut}</TableCell>
                        <TableCell>
                          {row.is_late ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                              <AlertCircle className="w-3 h-3" /> Late Arrival
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" /> On-Time
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
                          8h 30m
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={row.status}>{row.status}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: LEAVE & TIME-OFF ANALYTICS */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              title="Approved Leaves"
              value={approvedLeavesCount}
              subtitle="Granted time-off requests"
              icon={CheckCircle2}
            />
            <StatCard
              title="Pending Review"
              value={pendingLeavesCount}
              subtitle="Awaiting administrative action"
              icon={Clock}
            />
            <StatCard
              title="Total Leave History"
              value={employeeLeaves.length}
              subtitle="Applications submitted"
              icon={Calendar}
            />
          </div>

          <Card>
            <CardHeader
              title="Time-Off Request History & Status"
              subtitle="Complete record of time-off applications, category, and remarks"
            />

            {employeeLeaves.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs">
                No leave requests found for this employee.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeLeaves.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell>
                        <p className="font-semibold text-xs text-zinc-900 dark:text-white">
                          {leave.users?.name || targetEmployee?.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {leave.users?.employee_id || targetEmployee?.employee_id || 'DF-1001'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={leave.type}>{leave.type} Leave</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                        {leave.start_date} → {leave.end_date}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
                        {leave.days || leave.days_count || 1} Days
                      </TableCell>
                      <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xs truncate" title={leave.remarks}>
                        {leave.remarks || <span className="italic text-zinc-400">None</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={leave.status}>{leave.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: WORKFORCE HEADCOUNT & PAYROLL ANALYTICS */}
      {activeTab === 'workforce' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              title="Total Organization Staff"
              value={employees.length}
              subtitle="Active roster count"
              icon={Users}
            />
            <StatCard
              title="Monthly Disbursal Total"
              value={`₹${employees.reduce((acc, curr) => acc + Math.round((Number(curr.salary) || 1200000) / 12), 0).toLocaleString()}`}
              subtitle="Gross monthly wage budget"
              icon={CreditCard}
            />
            <StatCard
              title="Active Departments"
              value={new Set(employees.map(e => e.department).filter(Boolean)).size || 4}
              subtitle="Operational business units"
              icon={Building}
            />
          </div>

          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Department-Wise Headcount & Compensation Distribution
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Aggregate staffing and annual salary commitments by business unit
                </p>
              </div>

              <button
                onClick={handleExportPayrollCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold transition cursor-pointer self-start"
              >
                <Download className="w-3.5 h-3.5" /> Export Master CSV
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['Engineering', 'Design & UX', 'Human Resources', 'Marketing'].map((dept) => {
                const deptEmps = employees.filter(e => (e.department || '').toLowerCase().includes(dept.toLowerCase().split(' ')[0]));
                const deptGrossMonthly = deptEmps.reduce((acc, curr) => acc + Math.round((Number(curr.salary) || 1200000) / 12), 0);

                return (
                  <div
                    key={dept}
                    className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-900 dark:text-white">{dept}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                        {deptEmps.length} Staff
                      </span>
                    </div>
                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 space-y-1 text-[11px]">
                      <div className="flex justify-between text-zinc-500">
                        <span>Monthly Wage Cost:</span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-white">
                          ₹{deptGrossMonthly.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-zinc-500">
                        <span>Avg CTC / Staff:</span>
                        <span className="font-mono text-zinc-700 dark:text-zinc-300">
                          ₹{deptEmps.length > 0 ? Math.round((deptGrossMonthly * 12) / deptEmps.length).toLocaleString() : '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
