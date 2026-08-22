// src/components/calendar/GoogleWorkspaceCalendar.jsx
import React, { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  differenceInMinutes,
  setYear,
  setMonth,
  getYear,
  getMonth
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Building,
  Laptop,
  Briefcase,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Plane,
  Sparkles,
  Search,
  Filter,
  X,
  Plus,
  Layers,
  CalendarDays
} from 'lucide-react';
import { WORK_MODES, WORK_MODE_LABELS } from '../../lib/constants';
import { getIndianHoliday, isWeekend } from '../../lib/indianHolidays';

export const GoogleWorkspaceCalendar = ({
  records = [],
  onDateClick,
  onRequestRegularization,
  isAdmin = false,
  selectedUser = null
}) => {
  // Navigation & View State
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 22)); // August 2026
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'agenda'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'present' | 'wfh' | 'on_duty' | 'leave' | 'holiday'
  const [selectedDayEvent, setSelectedDayEvent] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Month & Year Selector options (2024 to 2030)
  const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Navigation Handlers
  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(prev => subMonths(prev, 1));
    else if (viewMode === 'week') setCurrentDate(prev => subWeeks(prev, 1));
    else setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(prev => addMonths(prev, 1));
    else if (viewMode === 'week') setCurrentDate(prev => addWeeks(prev, 1));
    else setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 7, 22));
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    setCurrentDate(prev => setYear(prev, newYear));
  };

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    setCurrentDate(prev => setMonth(prev, newMonth));
  };

  // Calendar Calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  // Mon-Sun grid: weekStartsOn: 1 (Monday)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allMonthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Week view calculation
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Helper to find record for a date string (yyyy-MM-dd)
  const getRecordForDate = (dateStr) => {
    return records.find(r => r.date === dateStr);
  };

  // Helper to open details modal
  const handleOpenDayDetail = (dayObj, record, holiday) => {
    setSelectedDayEvent({
      date: dayObj,
      dateStr: format(dayObj, 'yyyy-MM-dd'),
      record,
      holiday
    });
    setIsDetailModalOpen(true);
    if (onDateClick) {
      onDateClick(dayObj, record);
    }
  };

  // Filter verification
  const matchesFilter = (record, holiday) => {
    if (filterType === 'all') return true;
    if (filterType === 'holiday') return !!holiday;
    if (!record) return false;
    if (filterType === 'present') return record.status === 'present';
    if (filterType === 'wfh') return record.work_mode === WORK_MODES.WFH || record.work_mode === 'wfh';
    if (filterType === 'on_duty') return record.work_mode === WORK_MODES.ON_DUTY || record.work_mode === 'on_duty' || record.work_mode === 'client';
    if (filterType === 'leave') return record.status === 'leave';
    return true;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all">
      {/* ── 1. Google Workspace Style Top Bar ── */}
      <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm">
        {/* Left: Brand + Navigation controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-zinc-200 dark:border-zinc-800">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                Google Calendar
              </span>
              <span className="text-[10px] ml-1.5 font-medium px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Workspace 365
              </span>
            </div>
          </div>

          {/* Today Button */}
          <button
            type="button"
            onClick={handleToday}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer shadow-xs"
          >
            Today
          </button>

          {/* Chevrons */}
          <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5 shadow-xs">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Month & Year Title with Fast Selectors */}
          <div className="flex items-center gap-1.5">
            <select
              value={getMonth(currentDate)}
              onChange={handleMonthChange}
              className="font-bold text-sm md:text-base text-zinc-900 dark:text-white bg-transparent border-0 outline-none cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              {months.map((m, idx) => (
                <option key={m} value={idx} className="dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                  {m}
                </option>
              ))}
            </select>

            <select
              value={getYear(currentDate)}
              onChange={handleYearChange}
              className="font-bold text-sm md:text-base text-zinc-700 dark:text-zinc-300 bg-transparent border-0 outline-none cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              {years.map(y => (
                <option key={y} value={y} className="dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: View Switcher (Month / Week / Agenda) & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter Pill */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer shadow-xs"
          >
            <option value="all">All Events</option>
            <option value="present">Present (Office/WFH)</option>
            <option value="wfh">Work from Home</option>
            <option value="on_duty">Client On-Duty</option>
            <option value="leave">Leaves</option>
            <option value="holiday">Public Holidays</option>
          </select>

          {/* Google Calendar View Tabs */}
          <div className="inline-flex rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs rounded-md font-semibold transition cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs rounded-md font-semibold transition cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1 text-xs rounded-md font-semibold transition cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Schedule
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. VIEW MODE: MONTH MATRIX (Google Calendar 90% Layout) ── */}
      {viewMode === 'month' && (
        <div className="flex-1 flex flex-col">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 text-center py-2 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span className="text-zinc-400">Sat</span>
            <span className="text-zinc-400">Sun</span>
          </div>

          {/* Grid Cells (6 rows x 7 cols) */}
          <div className="grid grid-cols-7 divide-x divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900 min-h-[580px]">
            {allMonthDays.map((dayObj) => {
              const dateStr = format(dayObj, 'yyyy-MM-dd');
              const isCurrentMonth = isSameMonth(dayObj, currentDate);
              const isDayToday = isToday(dayObj);
              const isWknd = isWeekend(dayObj);
              const holiday = getIndianHoliday(dateStr);
              const record = getRecordForDate(dateStr);
              const hasEvents = matchesFilter(record, holiday);

              const punches = record?.punches || (record?.check_in_time ? [{ in: record.check_in_time, out: record.check_out_time, work_mode: record.work_mode }] : []);

              return (
                <div
                  key={dateStr}
                  onClick={() => handleOpenDayDetail(dayObj, record, holiday)}
                  className={`min-h-[105px] p-1.5 md:p-2 transition-all flex flex-col justify-between group cursor-pointer hover:bg-blue-50/40 dark:hover:bg-blue-950/20 relative ${
                    !isCurrentMonth
                      ? 'bg-zinc-50/40 dark:bg-zinc-950/30 opacity-40'
                      : isDayToday
                      ? 'bg-blue-50/20 dark:bg-blue-950/10'
                      : isWknd
                      ? 'bg-zinc-50/30 dark:bg-zinc-900/30'
                      : ''
                  }`}
                >
                  {/* Top Bar inside cell: Date number & indicators */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold ${
                        isDayToday
                          ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs'
                          : !isCurrentMonth
                          ? 'text-zinc-400 dark:text-zinc-600'
                          : isWknd
                          ? 'text-zinc-400'
                          : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {format(dayObj, 'd')}
                    </span>

                    {punches.length > 1 && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono font-bold" title={`${punches.length} Punch Sessions`}>
                        {punches.length}p
                      </span>
                    )}
                  </div>

                  {/* Event Chips Container (Google Calendar Style) */}
                  <div className="space-y-1 overflow-hidden flex-1">
                    {/* Holiday Chip */}
                    {holiday && hasEvents && (
                      <div
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1 truncate shadow-2xs"
                        title={`Holiday: ${holiday.name}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                        <span className="truncate">{holiday.name}</span>
                      </div>
                    )}

                    {/* Attendance / Shift Chip */}
                    {record && hasEvents && (
                      <div
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border flex items-center justify-between gap-1 shadow-2xs truncate ${
                          record.status === 'present' && (record.work_mode === WORK_MODES.WFH || record.work_mode === 'wfh')
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            : record.status === 'present' && (record.work_mode === WORK_MODES.ON_DUTY || record.work_mode === 'on_duty')
                            ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                            : record.status === 'present'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : record.status === 'half-day'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                        }`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              record.status === 'present' ? 'bg-emerald-500' : record.status === 'half-day' ? 'bg-amber-500' : 'bg-indigo-500'
                            }`}
                          />
                          <span className="truncate">
                            {record.check_in_time ? format(parseISO(record.check_in_time), 'hh:mm') : record.status}
                          </span>
                        </div>
                        <span className="text-[9px] uppercase font-bold opacity-75 shrink-0">
                          {record.work_mode === 'wfh' ? 'WFH' : record.work_mode === 'on_duty' ? 'OD' : 'Office'}
                        </span>
                      </div>
                    )}

                    {/* Leave Indicator */}
                    {record?.status === 'leave' && hasEvents && (
                      <div className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 truncate flex items-center gap-1">
                        <Plane className="w-2.5 h-2.5" /> Paid Leave
                      </div>
                    )}
                  </div>

                  {/* Subtle hover tooltip hint */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-zinc-400 text-right mt-1">
                    Details ↗
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 3. VIEW MODE: WEEK VIEW (Hourly Timeline Layout) ── */}
      {viewMode === 'week' && (
        <div className="p-4 overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Week Header */}
            <div className="grid grid-cols-7 gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800 text-center">
              {weekDays.map(dayObj => {
                const dateStr = format(dayObj, 'yyyy-MM-dd');
                const isDayToday = isToday(dayObj);
                const holiday = getIndianHoliday(dateStr);

                return (
                  <div key={dateStr} className={`p-2 rounded-xl border ${isDayToday ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800' : 'border-zinc-200 dark:border-zinc-800'}`}>
                    <div className="text-[11px] font-semibold text-zinc-500 uppercase">{format(dayObj, 'EEE')}</div>
                    <div className={`text-base font-bold ${isDayToday ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                      {format(dayObj, 'd MMM')}
                    </div>
                    {holiday && (
                      <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 block truncate">
                        {holiday.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Week Day Schedule Columns */}
            <div className="grid grid-cols-7 gap-2 pt-3">
              {weekDays.map(dayObj => {
                const dateStr = format(dayObj, 'yyyy-MM-dd');
                const record = getRecordForDate(dateStr);
                const holiday = getIndianHoliday(dateStr);
                const isWknd = isWeekend(dayObj);
                const punches = record?.punches || (record?.check_in_time ? [{ in: record.check_in_time, out: record.check_out_time, work_mode: record.work_mode }] : []);

                return (
                  <div
                    key={dateStr}
                    onClick={() => handleOpenDayDetail(dayObj, record, holiday)}
                    className="min-h-[360px] p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col justify-between hover:border-blue-400 transition cursor-pointer"
                  >
                    <div className="space-y-2">
                      {holiday && (
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-xs font-semibold">
                          🎉 {holiday.name}
                        </div>
                      )}

                      {record ? (
                        <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xs space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-white">
                            <span className="capitalize">{record.status}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 uppercase">
                              {record.work_mode || 'office'}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-600 dark:text-zinc-300 font-mono">
                            {record.check_in_time ? format(parseISO(record.check_in_time), 'hh:mm a') : '—'}
                            {' → '}
                            {record.check_out_time ? format(parseISO(record.check_out_time), 'hh:mm a') : 'Active'}
                          </div>
                          {punches.length > 1 && (
                            <div className="text-[10px] text-zinc-500 font-medium">
                              {punches.length} Sessions Logged
                            </div>
                          )}
                        </div>
                      ) : isWknd ? (
                        <div className="p-2 text-center text-xs text-zinc-400 font-medium">
                          Weekly Off
                        </div>
                      ) : (
                        <div className="p-2 text-center text-xs text-zinc-400 italic">
                          No Shift Logged
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="w-full py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline text-center"
                    >
                      View Day Breakdown
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. VIEW MODE: AGENDA / SCHEDULE VIEW ── */}
      {viewMode === 'agenda' && (
        <div className="p-5 divide-y divide-zinc-200 dark:divide-zinc-800">
          <div className="pb-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Chronological Schedule for {format(currentDate, 'MMMM yyyy')}
          </div>
          {allMonthDays.filter(d => isSameMonth(d, currentDate)).map(dayObj => {
            const dateStr = format(dayObj, 'yyyy-MM-dd');
            const record = getRecordForDate(dateStr);
            const holiday = getIndianHoliday(dateStr);
            const isWknd = isWeekend(dayObj);

            if (!record && !holiday && isWknd) return null;

            return (
              <div
                key={dateStr}
                onClick={() => handleOpenDayDetail(dayObj, record, holiday)}
                className="py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 px-2 rounded-lg cursor-pointer transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 text-center">
                    <span className="block text-xs font-semibold text-zinc-400 uppercase">{format(dayObj, 'EEE')}</span>
                    <span className="text-lg font-bold text-zinc-900 dark:text-white">{format(dayObj, 'd')}</span>
                  </div>

                  <div>
                    {holiday ? (
                      <span className="font-semibold text-xs text-purple-700 dark:text-purple-300">
                        🎉 {holiday.name} (Public Holiday)
                      </span>
                    ) : record ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                          Shift ({WORK_MODE_LABELS[record.work_mode] || record.work_mode || 'Office'})
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">
                          {record.check_in_time ? format(parseISO(record.check_in_time), 'hh:mm a') : '—'}
                          {record.check_out_time ? ` – ${format(parseISO(record.check_out_time), 'hh:mm a')}` : ' – Active'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">Regular Working Day (Pending Log)</span>
                    )}
                  </div>
                </div>

                <div>
                  {record ? (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                      record.status === 'present'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    }`}>
                      {record.status}
                    </span>
                  ) : holiday ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                      Holiday
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 5. GOOGLE CALENDAR STYLE DAY DETAILS POPOVER / MODAL ── */}
      {isDetailModalOpen && selectedDayEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    {format(selectedDayEvent.date, 'EEEE, dd MMMM yyyy')}
                  </h3>
                  <p className="text-xs text-zinc-500">Google Calendar Inspection View</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Details */}
            <div className="p-5 space-y-4 text-xs">
              {/* Holiday Info if any */}
              {selectedDayEvent.holiday && (
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300">
                  <div className="font-bold flex items-center gap-1.5">
                    🎉 {selectedDayEvent.holiday.name}
                  </div>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    Official Indian Statutory Holiday • Paid Off
                  </p>
                </div>
              )}

              {/* Attendance Record Info */}
              {selectedDayEvent.record ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold">Status</span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-white capitalize">
                        {selectedDayEvent.record.status}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold">Work Mode</span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-white capitalize">
                        {WORK_MODE_LABELS[selectedDayEvent.record.work_mode] || selectedDayEvent.record.work_mode || 'Office'}
                      </span>
                    </div>
                  </div>

                  {/* Punch Intervals */}
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Punch Timeline</span>
                    <div className="flex items-center justify-between font-mono">
                      <span>In: {selectedDayEvent.record.check_in_time ? format(parseISO(selectedDayEvent.record.check_in_time), 'hh:mm:ss a') : '—'}</span>
                      <span>Out: {selectedDayEvent.record.check_out_time ? format(parseISO(selectedDayEvent.record.check_out_time), 'hh:mm:ss a') : 'In Progress'}</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 pt-1 border-t border-zinc-200 dark:border-zinc-700 flex justify-between">
                      <span>Break Logged: {selectedDayEvent.record.break_minutes || 0} mins</span>
                      <span>Location: {selectedDayEvent.record.location || 'Bangalore HQ'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-zinc-400">
                  <p className="font-medium">No punches recorded for this date.</p>
                  <p className="text-[11px] mt-1">You can apply for attendance regularization if you were on duty.</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/40">
              {onRequestRegularization && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    onRequestRegularization(selectedDayEvent.dateStr);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs hover:opacity-90 transition cursor-pointer"
                >
                  Request Regularization
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
