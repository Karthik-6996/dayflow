// src/pages/employee/DashboardHome.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { attendanceService } from '../../services/attendanceService';
import { leaveService } from '../../services/leaveService';
import { payrollService } from '../../services/payrollService';
import {
  CalendarCheck,
  CalendarDays,
  CreditCard,
  User,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Sparkles,
  Plane,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

export const DashboardHome = () => {
  const { currentUser, isAdmin } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [payroll, setPayroll] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: attData } = await attendanceService.getEmployeeAttendance(currentUser.id, { startDate: today, endDate: today });
      setTodayAttendance(attData?.[0] || null);

      const { data: leavesData } = await leaveService.getEmployeeLeaves(currentUser.id);
      setLeaves(leavesData || []);

      const { data: payData } = await payrollService.getEmployeePayroll(currentUser.id);
      setPayroll(payData || null);
    } catch (e) {
      console.error("Failed loading dashboard data:", e);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleQuickCheckIn = async () => {
    setCheckingIn(true);
    try {
      await attendanceService.checkIn(currentUser.id);
      await loadData();
    } finally {
      setCheckingIn(false);
    }
  };

  const handleQuickCheckOut = async () => {
    if (!todayAttendance) return;
    setCheckingIn(true);
    try {
      await attendanceService.checkOut(todayAttendance.id);
      await loadData();
    } finally {
      setCheckingIn(false);
    }
  };

  const isCheckedIn = !!todayAttendance?.check_in_time;
  const isCheckedOut = !!todayAttendance?.check_out_time;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {currentUser?.department || 'Operations'} Team
              </span>
              <span className="text-xs text-slate-400">
                {format(currentTime, 'EEEE, MMMM dd, yyyy')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good day, {currentUser?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Welcome to your personal Dayflow hub. Review your daily attendance status, leave requests, and payroll summary.
            </p>
          </div>

          {/* Quick punch in banner widget */}
          <div className="flex items-center gap-3 bg-slate-950/60 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 shrink-0">
            <div className="text-right">
              <div className="text-lg font-mono font-bold text-teal-400">
                {format(currentTime, 'hh:mm:ss a')}
              </div>
              <p className="text-[10px] text-slate-400">
                {isCheckedOut ? 'Checked Out for Today' : isCheckedIn ? 'Checked In Active' : 'Not Checked In Yet'}
              </p>
            </div>
            {!isCheckedIn ? (
              <Button
                variant="primary"
                size="sm"
                loading={checkingIn}
                onClick={handleQuickCheckIn}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold"
              >
                Check In
              </Button>
            ) : !isCheckedOut ? (
              <Button
                variant="secondary"
                size="sm"
                loading={checkingIn}
                onClick={handleQuickCheckOut}
                className="bg-rose-500 hover:bg-rose-600 text-white border-0 font-bold"
              >
                Check Out
              </Button>
            ) : (
              <Badge variant="present" size="md">Done</Badge>
            )}
          </div>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Today's Attendance"
          value={isCheckedOut ? 'Completed' : isCheckedIn ? 'Checked In' : 'Pending'}
          subtitle={todayAttendance?.check_in_time ? `Since ${format(new Date(todayAttendance.check_in_time), 'hh:mm a')}` : 'Action required'}
          icon={CalendarCheck}
          color={isCheckedIn ? 'emerald' : 'amber'}
        />
        <StatCard
          title="Active Leave Balance"
          value="18 Days"
          subtitle="14 Paid • 4 Sick Available"
          icon={CalendarDays}
          color="teal"
        />
        <StatCard
          title="Current Net Salary"
          value={payroll ? `$${payroll.net_salary?.toLocaleString()}` : '$6,708'}
          subtitle={`Base $${payroll?.base_salary?.toLocaleString() || '7,666'}`}
          icon={CreditCard}
          color="blue"
        />
        <StatCard
          title="Pending Requests"
          value={leaves.filter(l => l.status === 'pending').length.toString()}
          subtitle="HR Review in progress"
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Main Grid: Attendance / Leaves & Quick shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Leave Requests */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Recent Leave Requests"
              subtitle="Track status of your applications and approvals"
              action={
                <Link to="/dashboard/leaves">
                  <Button variant="outline" size="sm">
                    Apply Leave <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              }
            />

            {leaves.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Plane className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm">No leave requests recorded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {leaves.slice(0, 4).map((leave) => (
                  <div key={leave.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 capitalize">{leave.type} Leave</p>
                          <Badge variant={leave.type} size="sm">{leave.type}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {leave.start_date} {leave.start_date !== leave.end_date && `to ${leave.end_date}`} • <span className="italic text-slate-400">"{leave.remarks || 'No remarks'}"</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <Badge variant={leave.status}>{leave.status}</Badge>
                      {leave.comments && (
                        <p className="text-[10px] text-teal-700 mt-1 max-w-[140px] truncate" title={leave.comments}>
                          Note: {leave.comments}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Action Navigation Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/dashboard/attendance" className="block group">
              <Card hover className="p-4 bg-gradient-to-br from-teal-500/5 to-emerald-500/10 border-teal-100">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Attendance Log</h4>
                <p className="text-xs text-slate-500 mt-1">Review weekly logs and timesheets</p>
              </Card>
            </Link>

            <Link to="/dashboard/payroll" className="block group">
              <Card hover className="p-4 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 border-blue-100">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Salary Breakdown</h4>
                <p className="text-xs text-slate-500 mt-1">View pay slip and monthly deductions</p>
              </Card>
            </Link>

            <Link to="/dashboard/profile" className="block group">
              <Card hover className="p-4 bg-gradient-to-br from-purple-500/5 to-pink-500/10 border-purple-100">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <User className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">My Profile</h4>
                <p className="text-xs text-slate-500 mt-1">Update phone, address & photo</p>
              </Card>
            </Link>
          </div>
        </div>

        {/* Right Column: Company Updates & Policy highlights */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Upcoming Holidays"
              subtitle="Official corporate calendar 2026"
            />
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 font-bold text-center flex flex-col items-center justify-center border border-teal-100">
                    <span className="text-[9px] uppercase leading-none">Sep</span>
                    <span className="text-sm leading-none font-extrabold mt-0.5">07</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Labor Day Observance</p>
                    <p className="text-[11px] text-slate-500">Paid Public Holiday</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-teal-600">In 16 days</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 font-bold text-center flex flex-col items-center justify-center border border-teal-100">
                    <span className="text-[9px] uppercase leading-none">Oct</span>
                    <span className="text-sm leading-none font-extrabold mt-0.5">12</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Indigenous Peoples' Day</p>
                    <p className="text-[11px] text-slate-500">Corporate Holiday</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-400">In 51 days</span>
              </div>
            </div>
          </Card>

          {/* Quick Notice Card */}
          <Card className="bg-gradient-to-br from-teal-900 to-slate-900 text-white border-teal-800/50">
            <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" /> HR Announcement
            </div>
            <h4 className="text-sm font-bold text-white">Annual Benefits Open Enrollment</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Review and adjust your health plan selections and retirement contribution rates before September 15.
            </p>
            <div className="mt-4 pt-3 border-t border-teal-800/60 flex items-center justify-between">
              <span className="text-[10px] text-teal-200">People Operations</span>
              <a href="#" className="text-xs font-bold text-teal-300 hover:text-teal-200 inline-flex items-center gap-1">
                Read FAQ <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
