// src/pages/employee/AttendancePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceService } from '../../services/attendanceService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
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
  MapPin,
  Building,
  Laptop,
  Briefcase,
  Sparkles,
  TrendingUp,
  FileCheck2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Info,
  CalendarDays
} from 'lucide-react';
import { format, differenceInMinutes, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import { WORK_MODES, WORK_MODE_LABELS, SHIFT_CONFIG, REGULARIZATION_REASONS } from '../../lib/constants';
import { getIndianHoliday, isWeekend, getUpcomingIndianHolidays } from '../../lib/indianHolidays';

export const AttendancePage = () => {
  const { currentUser } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' or 'logs' or 'regularizations'
  const [currentTime, setCurrentTime] = useState(new Date());

  // Punch State
  const [workMode, setWorkMode] = useState(WORK_MODES.OFFICE);
  const [locationName, setLocationName] = useState('Bangalore HQ - Floor 4');
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [sessionBreakMinutes, setSessionBreakMinutes] = useState(0);

  // Month navigation for calendar view
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(2026, 7, 1)); // August 2026
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);

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

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [attRes, regRes] = await Promise.all([
        attendanceService.getEmployeeAttendance(currentUser.id),
        attendanceService.getRegularizationRequests({ userId: currentUser.id })
      ]);

      if (attRes.error) toast.error("Error loading attendance records");
      setAttendanceRecords(attRes.data || []);
      setRegularizations(regRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const todayStr = '2026-08-22'; // Reference day
  const todayRecord = attendanceRecords.find(a => a.date === todayStr);

  // Handle Punch In
  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const { error } = await attendanceService.checkIn(currentUser.id, {
        workMode,
        location: workMode === WORK_MODES.OFFICE ? 'Bangalore HQ - Floor 4' : workMode === WORK_MODES.WFH ? 'Remote - Home Office' : 'Client On-Duty Site'
      });
      if (error) {
        toast.error(error);
      } else {
        toast.success(`Successfully punched in for today (${WORK_MODE_LABELS[workMode]})!`);
        await loadData();
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Break Toggle
  const handleToggleBreak = async () => {
    if (!todayRecord) return;
    if (!isOnBreak) {
      setIsOnBreak(true);
      setBreakStartTime(new Date());
      toast.info("☕ Break started. Remember to resume when back at desk.");
    } else {
      const minutes = breakStartTime ? Math.max(1, differenceInMinutes(new Date(), breakStartTime)) : 15;
      setIsOnBreak(false);
      setBreakStartTime(null);
      setSessionBreakMinutes(prev => prev + minutes);
      await attendanceService.recordBreak(todayRecord.id, minutes);
      toast.success(`Resumed work. Added ${minutes} mins to break tracker.`);
      await loadData();
    }
  };

  // Handle Punch Out
  const handleCheckOut = async () => {
    if (!todayRecord) return;
    setActionLoading(true);
    try {
      const { error } = await attendanceService.checkOut(todayRecord.id, { breakMinutes: sessionBreakMinutes });
      if (error) {
        toast.error(error);
      } else {
        toast.success("Successfully punched out. Shift completed!");
        await loadData();
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Regularization Submit
  const handleRegSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.date || !regForm.requestedCheckIn || !regForm.requestedCheckOut) {
      toast.error("Please provide valid date and requested shift times");
      return;
    }
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
        toast.success("Attendance regularization request submitted for HR approval!");
        setIsRegModalOpen(false);
        setRegForm({
          date: '',
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

  // Calculate elapsed time today
  const calcLiveDuration = () => {
    if (!todayRecord?.check_in_time) return '00h 00m';
    const start = parseISO(todayRecord.check_in_time);
    const end = todayRecord.check_out_time ? parseISO(todayRecord.check_out_time) : currentTime;
    const grossMinutes = differenceInMinutes(end, start);
    const netMinutes = Math.max(0, grossMinutes - (todayRecord.break_minutes || 0) - sessionBreakMinutes);
    const hrs = Math.floor(netMinutes / 60);
    const mins = netMinutes % 60;
    return `${hrs}h ${mins < 10 ? '0' : ''}${mins}m`;
  };

  const calcDurationFormatted = (checkIn, checkOut, breaks = 0) => {
    if (!checkIn) return '—';
    const start = parseISO(checkIn);
    const end = checkOut ? parseISO(checkOut) : currentTime;
    const gross = differenceInMinutes(end, start);
    const net = Math.max(0, gross - breaks);
    const hrs = Math.floor(net / 60);
    const mins = net % 60;
    return `${hrs}h ${mins}m`;
  };

  // Summary Metrics
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
  const halfDays = attendanceRecords.filter(r => r.status === 'half-day').length;
  const lateMarks = attendanceRecords.filter(r => r.is_late).length;
  const wfhDays = attendanceRecords.filter(r => r.work_mode === WORK_MODES.WFH).length;
  const pendingRegs = regularizations.filter(r => r.status === 'pending').length;

  // Calendar calculations
  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(currentMonthDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  // Monday as index 0: getDay returns 0 for Sunday
  const startDayOffset = (getDay(monthStart) + 6) % 7;

  const upcomingHolidays = getUpcomingIndianHolidays(todayStr, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header with Indian Timezone indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance & Timesheet Portal</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
              <Clock className="w-3 h-3 text-teal-700" /> IST (UTC+05:30)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Indian Standard Shift (09:30 AM — 06:30 PM) • Grace Period till 09:45 AM • Biometric & Remote Sync
          </p>
        </div>

        {/* Regularization Action Button */}
        <div className="flex items-center gap-2 self-start">
          <Button
            variant="outline"
            size="sm"
            icon={FileCheck2}
            onClick={() => setIsRegModalOpen(true)}
            className="border-teal-300 text-teal-800 hover:bg-teal-50 shadow-2xs font-semibold"
          >
            Apply Regularization
            {pendingRegs > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                {pendingRegs}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Live Punch Clock Widget & Indian Standard Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modern Punch Widget */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white border-slate-800 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                Live Punch Console
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {format(currentTime, 'EEE, dd MMM yyyy')}
              </span>
            </div>

            {/* Live digital IST clock */}
            <div className="my-5 text-center bg-slate-950/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80">
              <div className="text-3xl sm:text-4xl font-mono font-black text-white tracking-widest">
                {format(currentTime, 'hh:mm:ss')}
                <span className="text-sm font-sans font-semibold text-teal-400 ml-2">
                  {format(currentTime, 'a')}
                </span>
              </div>
              <div className="flex items-center justify-center gap-3 mt-2 text-[11px] text-slate-300">
                <span>General Shift: 09:30 - 18:30</span>
                <span>•</span>
                <span className="text-teal-300 font-medium">Net: {calcLiveDuration()}</span>
              </div>
            </div>

            {/* Work Mode Selector (if not punched in yet) */}
            {!todayRecord?.check_in_time ? (
              <div className="mb-4">
                <label className="block text-[10px] font-bold text-teal-300 uppercase tracking-wider mb-1.5">
                  Select Work Location Mode
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setWorkMode(WORK_MODES.OFFICE); setLocationName('Bangalore HQ - Floor 4'); }}
                    className={`p-2 rounded-xl text-center text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                      workMode === WORK_MODES.OFFICE
                        ? 'bg-teal-600/30 border-teal-400 text-white shadow-xs'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>Office</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setWorkMode(WORK_MODES.WFH); setLocationName('Remote - Home Office'); }}
                    className={`p-2 rounded-xl text-center text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                      workMode === WORK_MODES.WFH
                        ? 'bg-teal-600/30 border-teal-400 text-white shadow-xs'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>WFH</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setWorkMode(WORK_MODES.ON_DUTY); setLocationName('Client On-Duty Site'); }}
                    className={`p-2 rounded-xl text-center text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                      workMode === WORK_MODES.ON_DUTY
                        ? 'bg-teal-600/30 border-teal-400 text-white shadow-xs'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>On-Duty</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Active Punch Info */
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 mb-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Punched In</span>
                  <p className="text-xs font-bold text-teal-300 mt-0.5 flex items-center gap-1">
                    {format(parseISO(todayRecord.check_in_time), 'hh:mm a')}
                    {todayRecord.is_late && (
                      <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Late
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Work Mode</span>
                  <p className="text-xs font-bold text-teal-300 mt-0.5 capitalize flex items-center gap-1">
                    {todayRecord.work_mode === WORK_MODES.WFH ? '🏠 WFH' : todayRecord.work_mode === WORK_MODES.ON_DUTY ? '💼 On-Duty' : '🏢 Office'}
                  </p>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Break Duration:</span>
                  <span className="font-semibold text-teal-300">
                    {(todayRecord.break_minutes || 0) + sessionBreakMinutes} mins logged
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {!todayRecord?.check_in_time ? (
              <Button
                variant="primary"
                size="lg"
                loading={actionLoading}
                onClick={handleCheckIn}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20"
                icon={Play}
              >
                Punch In ({WORK_MODE_LABELS[workMode]})
              </Button>
            ) : !todayRecord?.check_out_time ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleToggleBreak}
                  className={`font-semibold border-0 text-white ${
                    isOnBreak ? 'bg-amber-600 hover:bg-amber-700 animate-pulse' : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                  icon={Coffee}
                >
                  {isOnBreak ? 'Resume Work' : 'Take Break'}
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  size="md"
                  loading={actionLoading}
                  onClick={handleCheckOut}
                  className="bg-rose-500 hover:bg-rose-600 font-bold shadow-md shadow-rose-500/20"
                  icon={Square}
                >
                  Punch Out
                </Button>
              </div>
            ) : (
              <div className="p-3 text-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                ✓ Shift completed • Total Work: {calcDurationFormatted(todayRecord.check_in_time, todayRecord.check_out_time, todayRecord.break_minutes)}
              </div>
            )}
          </div>
        </Card>

        {/* 3 Metric Cards & Policy Summary */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Present Days"
            value={presentDays.toString()}
            subtitle={`${halfDays} Half-day sessions logged`}
            icon={CheckCircle}
            color="emerald"
          />
          <StatCard
            title="Late Check-Ins"
            value={lateMarks.toString()}
            subtitle="Past 09:45 AM threshold"
            icon={AlertTriangle}
            color={lateMarks > 2 ? 'amber' : 'teal'}
          />
          <StatCard
            title="Remote / WFH Days"
            value={wfhDays.toString()}
            subtitle="Approved hybrid logs"
            icon={Laptop}
            color="blue"
          />

          {/* Upcoming Indian Holidays Preview Banner */}
          <div className="sm:col-span-3">
            <Card className="p-4 bg-gradient-to-r from-teal-50/70 via-indigo-50/40 to-purple-50/50 border-teal-200/70">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-teal-600 text-white">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Upcoming Gazetted & Festive Indian Holidays
                  </h4>
                </div>
                <span className="text-[11px] text-teal-800 font-semibold">National Calendar 2026</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {upcomingHolidays.map((h) => (
                  <div key={h.date} className="p-3 rounded-xl bg-white border border-teal-100 shadow-2xs flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{h.name}</p>
                      <p className="text-[10px] text-slate-500">{format(parseISO(h.date), 'EEEE, dd MMMM')}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      h.isNational ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'
                    }`}>
                      {h.isNational ? 'National' : 'Public'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Tab Controller: Calendar Matrix vs Detailed Log History vs Regularization */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'calendar'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Monthly Attendance Matrix
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Detailed Timesheet Logs ({attendanceRecords.length})
          </button>

          <button
            onClick={() => setActiveTab('regularizations')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'regularizations'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            Regularization Requests ({regularizations.length})
          </button>
        </div>
      </div>

      {/* TAB 1: Monthly Attendance Matrix (Indian Calendar Standard) */}
      {activeTab === 'calendar' && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {format(currentMonthDate, 'MMMM yyyy')} Attendance & Holiday Roster
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Indian Standard Workweek (Mon–Fri working, Sat–Sun weekly off, Gazetted Indian Holidays)
              </p>
            </div>

            {/* Legend indicators */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Half-Day / Late</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Leave</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Gazetted Holiday</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Weekend Off</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            {/* Days Header: Mon to Sun (Indian Standard) */}
            <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center py-2.5 text-xs font-bold text-slate-700">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span className="text-slate-400">Sat</span>
              <span className="text-slate-400">Sun</span>
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-white">
              {/* Empty leading days */}
              {Array.from({ length: startDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[90px] bg-slate-50/50 p-2" />
              ))}

              {daysInMonth.map((dayObj) => {
                const dateStr = format(dayObj, 'yyyy-MM-dd');
                const isWknd = isWeekend(dayObj);
                const holiday = getIndianHoliday(dateStr);
                const record = attendanceRecords.find(a => a.date === dateStr);
                const isToday = dateStr === todayStr;

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDayDetails({ date: dateStr, holiday, record })}
                    className={`min-h-[95px] p-2.5 transition-all cursor-pointer hover:bg-teal-50/40 relative flex flex-col justify-between ${
                      isToday ? 'bg-teal-50/60 ring-2 ring-teal-500 ring-inset' : isWknd ? 'bg-slate-50/60' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${
                        isToday ? 'px-1.5 py-0.5 rounded bg-teal-600 text-white' : isWknd ? 'text-slate-400' : 'text-slate-800'
                      }`}>
                        {format(dayObj, 'd')}
                      </span>

                      {holiday && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-purple-100 text-purple-800 border border-purple-200 truncate max-w-[65px]" title={holiday.name}>
                          Holiday
                        </span>
                      )}
                    </div>

                    {/* Status Content */}
                    <div className="mt-1">
                      {holiday ? (
                        <div className="text-[10px] font-bold text-purple-700 leading-tight truncate">
                          {holiday.name}
                        </div>
                      ) : record ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              record.status === 'present' ? 'bg-emerald-500' : record.status === 'half-day' ? 'bg-amber-500' : 'bg-blue-500'
                            }`} />
                            <span className="text-[11px] font-bold text-slate-800 capitalize">
                              {record.status}
                            </span>
                          </div>
                          {record.check_in_time && (
                            <p className="text-[9px] text-slate-500 font-mono">
                              {format(parseISO(record.check_in_time), 'hh:mm')} - {record.check_out_time ? format(parseISO(record.check_out_time), 'hh:mm') : 'Active'}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[9px] font-semibold text-slate-600 uppercase bg-slate-100 px-1 rounded">
                              {record.work_mode || 'Office'}
                            </span>
                            {record.is_late && (
                              <span className="text-[8px] font-bold text-amber-700 bg-amber-100 px-1 rounded">
                                Late
                              </span>
                            )}
                          </div>
                        </div>
                      ) : isWknd ? (
                        <span className="text-[10px] text-slate-400 font-medium">Weekly Off</span>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">No log</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* TAB 2: Detailed Table View */}
      {activeTab === 'logs' && (
        <Card>
          <CardHeader
            title="Detailed Attendance History"
            subtitle={`Showing all recorded shifts, punch timestamps, and work locations`}
          />

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading records...
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No attendance records found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Work Mode</TableHead>
                  <TableHead>Check-In (IST)</TableHead>
                  <TableHead>Check-Out (IST)</TableHead>
                  <TableHead>Break Logged</TableHead>
                  <TableHead>Net Hours</TableHead>
                  <TableHead>Compliance & Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-semibold text-slate-900">
                      {record.date === todayStr ? (
                        <span className="flex items-center gap-1.5">
                          {record.date} <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-100 text-teal-800">TODAY</span>
                        </span>
                      ) : record.date}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 capitalize flex items-center gap-1 w-fit">
                        {record.work_mode === WORK_MODES.WFH ? <Laptop className="w-3 h-3 text-blue-600" /> : <Building className="w-3 h-3 text-teal-600" />}
                        {record.work_mode === WORK_MODES.WFH ? 'Work From Home' : record.work_mode === WORK_MODES.ON_DUTY ? 'Client On-Duty' : 'Office'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {record.check_in_time ? (
                        <span className="font-mono">
                          {format(parseISO(record.check_in_time), 'hh:mm:ss a')}
                          {record.is_late && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                              Late In
                            </span>
                          )}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {record.check_out_time ? (
                        <span className="font-mono">{format(parseISO(record.check_out_time), 'hh:mm:ss a')}</span>
                      ) : record.check_in_time ? (
                        <span className="text-teal-600 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" /> In-Progress
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-600">
                      {record.break_minutes ? `${record.break_minutes} mins` : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-slate-800">
                      {calcDurationFormatted(record.check_in_time, record.check_out_time, record.break_minutes)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.status}>{record.status}</Badge>
                      {record.regularization_id && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          Regularized
                        </span>
                      )}
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
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">My Attendance Regularization Requests</h3>
              <p className="text-xs text-slate-500">Missed punch adjustments & biometric error correction requests</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={FileCheck2}
              onClick={() => setIsRegModalOpen(true)}
            >
              New Request
            </Button>
          </div>

          {regularizations.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No regularization requests submitted.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Requested Timings</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>HR Review Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regularizations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-bold text-slate-900 text-xs">{r.date}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-700">
                      {r.requested_check_in} — {r.requested_check_out}
                    </TableCell>
                    <TableCell className="text-xs font-semibold capitalize text-slate-800">
                      {r.reason?.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-xs truncate" title={r.remarks}>
                      {r.remarks || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.admin_comments ? (
                        <span className="text-teal-800 font-medium bg-teal-50 px-2 py-1 rounded-lg border border-teal-100">
                          {r.admin_comments}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Pending review</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Regularization Submission Modal */}
      <Modal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        title="Apply for Attendance Regularization"
        subtitle="Submit missed punch or biometric adjustment for manager / HR review"
      >
        <form onSubmit={handleRegSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Attendance Date *
            </label>
            <input
              type="date"
              required
              value={regForm.date}
              onChange={(e) => setRegForm({ ...regForm, date: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Requested Check-In (IST) *
              </label>
              <input
                type="time"
                required
                value={regForm.requestedCheckIn}
                onChange={(e) => setRegForm({ ...regForm, requestedCheckIn: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Requested Check-Out (IST) *
              </label>
              <input
                type="time"
                required
                value={regForm.requestedCheckOut}
                onChange={(e) => setRegForm({ ...regForm, requestedCheckOut: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason Category *
            </label>
            <select
              value={regForm.reason}
              onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all"
            >
              {REGULARIZATION_REASONS.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Detailed Reason / Remarks *
            </label>
            <textarea
              required
              rows={3}
              value={regForm.remarks}
              onChange={(e) => setRegForm({ ...regForm, remarks: e.target.value })}
              placeholder="Explain reason for missed punch / time correction..."
              className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all"
            />
          </div>

          <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-xs text-teal-800 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-teal-600" />
            <span>
              Regularization requests are audited according to Indian IT / Corporate Labor Compliance. Once approved, the attendance record is marked as Present.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsRegModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={actionLoading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Submit for Approval
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
