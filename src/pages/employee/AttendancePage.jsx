// src/pages/employee/AttendancePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceService } from '../../services/attendanceService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import {
  CalendarCheck,
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Play,
  Square,
  Coffee,
  Building,
  Laptop,
  Briefcase,
  FileCheck2,
  AlertCircle,
  Info
} from 'lucide-react';
import { format, differenceInMinutes, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { toast } from 'sonner';
import { WORK_MODES, WORK_MODE_LABELS, REGULARIZATION_REASONS } from '../../lib/constants';
import { getIndianHoliday, isWeekend, getUpcomingIndianHolidays } from '../../lib/indianHolidays';
import { GoogleWorkspaceCalendar } from '../../components/calendar/GoogleWorkspaceCalendar';

export const AttendancePage = () => {
  const { currentUser, isAdmin } = useAuth();
  const isAdminUser = Boolean(isAdmin || currentUser?.role === 'admin');

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'logs' | 'regularizations'
  const [currentTime, setCurrentTime] = useState(new Date());

  // Punch State
  const [workMode, setWorkMode] = useState(WORK_MODES.OFFICE);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [sessionBreakMinutes, setSessionBreakMinutes] = useState(0);

  // Month navigation for calendar view
  const [currentMonthDate] = useState(new Date(2026, 7, 1)); // August 2026

  // Regularization Modal State
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    date: '2026-08-19',
    requestedCheckIn: '09:30',
    requestedCheckOut: '18:30',
    reason: 'biometric_glitch',
    remarks: ''
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = format(currentTime, 'yyyy-MM-dd');

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const { data: recordsData } = await attendanceService.getEmployeeAttendance(currentUser.id, {
        startDate: '2026-08-01',
        endDate: '2026-08-31'
      });
      setAttendanceRecords(recordsData || []);

      const { data: regData } = await attendanceService.getRegularizationRequests({ userId: currentUser.id });
      setRegularizations(regData || []);
    } catch (e) {
      console.warn("Could not load attendance logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const todayRecord = attendanceRecords.find(r => r.date === todayStr);

  // Sync workMode with today's record if present
  useEffect(() => {
    if (todayRecord?.work_mode) {
      setWorkMode(todayRecord.work_mode);
    }
  }, [todayRecord]);

  const handleWorkModeChange = async (newMode) => {
    setWorkMode(newMode);
    if (todayRecord?.id || currentUser?.id) {
      setActionLoading(true);
      try {
        await attendanceService.updateWorkMode(todayRecord?.id, newMode, currentUser?.id);
        toast.success(`Work Mode set to ${WORK_MODE_LABELS[newMode] || newMode}`);
        await loadData();
      } catch (e) {
        toast.error("Failed to update work mode");
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const { error } = await attendanceService.checkIn(currentUser.id, {
        workMode,
        location: 'Bangalore HQ'
      });
      if (error) {
        toast.error(error);
      } else {
        const nextSessionNum = (todayRecord?.punches?.length || 0) + 1;
        toast.success(`Punched In for Session #${nextSessionNum} (${WORK_MODE_LABELS[workMode] || workMode})!`);
        setIsOnBreak(false);
        await loadData();
      }
    } catch (e) {
      toast.error(e?.message || "Failed to punch in");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenShift = async () => {
    setActionLoading(true);
    try {
      const { error } = await attendanceService.reopenShift(todayRecord?.id, currentUser?.id);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Shift resumed! You are now Punched In.");
        setIsOnBreak(false);
        await loadData();
      }
    } catch (e) {
      toast.error(e?.message || "Failed to reopen shift");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetToday = async () => {
    setActionLoading(true);
    try {
      await attendanceService.resetTodayAttendance(currentUser.id);
      setIsOnBreak(false);
      setSessionBreakMinutes(0);
      toast.success("Today's punch reset! You can now test punching in afresh.");
      await loadData();
    } catch (e) {
      toast.error("Failed to reset attendance");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const { error } = await attendanceService.checkOut(todayRecord?.id, {
        breakMinutes: sessionBreakMinutes,
        userId: currentUser?.id
      });
      if (error) {
        toast.error(error);
      } else {
        toast.success("Punched Out successfully! Session logged.");
        setIsOnBreak(false);
        await loadData();
      }
    } catch (e) {
      toast.error(e?.message || "Failed to punch out");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBreak = async () => {
    if (!todayRecord) {
      toast.info("Please punch in first before taking a break.");
      return;
    }
    if (todayRecord.check_out_time) {
      toast.info("Shift session is paused/completed. Punch in to log work and breaks.");
      return;
    }

    if (!isOnBreak) {
      setIsOnBreak(true);
      toast.info("Break started (Working timer paused) ☕");
    } else {
      setIsOnBreak(false);
      const addedBreak = 15;
      setSessionBreakMinutes(prev => prev + addedBreak);
      await attendanceService.recordBreak(todayRecord.id, addedBreak, currentUser?.id);
      toast.success("Resumed work! 15m break logged.");
      await loadData();
    }
  };

  const handleRegSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { error } = await attendanceService.submitRegularizationRequest({
        userId: currentUser.id,
        date: regForm.date,
        requestedCheckIn: regForm.requestedCheckIn,
        requestedCheckOut: regForm.requestedCheckOut,
        reason: regForm.reason,
        remarks: regForm.remarks
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success("Regularization request submitted for Manager approval!");
        setIsRegModalOpen(false);
        setRegForm({
          date: '2026-08-19',
          requestedCheckIn: '09:30',
          requestedCheckOut: '18:30',
          reason: 'biometric_glitch',
          remarks: ''
        });
        await loadData();
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Helper calculation for duration across multiple sessions today
  const calcTotalDayDuration = (record, now, additionalBreaks = 0) => {
    if (!record || (!record.check_in_time && (!record.punches || record.punches.length === 0))) {
      return { formatted: '0h 0m', totalMinutes: 0, sessionCount: 0, punches: [] };
    }

    const punches = record.punches && record.punches.length > 0
      ? record.punches
      : [{ in: record.check_in_time, out: record.check_out_time, work_mode: record.work_mode || 'office' }];

    let grossMinutes = 0;
    punches.forEach(p => {
      if (p.in && p.out) {
        grossMinutes += Math.max(0, differenceInMinutes(parseISO(p.out), parseISO(p.in)));
      } else if (p.in && !p.out) {
        grossMinutes += Math.max(0, differenceInMinutes(now, parseISO(p.in)));
      }
    });

    const totalBreaks = (record.break_minutes || 0) + (additionalBreaks || 0);
    const netMinutes = Math.max(0, grossMinutes - totalBreaks);
    const h = Math.floor(netMinutes / 60);
    const m = netMinutes % 60;

    return {
      formatted: `${h}h ${m}m`,
      totalMinutes: netMinutes,
      sessionCount: punches.length,
      punches
    };
  };

  // Calendar calculations for August 2026
  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(currentMonthDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOffset = (getDay(monthStart) + 6) % 7; // Align Mon=0

  const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
  const lateDays = attendanceRecords.filter(r => r.is_late).length;
  const wfhDays = attendanceRecords.filter(r => r.work_mode === WORK_MODES.WFH).length;

  const isCheckedIn = !!todayRecord?.check_in_time && !todayRecord?.check_out_time;
  const hasPunchedToday = !!todayRecord?.check_in_time || (todayRecord?.punches && todayRecord.punches.length > 0);
  const dayDuration = calcTotalDayDuration(todayRecord, currentTime, sessionBreakMinutes);
  const currentSessionNumber = isCheckedIn ? (todayRecord?.punches?.length || 1) : ((todayRecord?.punches?.length || 0) + 1);

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100">
      {/* Top Banner with Clock & Live Punch Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Punch In/Out Card */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isCheckedIn ? 'bg-emerald-500 animate-pulse' : hasPunchedToday ? 'bg-blue-500' : 'bg-amber-500'}`} />
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Daily Punch Console</h2>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${isCheckedIn ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'}`}>
                    {isCheckedIn ? `Session #${currentSessionNumber} Active` : hasPunchedToday ? 'Shift Logged' : 'Ready'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Standard General Shift (09:30 – 18:30 IST) • Multi-Punch Enabled
                </p>
              </div>

              {/* Current Real-Time Clock */}
              <div className="text-left sm:text-right">
                <span className="font-mono text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {format(currentTime, 'hh:mm:ss a')}
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                  {format(currentTime, 'EEEE, dd MMMM yyyy')}
                </p>
              </div>
            </div>

            {/* Work Mode Selection & Status */}
            <div className="mt-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                {/* Work mode selector (Hidden for Admin, Work from Office is default and only option) */}
                {!isAdminUser ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Work Mode:</span>
                    <div className="inline-flex rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                      <button
                        type="button"
                        onClick={() => handleWorkModeChange(WORK_MODES.OFFICE)}
                        className={`px-3 py-1 text-xs rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                          workMode === WORK_MODES.OFFICE || workMode === 'office'
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        <Building className="w-3.5 h-3.5" /> Office
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWorkModeChange(WORK_MODES.WFH)}
                        className={`px-3 py-1 text-xs rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                          workMode === WORK_MODES.WFH || workMode === 'wfh'
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        <Laptop className="w-3.5 h-3.5" /> WFH
                      </button>
                      <button
                        type="button"
                        onClick={() => handleWorkModeChange(WORK_MODES.ON_DUTY)}
                        className={`px-3 py-1 text-xs rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                          workMode === WORK_MODES.ON_DUTY || workMode === 'on_duty' || workMode === 'client' || workMode === 'client_site'
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                      >
                        <Briefcase className="w-3.5 h-3.5" /> Client
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Work Mode:</span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" /> Work from Office
                    </span>
                  </div>
                )}

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">Status:</span>
                  {isOnBreak ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse flex items-center gap-1">
                      <Coffee className="w-3 h-3" /> On Break
                    </span>
                  ) : isCheckedIn ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Present (Session #{currentSessionNumber})
                    </span>
                  ) : hasPunchedToday ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                      Punched Out ({dayDuration.sessionCount} Sessions)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                      Not Punched In
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Punch In / Break / Punch Out */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* Check In Button: Active whenever user is not currently checked in */}
                {!isCheckedIn ? (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleCheckIn}
                    className="py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-[0.98]"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {hasPunchedToday ? `Punch In (Session #${currentSessionNumber})` : 'Punch In'}
                  </button>
                ) : (
                  <div className="py-3.5 px-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    In: {format(parseISO(todayRecord.check_in_time), 'hh:mm a')}
                  </div>
                )}

                {/* Break Button */}
                <button
                  type="button"
                  disabled={actionLoading || !isCheckedIn}
                  onClick={handleToggleBreak}
                  className={`py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition border flex items-center justify-center gap-2 ${
                    !isCheckedIn
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-800 cursor-not-allowed opacity-50'
                      : isOnBreak
                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 animate-pulse cursor-pointer shadow-md shadow-amber-500/20'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer'
                  } active:scale-[0.98]`}
                >
                  <Coffee className="w-4 h-4" />
                  {isOnBreak ? 'Resume Work' : !isCheckedIn && hasPunchedToday ? `${(todayRecord?.break_minutes || 0) + sessionBreakMinutes}m Break Logged` : 'Take Break'}
                </button>

                {/* Check Out Button: Active whenever employee is currently checked in */}
                {isCheckedIn ? (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleCheckOut}
                    className="py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-md shadow-rose-600/20 active:scale-[0.98]"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    Punch Out (Session #{currentSessionNumber})
                  </button>
                ) : (
                  <div className="py-3.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-zinc-500 dark:text-zinc-400 font-medium text-xs sm:text-sm flex items-center justify-center gap-2">
                    <Square className="w-4 h-4" />
                    {hasPunchedToday ? `Out (${format(parseISO(todayRecord.check_out_time || new Date().toISOString()), 'hh:mm a')})` : 'Punch Out'}
                  </div>
                )}
              </div>
            </div>

            {/* Today's Multi-Punch History Log (if punches exist) */}
            {dayDuration.punches.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
                  <span>Today's Sessions ({dayDuration.punches.length})</span>
                  <span>Accumulated: <strong className="text-zinc-900 dark:text-zinc-100 font-mono">{dayDuration.formatted}</strong></span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dayDuration.punches.map((p, idx) => {
                    const inStr = p.in ? format(parseISO(p.in), 'hh:mm a') : '—';
                    const outStr = p.out ? format(parseISO(p.out), 'hh:mm a') : 'Active';
                    const durationMins = p.out
                      ? differenceInMinutes(parseISO(p.out), parseISO(p.in))
                      : differenceInMinutes(currentTime, parseISO(p.in));
                    const durH = Math.floor(Math.max(0, durationMins) / 60);
                    const durM = Math.max(0, durationMins) % 60;

                    return (
                      <div
                        key={idx}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                          !p.out
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium'
                            : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        <span className="font-semibold">#{idx + 1}:</span>
                        <span>{inStr} – {outStr}</span>
                        <span className="text-[10px] opacity-75">({durH}h {durM}m • {p.work_mode || 'office'})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Demo Controls & Reset Footer */}
          <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-teal-500" />
              <span>Mode: <strong className="text-zinc-700 dark:text-zinc-300">{WORK_MODE_LABELS[workMode] || 'Office'}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetToday}
                disabled={actionLoading}
                className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:underline cursor-pointer flex items-center gap-1"
                title="Reset today's punch to test cycle afresh"
              >
                ↻ Reset Today (Demo Mode)
              </button>
            </div>
          </div>
        </Card>

        {/* Live Session Counter Widget */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Active Shift Metrics</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Calculated net working hours</p>

            <div className="mt-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400">Total Shift Time:</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {dayDuration.formatted}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400">Sessions Completed:</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {dayDuration.sessionCount} {dayDuration.sessionCount === 1 ? 'Session' : 'Sessions'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400">Break Logged:</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {(todayRecord?.break_minutes || 0) + sessionBreakMinutes} mins
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Punctuality:</span>
                <span className={`font-semibold ${todayRecord?.is_late ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {todayRecord?.is_late ? 'Late Arrival' : hasPunchedToday ? 'On Time (09:30)' : 'Pending Punch'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Location: {todayRecord?.location || 'Bangalore HQ'}</span>
            <button
              onClick={() => setIsRegModalOpen(true)}
              className="text-zinc-900 dark:text-white font-semibold hover:underline cursor-pointer"
            >
              Missed Punch?
            </button>
          </div>
        </Card>
      </div>

      {/* Monthly Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Present Days"
          value={`${presentDays} / 22`}
          subtitle="August 2026 (Mon-Fri)"
          icon={CalendarCheck}
        />
        <StatCard
          title="Late Check-ins"
          value={lateDays}
          subtitle="Beyond 09:45 cutoff"
          icon={AlertTriangle}
        />
        <StatCard
          title="WFH Days"
          value={wfhDays}
          subtitle="Remote work shifts"
          icon={Laptop}
        />
        <StatCard
          title="On-Time Rate"
          value={`${presentDays > 0 ? Math.round(((presentDays - lateDays) / presentDays) * 100) : 100}%`}
          subtitle="Compliance score"
          icon={CheckCircle}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Monthly Matrix Calendar
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          Daily History Logs
        </button>
        <button
          onClick={() => setActiveTab('regularizations')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'regularizations'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <span>Regularization Requests</span>
          {regularizations.filter(r => r.status === 'pending').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
              {regularizations.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Google Workspace Monthly Matrix & Schedule Calendar */}
      {activeTab === 'calendar' && (
        <GoogleWorkspaceCalendar
          records={attendanceRecords}
          onRequestRegularization={(dateStr) => {
            setSelectedLogForReg({ date: dateStr });
            setIsRegModalOpen(true);
          }}
        />
      )}

      {/* TAB 2: Detailed Attendance Logs Table */}
      {activeTab === 'logs' && (
        <Card>
          <CardHeader
            title="Detailed Attendance History"
            subtitle="Showing all recorded shifts, punch timestamps, and work locations"
          />

          {loading ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              Loading records...
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              No attendance records found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Work Mode</TableHead>
                  <TableHead>Check-In</TableHead>
                  <TableHead>Check-Out</TableHead>
                  <TableHead>Break</TableHead>
                  <TableHead>Net Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {record.date === todayStr ? `${record.date} (Today)` : record.date}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs capitalize font-medium text-zinc-800 dark:text-zinc-200">
                        {record.work_mode || 'Office'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-zinc-800 dark:text-zinc-200">
                      {record.check_in_time ? format(parseISO(record.check_in_time), 'hh:mm:ss a') : '—'}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-zinc-800 dark:text-zinc-200">
                      {record.check_out_time ? format(parseISO(record.check_out_time), 'hh:mm:ss a') : record.check_in_time ? 'In-Progress' : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      {record.break_minutes ? `${record.break_minutes}m` : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {calcDurationFormatted(record.check_in_time, record.check_out_time, record.break_minutes)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.status}>{record.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* TAB 3: Regularization Requests */}
      {activeTab === 'regularizations' && (
        <Card>
          <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">My Regularization Requests</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Missed punch adjustments & time correction requests</p>
            </div>
            <button
              onClick={() => setIsRegModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold cursor-pointer"
            >
              New Request
            </button>
          </div>

          {regularizations.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              No regularization requests submitted.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Requested Shift</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>HR Review Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regularizations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">{r.date}</TableCell>
                    <TableCell className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                      {r.requested_check_in} — {r.requested_check_out}
                    </TableCell>
                    <TableCell className="text-xs capitalize text-zinc-800 dark:text-zinc-200">
                      {r.reason?.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs truncate" title={r.remarks}>
                      {r.remarks || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.admin_comments ? (
                        <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                          {r.admin_comments}
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic">Pending review</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Regularization Modal */}
      <Modal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        title="Apply for Attendance Regularization"
        subtitle="Submit missed punch or time correction for manager review"
      >
        <form onSubmit={handleRegSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
              Attendance Date *
            </label>
            <input
              type="date"
              required
              value={regForm.date}
              onChange={(e) => setRegForm({ ...regForm, date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                Requested Check-In *
              </label>
              <input
                type="time"
                required
                value={regForm.requestedCheckIn}
                onChange={(e) => setRegForm({ ...regForm, requestedCheckIn: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
                Requested Check-Out *
              </label>
              <input
                type="time"
                required
                value={regForm.requestedCheckOut}
                onChange={(e) => setRegForm({ ...regForm, requestedCheckOut: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
              Reason Category *
            </label>
            <select
              value={regForm.reason}
              onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              {REGULARIZATION_REASONS.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
              Detailed Remarks *
            </label>
            <textarea
              required
              rows={3}
              value={regForm.remarks}
              onChange={(e) => setRegForm({ ...regForm, remarks: e.target.value })}
              placeholder="Explain reason for missed punch / time correction..."
              className="w-full p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsRegModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold cursor-pointer"
            >
              {actionLoading ? 'Saving...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
