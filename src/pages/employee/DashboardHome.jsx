// src/pages/employee/DashboardHome.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { attendanceService } from '../../services/attendanceService';
import { leaveService } from '../../services/leaveService';
import { payrollService } from '../../services/payrollService';
import { formatINR } from '../../lib/currency';
import { getUpcomingIndianHolidays } from '../../lib/indianHolidays';
import { WORK_MODES } from '../../lib/constants';
import {
  CalendarCheck,
  CalendarDays,
  CreditCard,
  IndianRupee,
  User,
  Clock,
  ArrowRight,
  Calendar,
  Plane,
  Building,
  CheckCircle2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const DashboardHome = () => {
  const { currentUser } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [payroll, setPayroll] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkingIn, setCheckingIn] = useState(false);
  const [workMode, setWorkMode] = useState(WORK_MODES?.OFFICE || 'office');

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
      await attendanceService.checkIn(currentUser.id, { workMode });
      await loadData();
    } finally {
      setCheckingIn(false);
    }
  };

  const handleQuickCheckOut = async () => {
    setCheckingIn(true);
    try {
      await attendanceService.checkOut(todayAttendance?.id, { userId: currentUser?.id });
      await loadData();
    } finally {
      setCheckingIn(false);
    }
  };

  const isCheckedIn = !!todayAttendance?.check_in_time && !todayAttendance?.check_out_time;
  const hasPunchedToday = !!todayAttendance?.check_in_time || (todayAttendance?.punches && todayAttendance.punches.length > 0);
  const nextSessionNumber = (todayAttendance?.punches?.length || 0) + 1;
  const upcomingIndianHolidays = getUpcomingIndianHolidays ? getUpcomingIndianHolidays(new Date().toISOString().split('T')[0], 3) : [];

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100">
      {/* Top Banner with Clock & Quick Punch */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {currentUser?.department || 'Engineering'} Division
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {format(currentTime, 'EEEE, dd MMMM yyyy')}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Welcome back, {currentUser?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
            Track daily attendance, apply for leaves, and inspect payroll records.
          </p>
        </div>

        {/* Punch Console Widget */}
        <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-700/60 shrink-0">
          <div>
            <div className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100">
              {format(currentTime, 'hh:mm:ss a')}
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
              {isCheckedIn ? `Active Shift (${todayAttendance?.work_mode || 'Office'})` : hasPunchedToday ? 'Punched Out' : 'Punch In Pending'}
            </p>
          </div>

          {!isCheckedIn ? (
            <div className="flex items-center gap-2">
              {!(isAdmin || currentUser?.role === 'admin') && (
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value)}
                  className="bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 text-xs px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 focus:outline-none cursor-pointer"
                >
                  <option value={WORK_MODES?.OFFICE || 'office'}>Office</option>
                  <option value={WORK_MODES?.WFH || 'wfh'}>WFH</option>
                  <option value={WORK_MODES?.ON_DUTY || 'on_duty'}>On-Duty</option>
                </select>
              )}
              <button
                type="button"
                disabled={checkingIn}
                onClick={handleQuickCheckIn}
                className="px-4 py-1.5 rounded-md bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium transition cursor-pointer shadow-xs"
              >
                {checkingIn ? '...' : hasPunchedToday ? `Punch In (#${nextSessionNumber})` : 'Check In'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={checkingIn}
              onClick={handleQuickCheckOut}
              className="px-4 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              {checkingIn ? '...' : `Punch Out`}
            </button>
          )}
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Attendance"
          value={isCheckedOut ? 'Completed' : isCheckedIn ? 'Present' : 'Pending'}
          subtitle={todayAttendance?.check_in_time ? `Since ${format(new Date(todayAttendance.check_in_time), 'hh:mm a')}` : 'Action required'}
          icon={CalendarCheck}
        />
        <StatCard
          title="Leave Balance"
          value="18 Days"
          subtitle="14 Paid • 4 Sick Available"
          icon={CalendarDays}
        />
        <StatCard
          title="Shift Schedule"
          value="09:30 - 18:30"
          subtitle="General Shift (IST) • Mon-Fri"
          icon={Building}
        />
        <StatCard
          title="Pending Requests"
          value={leaves.filter(l => l.status === 'pending').length.toString()}
          subtitle="HR review in progress"
          icon={Clock}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Leave Requests */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Recent Leave Requests"
              subtitle="Track status of your applications and approvals"
              action={
                <Link to="/dashboard/leaves">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              }
            />

            {leaves.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-xs">
                <Plane className="w-6 h-6 mx-auto text-zinc-400 mb-2" />
                <p>No leave requests recorded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {leaves.slice(0, 4).map((leave) => (
                  <div key={leave.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 capitalize">{leave.type} Leave</p>
                          <Badge variant={leave.type} size="sm">{leave.type}</Badge>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {leave.start_date} {leave.start_date !== leave.end_date && `to ${leave.end_date}`} • <span className="italic">"{leave.remarks || 'No remarks'}"</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <Badge variant={leave.status}>{leave.status}</Badge>
                      {leave.comments && (
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-[140px] truncate" title={leave.comments}>
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
              <Card hover className="p-4">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 mb-2.5">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Attendance Log</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Review timesheets & punches</p>
              </Card>
            </Link>

            <Link to="/dashboard/payroll" className="block group">
              <Card hover className="p-4">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 mb-2.5">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Salary Breakdown</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">View pay slip & deductions</p>
              </Card>
            </Link>

            <Link to="/dashboard/profile" className="block group">
              <Card hover className="p-4">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 mb-2.5">
                  <User className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">My Profile</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Update phone, address & photo</p>
              </Card>
            </Link>
          </div>
        </div>

        {/* Right Column: Upcoming Holidays & Notice */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Upcoming Holidays"
              subtitle="Official corporate calendar 2026"
            />
            <div className="space-y-2">
              {upcomingIndianHolidays.length > 0 ? (
                upcomingIndianHolidays.map((holiday) => {
                  const dateObj = parseISO(holiday.date);
                  return (
                    <div key={holiday.date} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-bold text-center flex flex-col items-center justify-center border border-zinc-200 dark:border-zinc-700 shrink-0">
                          <span className="text-[8px] uppercase leading-none font-bold">{format(dateObj, 'MMM')}</span>
                          <span className="text-xs leading-none font-bold mt-0.5">{format(dateObj, 'dd')}</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{holiday.name}</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{holiday.isNational ? 'National Holiday' : 'Corporate Holiday'}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 shrink-0">
                        {format(dateObj, 'EEEE')}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-3 text-center text-xs text-zinc-400">
                  No upcoming holidays in the next 30 days.
                </div>
              )}
            </div>
          </Card>

          {/* Quick Notice Card */}
          <Card className="bg-zinc-900 text-white dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
              HR Announcement
            </div>
            <h4 className="text-xs font-semibold text-white">Monthly Timesheet Cutoff</h4>
            <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
              Ensure all regularizations are submitted before the 25th of the month for payroll disbursement.
            </p>
            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-[10px] text-zinc-400">People Operations</span>
              <Link to="/dashboard/attendance" className="text-xs font-medium text-zinc-200 hover:text-white inline-flex items-center gap-1">
                Timesheet <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
