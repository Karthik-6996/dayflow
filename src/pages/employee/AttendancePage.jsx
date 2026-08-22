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
  Building,
  CalendarDays,
  FileText,
  UserX,
  ChevronLeft,
  ChevronRight,
  Info,
  History,
  Sparkles,
  LayoutGrid,
  CalendarRange
} from 'lucide-react';
import { format, differenceInMinutes, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { toast } from 'sonner';
import { SHIFT_CONFIG } from '../../lib/constants';
import { getIndianHoliday, isWeekend, getPlannedHolidays } from '../../lib/indianHolidays';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const AttendancePage = () => {
  const { currentUser } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar', 'year-planner', 'history'
  const [currentTime, setCurrentTime] = useState(new Date());

  // Month & Year Navigation for Calendar & Annual Planner
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(7); // 0-indexed: 7 = August
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);

  const currentMonthDate = new Date(selectedYear, selectedMonth, 1);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAttendance = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const { data, error } = await attendanceService.getEmployeeAttendance(currentUser.id);
      if (error) toast.error("Error loading attendance records");
      setAttendanceRecords(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [currentUser]);

  // Today reference (August 22, 2026)
  const todayStr = '2026-08-22';
  const todayRecord = attendanceRecords.find(a => a.date === todayStr);

  const isCheckedIn = !!todayRecord?.check_in_time;
  const isCheckedOut = !!todayRecord?.check_out_time;

  // Handle Check-in
  const handleCheckIn = async () => {
    if (isCheckedIn) {
      toast.warning("You are already checked in for today!");
      return;
    }
    setActionLoading(true);
    try {
      const { error } = await attendanceService.checkIn(currentUser.id, {
        workMode: 'office',
        location: 'Main Office'
      });
      if (error) {
        toast.error(error);
      } else {
        toast.success("Checked in successfully for today!");
        await loadAttendance();
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Check-out
  const handleCheckOut = async () => {
    if (!isCheckedIn) {
      toast.error("You need to check in first before checking out.");
      return;
    }
    if (isCheckedOut) {
      toast.warning("You have already checked out for today!");
      return;
    }
    setActionLoading(true);
    try {
      const { error } = await attendanceService.checkOut(todayRecord.id);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Checked out successfully. Shift ended!");
        await loadAttendance();
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate total working hours
  const calcDuration = (checkIn, checkOut) => {
    if (!checkIn) return '—';
    const start = parseISO(checkIn);
    const end = checkOut ? parseISO(checkOut) : currentTime;
    const minutes = differenceInMinutes(end, start);
    if (minutes < 0) return '—';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins < 10 ? '0' : ''}${mins}m`;
  };

  // Navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleJumpToCurrent = () => {
    setSelectedYear(2026);
    setSelectedMonth(7); // August
  };

  // Monthly Attendance Summary Calculations (for current selected month & year)
  const currentMonthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const monthRecords = attendanceRecords.filter(r => r.date.startsWith(currentMonthStr));

  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(currentMonthDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOffset = (getDay(monthStart) + 6) % 7; // Mon = 0

  // Total working days in month (excluding weekends and gazetted holidays)
  const totalWorkingDays = daysInMonth.filter(d => {
    const dStr = format(d, 'yyyy-MM-dd');
    return !isWeekend(d) && !getIndianHoliday(dStr);
  }).length;

  const presentDays = monthRecords.filter(r => r.status === 'present').length;
  const halfDays = monthRecords.filter(r => r.status === 'half-day').length;
  const leaveDays = monthRecords.filter(r => r.status === 'leave').length;
  const absentDays = monthRecords.filter(r => r.status === 'absent').length;
  const lateCheckIns = monthRecords.filter(r => r.is_late).length;

  const isFutureMonth = currentMonthStr > '2026-08';
  const isPastMonth = currentMonthStr < '2026-08';

  // Planned holidays for the selected year
  const plannedHolidaysForYear = getPlannedHolidays(selectedYear);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance & Annual Calendar</h1>
          <p className="text-xs text-slate-500 mt-1">
            Personal attendance tracking, past timesheets & upcoming annual planned company calendar ({selectedYear})
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-xl shadow-xs self-start">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              viewMode === 'calendar' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Monthly Calendar
          </button>

          <button
            onClick={() => setViewMode('year-planner')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              viewMode === 'year-planner' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            {selectedYear} Annual Planner
          </button>

          <button
            onClick={() => setViewMode('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              viewMode === 'history' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Daily History Logs ({attendanceRecords.length})
          </button>
        </div>
      </div>

      {/* Live Punch Clock Widget & Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Punch Widget */}
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

            {/* Live digital clock */}
            <div className="my-5 text-center bg-slate-950/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80">
              <div className="text-3xl sm:text-4xl font-mono font-black text-white tracking-widest">
                {format(currentTime, 'hh:mm:ss')}
                <span className="text-sm font-sans font-semibold text-teal-400 ml-2">
                  {format(currentTime, 'a')}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2">
                Shift: {SHIFT_CONFIG.START_TIME} AM — {SHIFT_CONFIG.END_TIME} PM (Grace till 09:45 AM)
              </p>
            </div>

            {/* Today's Status Box */}
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 mb-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Check-In Time</span>
                <p className="text-xs font-bold text-teal-300 mt-0.5 flex items-center gap-1">
                  {todayRecord?.check_in_time ? format(parseISO(todayRecord.check_in_time), 'hh:mm a') : '—'}
                  {todayRecord?.is_late && (
                    <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Late
                    </span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Check-Out Time</span>
                <p className="text-xs font-bold text-teal-300 mt-0.5">
                  {todayRecord?.check_out_time ? format(parseISO(todayRecord.check_out_time), 'hh:mm a') : '—'}
                </p>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Today's Working Hours:</span>
                <span className="font-mono font-bold text-teal-300">
                  {calcDuration(todayRecord?.check_in_time, todayRecord?.check_out_time)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            {!isCheckedIn ? (
              <Button
                variant="primary"
                size="lg"
                loading={actionLoading}
                onClick={handleCheckIn}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20"
                icon={Play}
              >
                Punch In (Check-In)
              </Button>
            ) : !isCheckedOut ? (
              <Button
                variant="danger"
                size="lg"
                loading={actionLoading}
                onClick={handleCheckOut}
                className="w-full bg-rose-500 hover:bg-rose-600 font-bold shadow-lg shadow-rose-500/20"
                icon={Square}
              >
                Punch Out (End Shift)
              </Button>
            ) : (
              <div className="p-3 text-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                ✓ Shift Completed Today • Total: {calcDuration(todayRecord.check_in_time, todayRecord.check_out_time)}
              </div>
            )}
          </div>
        </Card>

        {/* Monthly Attendance Summary Metrics for Selected Month */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>{MONTH_NAMES[selectedMonth]} {selectedYear} Attendance Summary</span>
                {isFutureMonth && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                    Upcoming Month Planner
                  </span>
                )}
                {isPastMonth && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                    Archived Past Month
                  </span>
                )}
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Employee ID: <span className="font-mono font-bold text-slate-700">{currentUser?.employee_id || 'DF-1001'}</span>
            </span>
          </div>

          {/* 5 Standard Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard
              title="Total Working Days"
              value={`${totalWorkingDays} Days`}
              subtitle={`Planned corporate schedule`}
              icon={CalendarDays}
              color="purple"
            />
            <StatCard
              title="Present Days"
              value={`${presentDays} Days`}
              subtitle={isFutureMonth ? 'Scheduled days ahead' : 'Full-day presence'}
              icon={CheckCircle}
              color="emerald"
            />
            <StatCard
              title="Absent Days"
              value={`${absentDays} Days`}
              subtitle={isFutureMonth ? '0' : 'Unaccounted absence'}
              icon={UserX}
              color={absentDays > 0 ? 'rose' : 'teal'}
            />
            <StatCard
              title="Half Days"
              value={`${halfDays} Days`}
              subtitle="Partial shift logged"
              icon={Clock}
              color="amber"
            />
            <StatCard
              title="On Leave Days"
              value={`${leaveDays} Days`}
              subtitle="Approved leave time off"
              icon={FileText}
              color="blue"
            />
            <StatCard
              title="Late Check-Ins"
              value={`${lateCheckIns} Days`}
              subtitle="Past 09:45 AM threshold"
              icon={AlertTriangle}
              color={lateCheckIns > 1 ? 'amber' : 'teal'}
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: Full Monthly Attendance & Planned Calendar with Month/Year Navigation */}
      {viewMode === 'calendar' && (
        <Card className="p-6">
          {/* Month & Year Navigation Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg text-slate-700 hover:bg-white transition-all shadow-2xs"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5 px-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-transparent font-bold text-slate-800 text-sm focus:outline-none cursor-pointer py-1"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx}>{name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-transparent font-bold text-slate-800 text-sm focus:outline-none cursor-pointer py-1"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>

                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg text-slate-700 hover:bg-white transition-all shadow-2xs"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {(selectedYear !== 2026 || selectedMonth !== 7) && (
                <button
                  onClick={handleJumpToCurrent}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-all"
                >
                  Current Month
                </button>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Half-Day</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> On Leave</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Gazetted Holiday</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Weekend</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            {/* Days Header */}
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
              {Array.from({ length: startDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[90px] bg-slate-50/50 p-2" />
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
                              record.status === 'present' ? 'bg-emerald-500' : record.status === 'half-day' ? 'bg-amber-500' : record.status === 'absent' ? 'bg-rose-500' : 'bg-blue-500'
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
                          {record.is_late && (
                            <span className="text-[8px] font-bold text-amber-700 bg-amber-100 px-1 rounded inline-block">
                              Late In
                            </span>
                          )}
                        </div>
                      ) : isWknd ? (
                        <span className="text-[10px] text-slate-400 font-medium">Weekly Off</span>
                      ) : isFutureDate ? (
                        <span className="text-[10px] text-teal-600 font-medium">Scheduled Workday</span>
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

      {/* VIEW 2: 12-Month Annual Planned Calendar Grid */}
      {viewMode === 'year-planner' && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {selectedYear} Annual Planned Calendar Roster
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of all 12 months with planned corporate gazetted holidays, working days, and past attendance logs
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 focus:border-teal-500"
              >
                <option value={2025}>2025 Calendar</option>
                <option value={2026}>2026 Calendar</option>
                <option value={2027}>2027 Calendar (Planned)</option>
              </select>
            </div>
          </div>

          {/* 12 Months Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MONTH_NAMES.map((monthName, mIdx) => {
              const mDate = new Date(selectedYear, mIdx, 1);
              const mDays = eachDayOfInterval({ start: startOfMonth(mDate), end: endOfMonth(mDate) });
              const mPrefix = `${selectedYear}-${String(mIdx + 1).padStart(2, '0')}`;
              const mHolidays = plannedHolidaysForYear.filter(h => h.date.startsWith(mPrefix));
              const mRecords = attendanceRecords.filter(r => r.date.startsWith(mPrefix));
              const mWorkDays = mDays.filter(d => !isWeekend(d) && !getIndianHoliday(format(d, 'yyyy-MM-dd'))).length;
              const isSelected = selectedMonth === mIdx;

              return (
                <div
                  key={monthName}
                  onClick={() => {
                    setSelectedMonth(mIdx);
                    setViewMode('calendar');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md ${
                    isSelected ? 'bg-teal-50/60 border-teal-300 ring-2 ring-teal-500' : 'bg-white border-slate-200 hover:border-teal-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900 text-sm">{monthName}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {mWorkDays} Work Days
                      </span>
                    </div>

                    <div className="space-y-1.5 my-3">
                      {mHolidays.length > 0 ? (
                        mHolidays.map(h => (
                          <div key={h.date} className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-purple-50 border border-purple-100">
                            <span className="font-semibold text-purple-900 truncate max-w-[130px]">{h.name}</span>
                            <span className="text-[10px] font-bold text-purple-700">{format(parseISO(h.date), 'dd MMM')}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 italic py-1">No gazetted holidays</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">{mRecords.length} logs recorded</span>
                    <span className="font-bold text-teal-700 hover:underline">Open Month →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* VIEW 3: Daily Attendance History Table */}
      {viewMode === 'history' && (
        <Card>
          <CardHeader
            title="Daily Attendance History Logs"
            subtitle={`Showing all recorded attendance entries for ${currentUser?.name}`}
          />

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading attendance records...
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
                  <TableHead>Check-In Time</TableHead>
                  <TableHead>Check-Out Time</TableHead>
                  <TableHead>Total Working Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks / Notes</TableHead>
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
                      ) : record.check_in_time && record.date === todayStr ? (
                        <span className="text-teal-600 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" /> In-Progress
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-slate-800">
                      {calcDuration(record.check_in_time, record.check_out_time)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.status}>{record.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {record.remarks || record.location || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Date Details Modal */}
      {selectedDayDetails && (
        <Modal
          isOpen={!!selectedDayDetails}
          onClose={() => setSelectedDayDetails(null)}
          title={`Attendance Details — ${selectedDayDetails.date}`}
          subtitle="Record summary for selected date"
        >
          <div className="space-y-4">
            {selectedDayDetails.holiday ? (
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                <h4 className="font-bold text-purple-900 text-sm">{selectedDayDetails.holiday.name}</h4>
                <p className="text-xs text-purple-700 mt-1">{selectedDayDetails.holiday.description}</p>
                <span className="mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200 text-purple-800">
                  {selectedDayDetails.holiday.isNational ? 'National Holiday' : 'Gazetted Holiday'}
                </span>
              </div>
            ) : selectedDayDetails.record ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                    <div className="mt-0.5">
                      <Badge variant={selectedDayDetails.record.status}>{selectedDayDetails.record.status}</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Late Check-In</span>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      {selectedDayDetails.record.is_late ? 'Yes (Late Arrival)' : 'No (On Time)'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Check-In</span>
                    <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                      {selectedDayDetails.record.check_in_time ? format(parseISO(selectedDayDetails.record.check_in_time), 'hh:mm:ss a') : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Check-Out</span>
                    <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                      {selectedDayDetails.record.check_out_time ? format(parseISO(selectedDayDetails.record.check_out_time), 'hh:mm:ss a') : '—'}
                    </p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">Total Duration:</span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {calcDuration(selectedDayDetails.record.check_in_time, selectedDayDetails.record.check_out_time)}
                    </span>
                  </div>
                </div>
                {selectedDayDetails.record.remarks && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="font-bold text-slate-700">Remarks: </span>
                    <span className="text-slate-600">{selectedDayDetails.record.remarks}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-slate-500 text-xs">
                {selectedDayDetails.date > todayStr ? 'Scheduled corporate workday.' : 'No attendance recorded for this date.'}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setSelectedDayDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
