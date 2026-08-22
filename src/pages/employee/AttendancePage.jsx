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

export const AttendancePage = () => {
  const { currentUser } = useAuth();
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
        toast.success(`Punched In successfully (${WORK_MODE_LABELS[workMode]})!`);
        await loadData();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    setActionLoading(true);
    try {
      const { error } = await attendanceService.checkOut(todayRecord.id, {
        breakMinutes: sessionBreakMinutes
      });
      if (error) {
        toast.error(error);
      } else {
        toast.success("Punched Out successfully! Shift completed.");
        setIsOnBreak(false);
        await loadData();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBreak = async () => {
    if (!todayRecord) return;
    if (!isOnBreak) {
      setIsOnBreak(true);
      toast.info("Break started (Timer paused)");
    } else {
      setIsOnBreak(false);
      const addedBreak = 15;
      setSessionBreakMinutes(prev => prev + addedBreak);
      await attendanceService.recordBreak(todayRecord.id, addedBreak);
      toast.success("Resumed work! Break logged.");
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

  // Helper calculation for duration
  const calcDurationFormatted = (inTime, outTime, breaks = 0) => {
    if (!inTime) return '—';
    const end = outTime ? parseISO(outTime) : currentTime;
    const grossMinutes = differenceInMinutes(end, parseISO(inTime));
    const netMinutes = Math.max(0, grossMinutes - (breaks || 0));
    const h = Math.floor(netMinutes / 60);
    const m = netMinutes % 60;
    return `${h}h ${m}m`;
  };

  // Calendar calculations for August 2026
  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(currentMonthDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOffset = (getDay(monthStart) + 6) % 7; // Align Mon=0

  const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
  const lateDays = attendanceRecords.filter(r => r.is_late).length;
  const wfhDays = attendanceRecords.filter(r => r.work_mode === WORK_MODES.WFH).length;

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100">
      {/* Top Banner with Clock & Live Punch Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Punch In/Out Card */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Daily Punch Console</h2>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Standard General Shift (09:30 – 18:30 IST) • 15m Grace Time
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
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Work Mode:</span>
                <div className="inline-flex rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <button
                    type="button"
                    disabled={!!todayRecord?.check_in_time}
                    onClick={() => setWorkMode(WORK_MODES.OFFICE)}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      workMode === WORK_MODES.OFFICE
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" /> Office
                  </button>
                  <button
                    type="button"
                    disabled={!!todayRecord?.check_in_time}
                    onClick={() => setWorkMode(WORK_MODES.WFH)}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      workMode === WORK_MODES.WFH
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" /> WFH
                  </button>
                  <button
                    type="button"
                    disabled={!!todayRecord?.check_in_time}
                    onClick={() => setWorkMode(WORK_MODES.CLIENT_SITE)}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      workMode === WORK_MODES.CLIENT_SITE
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" /> Client
                  </button>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Status:</span>
                {todayRecord ? (
                  <Badge variant={todayRecord.status}>{todayRecord.status}</Badge>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                    Not Punched In
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* Check In Button */}
              <button
                type="button"
                disabled={actionLoading || !!todayRecord?.check_in_time}
                onClick={handleCheckIn}
                className="py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs transition disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Play className="w-4 h-4" />
                {todayRecord?.check_in_time ? `Punched In (${format(parseISO(todayRecord.check_in_time), 'hh:mm a')})` : 'Punch In'}
              </button>

              {/* Break Button */}
              <button
                type="button"
                disabled={actionLoading || !todayRecord?.check_in_time || !!todayRecord?.check_out_time}
                onClick={handleToggleBreak}
                className={`py-3 px-4 rounded-xl font-semibold text-xs transition border cursor-pointer flex items-center justify-center gap-2 ${
                  isOnBreak
                    ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                } disabled:opacity-40`}
              >
                <Coffee className="w-4 h-4" />
                {isOnBreak ? 'Resume Work' : 'Take Break'}
              </button>

              {/* Check Out Button */}
              <button
                type="button"
                disabled={actionLoading || !todayRecord?.check_in_time || !!todayRecord?.check_out_time}
                onClick={handleCheckOut}
                className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Square className="w-4 h-4" />
                {todayRecord?.check_out_time ? `Punched Out (${format(parseISO(todayRecord.check_out_time), 'hh:mm a')})` : 'Punch Out'}
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
                  {todayRecord?.check_in_time
                    ? calcDurationFormatted(todayRecord.check_in_time, todayRecord.check_out_time, sessionBreakMinutes)
                    : '0h 0m'}
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
                  {todayRecord?.is_late ? 'Late Arrival' : todayRecord?.check_in_time ? 'On Time (09:30)' : 'Pending Punch'}
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

      {/* TAB 1: Monthly Attendance Matrix Calendar */}
      {activeTab === 'calendar' && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {format(currentMonthDate, 'MMMM yyyy')} Attendance & Holiday Roster
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Mon–Fri working days, Sat–Sun weekly off, and scheduled holidays
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Present</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Half-Day/Late</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Leave</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" /> Off</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-7 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-center py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span className="text-zinc-400">Sat</span>
              <span className="text-zinc-400">Sun</span>
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
              {Array.from({ length: startDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[85px] bg-zinc-50/50 dark:bg-zinc-950/30 p-2" />
              ))}

              {daysInMonth.map((dayObj) => {
                const dateStr = format(dayObj, 'yyyy-MM-dd');
                const isWknd = isWeekend(dayObj);
                const holiday = getIndianHoliday(dateStr);
                const record = attendanceRecords.find(a => a.date === dateStr);
                const isToday = dateStr === todayStr;
                const isFutureDate = dateStr > todayStr;

                return (
                  <div
                    key={dateStr}
                    className={`min-h-[85px] p-2 transition-all relative flex flex-col justify-between ${
                      isToday ? 'bg-zinc-100 dark:bg-zinc-800/80 font-bold' : isWknd ? 'bg-zinc-50/50 dark:bg-zinc-950/40' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${
                        isToday ? 'px-1.5 py-0.2 rounded bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : isWknd ? 'text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'
                      }`}>
                        {format(dayObj, 'd')}
                      </span>

                      {holiday && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 truncate max-w-[65px]" title={holiday.name}>
                          Holiday
                        </span>
                      )}
                    </div>

                    <div className="mt-1">
                      {holiday ? (
                        <div className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 leading-tight truncate">
                          {holiday.name}
                        </div>
                      ) : record ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              record.status === 'present' ? 'bg-emerald-500' : record.status === 'half-day' ? 'bg-amber-500' : 'bg-indigo-500'
                            }`} />
                            <span className="text-[10px] font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
                              {record.status}
                            </span>
                          </div>
                          {record.check_in_time && (
                            <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono">
                              {format(parseISO(record.check_in_time), 'hh:mm')}
                            </p>
                          )}
                        </div>
                      ) : isWknd ? (
                        <span className="text-[10px] text-zinc-400">Off</span>
                      ) : (
                        <span className="text-[10px] text-zinc-400 italic">No log</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
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
