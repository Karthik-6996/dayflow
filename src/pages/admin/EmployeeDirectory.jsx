// src/pages/admin/EmployeeDirectory.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService, generateEmployeeLoginId, generateInitialPassword } from '../../services/userService';
import { attendanceService } from '../../services/attendanceService';
import { leaveService } from '../../services/leaveService';
import { payrollService, calculateSalaryBreakdown } from '../../services/payrollService';
import { IS_MOCK } from '../../services/supabaseClient';
import { mockUsers } from '../../mocks/users';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { StatCard } from '../../components/ui/StatCard';
import {
  Users,
  Search,
  Building,
  Mail,
  Phone,
  Eye,
  Shield,
  Filter,
  UserPlus,
  Lock,
  Copy,
  CheckCircle2,
  Calendar,
  DollarSign,
  Briefcase,
  Clock,
  MapPin,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays,
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export const EmployeeDirectory = () => {
  const { currentUser, isAdmin } = useAuth();
  const [employees, setEmployees] = useState(IS_MOCK ? (mockUsers || []) : []);
  const [attendances, setAttendances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(!IS_MOCK);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all, present, leave, absent
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  // New Employee Form State
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: 'employee',
    job_title: 'Software Engineer',
    department: 'Engineering',
    joining_year: 2026,
    salary: 1450000,
    phone: '',
    address: ''
  });

  const loadAllData = async () => {
    try {
      const [usersRes, attRes, leavesRes] = await Promise.all([
        userService.getAllUsers(),
        attendanceService.getAllAttendance({}),
        leaveService.getAllLeaves()
      ]);
      setEmployees(usersRes.data || []);
      setAttendances(attRes.data || []);
      setLeaves(leavesRes.data || []);
    } catch (e) {
      console.warn("Directory data fetch:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Compute live dynamic status: Present, On Approved Leave, or Absent
  const getEmployeeDynamicStatus = (emp) => {
    const today = new Date().toISOString().split('T')[0];
    const empId = emp?.id;
    const empCode = emp?.employee_id || emp?.login_id;
    const empEmail = emp?.email;

    // 1. Check attendance check-in for today
    const att = attendances.find(a => 
      (a.user_id === empId || a.users?.employee_id === empCode || a.users?.email === empEmail) && 
      (a.date === today || a.date === '2026-08-22')
    );
    if (att && att.check_in_time) {
      return {
        status: 'present',
        label: 'Present in Office',
        color: 'bg-emerald-500',
        badgeVariant: 'success',
        checkInTime: att.check_in_time,
        checkOutTime: att.check_out_time || null
      };
    }

    // 2. Check approved leave covering today
    const onLeave = leaves.find(l => 
      (l.user_id === empId || l.users?.employee_id === empCode || l.users?.email === empEmail) && 
      l.status === 'approved' && 
      l.start_date <= today && l.end_date >= today
    );
    if (onLeave) {
      return {
        status: 'leave',
        label: `On Leave (${onLeave.type})`,
        color: 'bg-blue-500',
        badgeVariant: 'info',
        leaveDetails: onLeave
      };
    }

    // 3. Otherwise absent
    return {
      status: 'absent',
      label: 'Absent / Off Duty',
      color: 'bg-amber-500',
      badgeVariant: 'warning'
    };
  };

  // Compute Employee-specific metrics (Salary, Attendance rate, Leave Balances)
  const getEmployeeStats = (emp) => {
    // 1. Salary breakdown
    const yearlySalary = Number(emp.salary) || 1200000;
    const monthlyWage = Math.round(yearlySalary / 12);
    const salaryBreakdown = calculateSalaryBreakdown(monthlyWage);

    // 2. Attendance history
    const empAtt = attendances.filter(a => a.user_id === emp.id || a.users?.employee_id === emp.employee_id);
    const presentDays = empAtt.filter(a => a.status === 'present' || a.check_in_time).length;
    const attendanceRate = empAtt.length > 0 ? Math.round((presentDays / empAtt.length) * 100) : 95;

    // 3. Leave summary
    const empLeaves = leaves.filter(l => l.user_id === emp.id || l.user_id === emp.employee_id);
    const approvedLeaves = empLeaves.filter(l => l.status === 'approved');
    const pendingLeaves = empLeaves.filter(l => l.status === 'pending');

    const paidUsed = approvedLeaves.filter(l => l.type === 'paid').reduce((acc, l) => acc + (Number(l.days || l.days_count) || 1), 0);
    const sickUsed = approvedLeaves.filter(l => l.type === 'sick').reduce((acc, l) => acc + (Number(l.days || l.days_count) || 1), 0);
    const unpaidUsed = approvedLeaves.filter(l => l.type === 'unpaid').reduce((acc, l) => acc + (Number(l.days || l.days_count) || 1), 0);

    const paidAvailable = Math.max(0, 24 - paidUsed);
    const sickAvailable = Math.max(0, 7 - sickUsed);

    return {
      salaryBreakdown,
      monthlyWage,
      yearlySalary,
      presentDays,
      attendanceRate,
      leavesSummary: {
        paidAvailable,
        paidUsed,
        sickAvailable,
        sickUsed,
        unpaidUsed,
        pendingCount: pendingLeaves.length
      }
    };
  };

  // Real-time preview of auto-generated Login ID
  const previewLoginId = generateEmployeeLoginId(newEmployee.name || 'John Doe', newEmployee.joining_year, employees.length + 1);
  const previewPassword = generateInitialPassword(newEmployee.name || 'John Doe');

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("Unauthorized: Only Administrators and HR Officers can create employee accounts.");
      return;
    }
    setCreating(true);
    try {
      const { data, initialPassword, loginId, error } = await userService.createEmployee({
        ...newEmployee,
        login_id: previewLoginId,
        password: previewPassword
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success(`Employee ${newEmployee.name} provisioned!`);
        setCreatedCredentials({ name: newEmployee.name, loginId, initialPassword });
        setIsAddModalOpen(false);
        setNewEmployee({
          name: '',
          email: '',
          role: 'employee',
          job_title: 'Software Engineer',
          department: 'Engineering',
          joining_year: 2026,
          salary: 1450000,
          phone: '',
          address: ''
        });
        await loadAllData();
      }
    } finally {
      setCreating(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    const statusInfo = getEmployeeDynamicStatus(emp);
    const matchesStatus = statusFilter === 'all' || statusInfo.status === statusFilter;

    const q = search.toLowerCase();
    const matchesSearch =
      (emp.name || '').toLowerCase().includes(q) ||
      (emp.email || '').toLowerCase().includes(q) ||
      (emp.employee_id || emp.login_id || '').toLowerCase().includes(q) ||
      (emp.job_title || '').toLowerCase().includes(q) ||
      (emp.department || '').toLowerCase().includes(q);

    return matchesDept && matchesStatus && matchesSearch;
  });

  const departments = ['all', ...new Set(employees.map(e => e.department).filter(Boolean))];

  return (
    <div className="space-y-5 animate-fade-in text-zinc-900 dark:text-zinc-100 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Employee Directory</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              {isAdmin ? 'Admin Management' : 'Directory View'} • {employees.length} Staff
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isAdmin 
              ? 'Multi-detail cards showing compensation, live attendance rate, time-off balances, and job designation' 
              : 'View organization colleagues, job titles, and contact information'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold transition cursor-pointer self-start sm:self-auto shadow-xs"
          >
            <UserPlus className="w-4 h-4" /> Provision New Employee
          </button>
        )}
      </div>

      {/* Generated Credentials Success Alert Dialog */}
      {createdCredentials && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <h4 className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Account Created for {createdCredentials.name}
            </h4>
            <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
              Auto Login ID: <span className="font-mono font-bold bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded">{createdCredentials.loginId}</span> | Temporary Password: <span className="font-mono font-bold bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded">{createdCredentials.initialPassword}</span>
            </p>
          </div>
          <button
            onClick={() => setCreatedCredentials(null)}
            className="px-3 py-1 bg-emerald-700 text-white rounded-md font-semibold text-xs self-start cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <Card className="p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, Login ID (DF-1001...), title, dept..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg overflow-x-auto">
            <span className="text-[11px] text-zinc-400 font-semibold px-2">Status:</span>
            {[
              { id: 'all', label: 'All Staff' },
              { id: 'present', label: '🟢 Present Today' },
              { id: 'leave', label: '🔵 On Leave' },
              { id: 'absent', label: '🟡 Absent / Off' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
          <span className="text-[11px] text-zinc-400 font-semibold shrink-0">Department:</span>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`px-2.5 py-0.5 text-xs font-medium rounded-md capitalize whitespace-nowrap transition cursor-pointer ${
                deptFilter === dept
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800/60'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </Card>

      {/* List-Styled Card View of Employees */}
      {loading ? (
        <div className="py-20 text-center text-zinc-400 text-xs">
          <div className="w-8 h-8 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading detailed employee records...
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card className="p-12 text-center text-zinc-400 text-xs">
          No employees found matching your search and filter criteria.
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEmployees.map((emp) => {
            const statusInfo = getEmployeeDynamicStatus(emp);
            const stats = getEmployeeStats(emp);
            const loginId = emp.login_id || emp.employee_id || generateEmployeeLoginId(emp.name, 2026, 1);

            return (
              <div
                key={emp.id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs hover:shadow-md transition-all p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs group"
              >
                {/* 1. Identity & Designation Column */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-[260px] lg:w-1/4">
                  <div className="relative shrink-0">
                    <Avatar src={emp.profile_pic} name={emp.name} size="lg" role={emp.role} />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${statusInfo.color}`}
                      title={statusInfo.label}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        {emp.name}
                      </h3>
                      <Badge variant={emp.role}>{emp.role}</Badge>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5 text-zinc-600 dark:text-zinc-400">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{emp.job_title || 'Specialist'}</span>
                      <span>•</span>
                      <span className="text-zinc-500">{emp.department || 'Operations'}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px] text-zinc-500">
                      <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-bold">
                        {loginId}
                      </span>
                      <span>Joined {emp.joining_year || 2026}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Contact & Location Information */}
                <div className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-400 min-w-[180px] lg:w-1/5 border-t lg:border-t-0 lg:border-l border-zinc-100 dark:border-zinc-800/80 lg:pl-4 pt-2 lg:pt-0">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate max-w-[180px]">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{emp.phone || '+91 98765 43210'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate max-w-[180px]">{emp.address || 'Bengaluru, India'}</span>
                  </div>
                </div>

                {/* 3. Salary & Wage Summary */}
                <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 min-w-[180px] lg:w-1/5 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 font-medium">Monthly Gross:</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white">
                      ₹{stats.monthlyWage.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">Net Take-Home:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{stats.salaryBreakdown.netTakeHome.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-200/50 dark:border-zinc-700/50">
                    <span>Yearly CTC:</span>
                    <span className="font-mono">₹{stats.yearlySalary.toLocaleString()}</span>
                  </div>
                </div>

                {/* 4. Attendance & Leave Balances */}
                <div className="grid grid-cols-2 gap-2 min-w-[200px] lg:w-1/5">
                  {/* Attendance block */}
                  <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span>Attendance:</span>
                      <span className="font-bold text-emerald-600">{stats.attendanceRate}%</span>
                    </div>
                    <p className="font-bold text-zinc-900 dark:text-white text-xs mt-0.5">
                      {statusInfo.status === 'present' ? '🟢 Present' : statusInfo.status === 'leave' ? '🔵 On Leave' : '🟡 Absent'}
                    </p>
                  </div>

                  {/* Leave balance block */}
                  <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span>PTO / Sick:</span>
                      <span className="font-mono font-bold text-indigo-600">{stats.leavesSummary.paidAvailable}d / {stats.leavesSummary.sickAvailable}d</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {stats.leavesSummary.pendingCount > 0 ? `${stats.leavesSummary.pendingCount} pending review` : 'No pending leaves'}
                    </p>
                  </div>
                </div>

                {/* 5. View Full Profile Action Button */}
                <div className="flex items-center justify-end lg:w-auto shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(emp)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-semibold transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Full Details <ChevronRight className="w-3 h-3 text-zinc-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comprehensive Employee Profile Inspection Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.name}
        subtitle={`Employee ID: ${selectedUser?.employee_id || selectedUser?.login_id} • Complete Staff Profile`}
      >
        {selectedUser && (() => {
          const stats = getEmployeeStats(selectedUser);
          const statusInfo = getEmployeeDynamicStatus(selectedUser);
          const b = stats.salaryBreakdown;

          return (
            <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
              {/* Header Info */}
              <div className="flex items-center gap-3.5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <Avatar src={selectedUser.profile_pic} name={selectedUser.name} size="lg" role={selectedUser.role} />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">{selectedUser.name}</h3>
                    <Badge variant={selectedUser.role}>{selectedUser.role}</Badge>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold text-white ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">{selectedUser.job_title} • {selectedUser.department}</p>
                </div>
              </div>

              {/* Grid of Details: Contact, Job & Compensation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Job & Personal Info */}
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2">
                  <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" /> Employment & Contact
                  </h4>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Official Email:</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Phone Number:</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{selectedUser.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Department:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedUser.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Designation:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedUser.job_title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Joining Year:</span>
                      <span className="font-mono text-zinc-800 dark:text-zinc-200">{selectedUser.joining_year || 2026}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Live Attendance & Leave Balances */}
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2">
                  <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> Attendance & Time-Off
                  </h4>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Today's Status:</span>
                      <span className="font-bold text-zinc-900 dark:text-white">{statusInfo.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Attendance Rate:</span>
                      <span className="font-mono font-bold text-emerald-600">{stats.attendanceRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Paid Leave (PTO):</span>
                      <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                        {stats.leavesSummary.paidAvailable} days available (24 quota)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Sick Leave:</span>
                      <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                        {stats.leavesSummary.sickAvailable} days available (7 quota)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Pending Requests:</span>
                      <span className="font-mono font-semibold text-amber-600">
                        {stats.leavesSummary.pendingCount} applications
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Salary & Statutory Breakdown Card */}
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <CreditCard className="w-3.5 h-3.5 text-purple-600" /> Compensation & Statutory Breakdown
                  </h4>
                  <span className="font-mono font-bold text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                    ₹{stats.yearlySalary.toLocaleString()} CTC / year
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block font-medium">Monthly Gross</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white text-xs">
                      ₹{stats.monthlyWage.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block font-medium">Basic (50%)</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white text-xs">
                      ₹{b.basicSalary.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block font-medium">PF (12%) + Tax</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                      -₹{b.totalDeductions.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block font-medium">Net Take-Home</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      ₹{b.netTakeHome.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Bank Account & Tax Identifiers */}
              {selectedUser.bank_details && (
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                  <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <DollarSign className="w-3.5 h-3.5 text-teal-600" /> Banking & Compliance Identifiers
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-zinc-400 text-[10px] block">Bank Name:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedUser.bank_details.bank_name}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[10px] block">Account Number:</span>
                      <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{selectedUser.bank_details.account_no}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[10px] block">IFSC Code:</span>
                      <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{selectedUser.bank_details.ifsc}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[10px] block">PAN:</span>
                      <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{selectedUser.bank_details.pan}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[10px] block">UAN:</span>
                      <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{selectedUser.bank_details.uan}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[10px] block">PF Number:</span>
                      <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{selectedUser.bank_details.pf_no}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* New Employee Creation Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision New Employee"
        subtitle="Automatic Login ID formula: OI + 2 chars First Name + 2 chars Last Name + Year + Serial"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          {/* Auto-Generated Credentials Preview */}
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-1">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Auto-Generated Credentials Preview:
            </span>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">Login ID:</span>
              <span className="font-bold text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                {previewLoginId}
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">Initial Password:</span>
              <span className="font-bold text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                {previewPassword}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Work Email *
              </label>
              <input
                type="email"
                required
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                placeholder="john.doe@company.com"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Annual CTC (₹ INR)
              </label>
              <input
                type="number"
                value={newEmployee.salary}
                onChange={(e) => setNewEmployee({ ...newEmployee, salary: Number(e.target.value) || 1200000 })}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Department
              </label>
              <select
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
              >
                <option value="Engineering">Engineering</option>
                <option value="Design & UX">Design & UX</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Job Designation
              </label>
              <input
                type="text"
                value={newEmployee.job_title}
                onChange={(e) => setNewEmployee({ ...newEmployee, job_title: e.target.value })}
                placeholder="Software Engineer"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold cursor-pointer"
            >
              {creating ? 'Provisioning...' : 'Provision Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
