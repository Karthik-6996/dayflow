// src/pages/employee/DashboardHome.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { attendanceService } from '../../services/attendanceService';
import { leaveService } from '../../services/leaveService';
import { payrollService } from '../../services/payrollService';
import { notificationService } from '../../services/notificationService';
import { WORK_MODES } from '../../lib/constants';
import {
  CalendarCheck,
  CalendarDays,
  CreditCard,
  User,
  Clock,
  ArrowRight,
  Sparkles,
  Plane,
  FileText,
  Bell,
  X,
  Play,
  Square,
  Check,
  Mail,
  Phone,
  Plus
} from 'lucide-react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';

export const DashboardHome = () => {
  const { currentUser, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [adminPendingLeaves, setAdminPendingLeaves] = useState([]);
  const [payroll, setPayroll] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Attendance Punch State
  const [checkingIn, setCheckingIn] = useState(false);
  const [workMode, setWorkMode] = useState(WORK_MODES?.OFFICE || 'office');

  // Leave Request Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: 'paid', // 'paid' | 'sick' | 'unpaid'
    startDate: '',
    endDate: '',
    remarks: ''
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async () => {
    if (!currentUser) return;
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Fetch Notifications
      const { data: notifData } = await notificationService.getEmployeeNotifications(currentUser.id);
      setNotifications(notifData || []);

      // 2. Fetch Today's Attendance
      const { data: attData } = await attendanceService.getEmployeeAttendance(currentUser.id, { startDate: today, endDate: today });
      setTodayAttendance(attData?.[0] || null);

      // 3. Fetch Employee Leave Requests (All: Pending, Approved, Rejected)
      const { data: leavesData } = await leaveService.getEmployeeLeaves(currentUser.id);
      setLeaves(leavesData || []);

      // 4. Fetch Payroll Summary
      const { data: payData } = await payrollService.getEmployeePayroll(currentUser.id);
      setPayroll(payData || null);

      // 5. If Admin, fetch all pending leave requests for review
      if (isAdmin) {
        const { data: allLeaves } = await leaveService.getAllLeaves({ status: 'pending' });
        setAdminPendingLeaves(allLeaves || []);
      }
    } catch (e) {
      console.error("Failed loading dashboard data:", e);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentUser, isAdmin]);

  // Quick Punch In
  const handleQuickCheckIn = async () => {
    setCheckingIn(true);
    try {
      const { error } = await attendanceService.checkIn(currentUser.id, { workMode });
      if (error) {
        toast.error(error);
      } else {
        toast.success("Punched in successfully for today!");
        await loadDashboardData();
      }
    } finally {
      setCheckingIn(false);
    }
  };

  // Quick Punch Out
  const handleQuickCheckOut = async () => {
    if (!todayAttendance) return;
    setCheckingIn(true);
    try {
      const { error } = await attendanceService.checkOut(todayAttendance.id);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Punched out successfully. Shift completed!");
        await loadDashboardData();
      }
    } finally {
      setCheckingIn(false);
    }
  };

  // Submit Leave Request
  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate) {
      toast.error("Please select start and end dates");
      return;
    }
    setSubmittingLeave(true);
    try {
      const s = new Date(leaveForm.startDate);
      const end = new Date(leaveForm.endDate);
      const diffTime = Math.abs(end - s);
      const count = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

      const { error } = await leaveService.submitLeaveRequest({
        userId: currentUser.id,
        type: leaveForm.type,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        remarks: leaveForm.remarks,
        daysCount: count
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success("Leave request submitted for HR approval!");
        if (data) {
          setLeaves(prev => [data, ...prev.filter(p => p.id !== data.id)]);
        }
        setIsLeaveModalOpen(false);
        setLeaveForm({ type: 'paid', startDate: '', endDate: '', remarks: '' });
        await loadDashboardData();
      }
    } finally {
      setSubmittingLeave(false);
    }
  };

  // Admin Quick Review
  const handleAdminReviewLeave = async (leaveId, status) => {
    try {
      const comments = status === 'approved' ? 'Approved by Admin' : 'Declined per schedule';
      await leaveService.updateLeaveStatus(leaveId, { status, comments });
      toast.success(`Leave request ${status === 'approved' ? 'Approved' : 'Rejected'}!`);
      await loadDashboardData();
    } catch (e) {
      toast.error("Failed to update leave status");
    }
  };

  const handleDismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const isCheckedIn = !!todayAttendance?.check_in_time;
  const isCheckedOut = !!todayAttendance?.check_out_time;

  const calcTodayDuration = () => {
    if (!todayAttendance?.check_in_time) return '—';
    const start = parseISO(todayAttendance.check_in_time);
    const end = todayAttendance.check_out_time ? parseISO(todayAttendance.check_out_time) : currentTime;
    const minutes = differenceInMinutes(end, start);
    if (minutes < 0) return '—';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins < 10 ? '0' : ''}${mins}m`;
  };

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100 max-w-7xl mx-auto">
      {/* ─────────────────────────────────────────────────────────────
          1. EMPLOYEE NOTIFICATIONS SECTION (TOP OF DASHBOARD)
      ───────────────────────────────────────────────────────────── */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              HR Notifications & Updates ({notifications.length})
            </h2>
            <button
              onClick={() => setNotifications([])}
              className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 shadow-2xs transition-all ${
                  notif.type === 'salary'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                    : notif.type === 'leave_approved' || notif.type === 'reg_approved'
                    ? 'bg-teal-50/80 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800/60'
                    : notif.type === 'leave_rejected'
                    ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
                    : 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                    notif.type === 'salary'
                      ? 'bg-emerald-600 text-white'
                      : notif.type === 'leave_approved' || notif.type === 'reg_approved'
                      ? 'bg-teal-600 text-white'
                      : notif.type === 'leave_rejected'
                      ? 'bg-rose-600 text-white'
                      : 'bg-blue-600 text-white'
                  }`}>
                    {notif.type === 'salary' ? <CreditCard className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">
                      {notif.title}
                    </h4>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDismissNotification(notif.id)}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded-lg transition cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. STATS SECTION (HORIZONTAL METRIC STRIP)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Attendance"
          value={isCheckedOut ? 'Completed' : isCheckedIn ? 'Present (Active)' : 'Pending Check-In'}
          subtitle={todayAttendance?.check_in_time ? `Punched at ${format(parseISO(todayAttendance.check_in_time), 'hh:mm a')}` : 'Action required today'}
          icon={CalendarCheck}
          color={isCheckedIn ? 'emerald' : 'amber'}
        />
        <StatCard
          title="Leave Requests"
          value={`${leaves.length} Total`}
          subtitle={`${leaves.filter(l => l.status === 'pending').length} Pending • ${leaves.filter(l => l.status === 'approved').length} Approved`}
          icon={CalendarDays}
          color="teal"
        />
        <StatCard
          title="Monthly Net Salary"
          value={payroll ? `₹${payroll.net_salary?.toLocaleString('en-IN')}` : '₹95,450'}
          subtitle={`CTC Base ₹${payroll?.base_salary?.toLocaleString('en-IN') || '1,10,000'}`}
          icon={CreditCard}
          color="blue"
        />
        <StatCard
          title="Pending Approvals"
          value={leaves.filter(l => l.status === 'pending').length.toString()}
          subtitle="HR review in progress"
          icon={Clock}
          color="purple"
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. PROFILE SECTION (HORIZONTAL PROFILE CARD)
      ───────────────────────────────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <Avatar
              src={currentUser?.profile_pic}
              name={currentUser?.name}
              size="xl"
              role={currentUser?.role}
            />
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  {currentUser?.name}
                </h3>
                <Badge variant={currentUser?.role}>{currentUser?.role}</Badge>
              </div>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                {currentUser?.job_title || 'Software Engineer'} • {currentUser?.department || 'Engineering'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-teal-600" /> {currentUser?.email}
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-teal-600" /> {currentUser?.phone || '+91 98765 43210'}
                </span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-bold text-zinc-700 dark:text-zinc-300">
                  ID: {currentUser?.employee_id || 'DF-1001'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 shrink-0">
            <Link to="/dashboard/profile">
              <Button variant="outline" size="sm" icon={User}>
                View Full Profile
              </Button>
            </Link>
            <Link to="/dashboard/profile?tab=documents">
              <Button variant="secondary" size="sm" icon={FileText}>
                My Documents & Payslips
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          4. ATTENDANCE & LEAVE REQUEST SECTIONS (HORIZONTAL LAYOUT)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ATTENDANCE SECTION */}
        <Card className="p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Daily Attendance & Punch</h3>
                  <p className="text-[11px] text-zinc-500">General Shift: 09:30 AM — 06:30 PM IST</p>
                </div>
              </div>

              <Link to="/dashboard/attendance" className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                Calendar View <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400">Check-In</span>
                <p className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5">
                  {todayAttendance?.check_in_time ? format(parseISO(todayAttendance.check_in_time), 'hh:mm a') : '—'}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400">Check-Out</span>
                <p className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5">
                  {todayAttendance?.check_out_time ? format(parseISO(todayAttendance.check_out_time), 'hh:mm a') : '—'}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400">Working Hours</span>
                <p className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                  {calcTodayDuration()}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            {!isCheckedIn ? (
              <div className="flex items-center gap-2">
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                >
                  <option value={WORK_MODES?.OFFICE || 'office'}>🏢 Office</option>
                  <option value={WORK_MODES?.WFH || 'wfh'}>🏠 WFH</option>
                  <option value={WORK_MODES?.ON_DUTY || 'on_duty'}>💼 On-Duty</option>
                </select>
                <Button
                  variant="primary"
                  loading={checkingIn}
                  onClick={handleQuickCheckIn}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  icon={Play}
                >
                  Punch In Today
                </Button>
              </div>
            ) : !isCheckedOut ? (
              <Button
                variant="danger"
                loading={checkingIn}
                onClick={handleQuickCheckOut}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold"
                icon={Square}
              >
                Punch Out (End Shift)
              </Button>
            ) : (
              <div className="p-2.5 text-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                ✓ Shift Completed Today • Total: {calcTodayDuration()}
              </div>
            )}
          </div>
        </Card>

        {/* LEAVE REQUEST SECTION */}
        <Card className="p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                  <Plane className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">My Leave Requests</h3>
                  <p className="text-[11px] text-zinc-500">Track pending, approved, and rejected applications</p>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setIsLeaveModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              >
                Apply for Leave
              </Button>
            </div>

            {/* Leave Applications List */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 mt-2">
              {leaves.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 text-xs">
                  No leave requests recorded yet. Click "Apply for Leave" to submit.
                </div>
              ) : (
                leaves.slice(0, 3).map((leave) => {
                  const count = leave.days || leave.days_count || 1;
                  return (
                    <div key={leave.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-900 dark:text-white capitalize">
                            {leave.type} Leave ({count} {count === 1 ? 'day' : 'days'})
                          </span>
                          <Badge variant={leave.type} size="sm">{leave.type}</Badge>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {leave.start_date} {leave.start_date !== leave.end_date && `to ${leave.end_date}`}
                          {leave.remarks && ` • "${leave.remarks}"`}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <Badge variant={leave.status}>{leave.status}</Badge>
                        {leave.comments && (
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate max-w-[140px]" title={leave.comments}>
                            {leave.comments}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-2 text-right">
            <Link to="/dashboard/leaves" className="text-xs font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1">
              View All Leave History ({leaves.length}) <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. ADMIN / HR PENDING LEAVE APPROVALS REVIEW (FOR ADMINS)
      ───────────────────────────────────────────────────────────── */}
      {isAdmin && adminPendingLeaves.length > 0 && (
        <Card className="p-6">
          <CardHeader
            title="Employee Leave Requests Awaiting Review"
            subtitle={`Showing ${adminPendingLeaves.length} pending employee applications`}
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Remarks / Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminPendingLeaves.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-white text-xs">{l.users?.name || 'Employee'}</p>
                      <p className="text-[10px] text-zinc-400 font-mono">{l.users?.employee_id || 'DF-1000'} • {l.users?.department}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={l.type}>{l.type} Leave</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {l.start_date} to {l.end_date}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                    {l.remarks || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="pending">Pending</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleAdminReviewLeave(l.id, 'approved')}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() => handleAdminReviewLeave(l.id, 'rejected')}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: APPLY FOR LEAVE
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Apply for Leave"
        subtitle="Select leave type, choose date range, and add remarks"
      >
        <form onSubmit={handleSubmitLeave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Leave Type *
            </label>
            <select
              value={leaveForm.type}
              onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-teal-600"
            >
              <option value="paid">Paid Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                End Date *
              </label>
              <input
                type="date"
                required
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:border-teal-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Reason / Remarks
            </label>
            <textarea
              rows={3}
              value={leaveForm.remarks}
              onChange={(e) => setLeaveForm({ ...leaveForm, remarks: e.target.value })}
              placeholder="e.g. Attending a family wedding, personal work..."
              className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:border-teal-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsLeaveModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submittingLeave} className="bg-teal-600 hover:bg-teal-700 font-bold">
              Submit Leave Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
