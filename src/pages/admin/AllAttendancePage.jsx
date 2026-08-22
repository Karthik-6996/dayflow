// src/pages/admin/AllAttendancePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceService } from '../../services/attendanceService';
import { mockUsers } from '../../mocks/users';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import {
  ClipboardList,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building,
  User,
  Search,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Square,
  Coffee,
  Laptop,
  Briefcase,
  Layers,
  CalendarDays,
  Sparkles,
  FileCheck2
} from 'lucide-react';
import { format, parseISO, addDays, subDays, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';
import { WORK_MODES, WORK_MODE_LABELS } from '../../lib/constants';
import { getIndianHoliday } from '../../lib/indianHolidays';
import { GoogleWorkspaceCalendar } from '../../components/calendar/GoogleWorkspaceCalendar';

export const AllAttendancePage = () => {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState([]);
  const [allAttendanceData, setAllAttendanceData] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('2026-08-22');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'roster' | 'regularizations'
  const [selectedEmployeeForCalendar, setSelectedEmployeeForCalendar] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Admin's own punch console state
  const [adminTodayRecord, setAdminTodayRecord] = useState(null);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = format(currentTime, 'yyyy-MM-dd');

  // Load Admin Punch State & All Records
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load Admin's own attendance
      if (currentUser) {
        const { data: adminAtt } = await attendanceService.getEmployeeAttendance(currentUser.id, {
          startDate: '2026-08-01',
          endDate: '2026-08-31'
        });
        const todayRec = (adminAtt || []).find(r => r.date === todayStr);
        setAdminTodayRecord(todayRec || null);
      }

      // 2. Load Daily Roster
      const { data: dailyData } = await attendanceService.getAllAttendance({
        dateFilter: selectedDate,
        departmentFilter: selectedDepartment,
        statusFilter: statusFilter
      });
      setRecords(dailyData || []);

      // 3. Load all monthly attendance for Calendar Matrix
      const { data: fullMonthData } = await attendanceService.getAllAttendance({
        startDate: '2026-08-01',
        endDate: '2026-08-31'
      });
      setAllAttendanceData(fullMonthData || []);

      // 4. Load Regularization Requests
      const { data: regData } = await attendanceService.getRegularizationRequests();
      setRegularizations(regData || []);
    } catch (e) {
      console.warn("Failed to load admin attendance data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedDepartment, statusFilter, currentUser]);

  // Admin Punch Handlers
  const handleAdminCheckIn = async () => {
    if (!currentUser) return;
    setActionLoading(true);
    try {
      const { error } = await attendanceService.checkIn(currentUser.id, {
        workMode: WORK_MODES.OFFICE,
        location: 'Bangalore HQ - Admin Suite'
      });
      if (error) {
        toast.error(error);
      } else {
        const nextNum = (adminTodayRecord?.punches?.length || 0) + 1;
        toast.success(`Admin Punched In for Session #${nextNum}`);
        setIsOnBreak(false);
        await loadData();
      }
    } catch (e) {
      toast.error(e?.message || "Failed to punch in");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminCheckOut = async () => {
    setActionLoading(true);
    try {
      const { error } = await attendanceService.checkOut(adminTodayRecord?.id, {
        userId: currentUser?.id
      });
      if (error) {
        toast.error(error);
      } else {
        toast.success("Admin Punched Out successfully! Session logged.");
        setIsOnBreak(false);
        await loadData();
      }
    } catch (e) {
      toast.error(e?.message || "Failed to punch out");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminReset = async () => {
    if (!currentUser) return;
    setActionLoading(true);
    try {
      await attendanceService.resetTodayAttendance(currentUser.id);
      toast.success("Admin attendance reset for today.");
      await loadData();
    } finally {
      setActionLoading(false);
    }
  };

  // Regularization Actions
  const handleReviewReg = async (regId, status) => {
    try {
      const { error } = await attendanceService.reviewRegularization(regId, status, `Reviewed by ${currentUser?.name || 'Administrator'}`);
      if (error) {
        toast.error(error);
      } else {
        toast.success(`Regularization request ${status === 'approved' ? 'approved' : 'rejected'}`);
        await loadData();
      }
    } catch (e) {
      toast.error("Failed to review regularization request");
    }
  };

  // State checks for admin console
  const isAdminCheckedIn = !!adminTodayRecord?.check_in_time && !adminTodayRecord?.check_out_time;
  const adminHasPunchedToday = !!adminTodayRecord?.check_in_time || (adminTodayRecord?.punches && adminTodayRecord.punches.length > 0);
  const adminNextSessionNumber = isAdminCheckedIn ? (adminTodayRecord?.punches?.length || 1) : ((adminTodayRecord?.punches?.length || 0) + 1);

  // Calendar Records filtering
  const calendarFilteredRecords = selectedEmployeeForCalendar === 'all'
    ? allAttendanceData
    : allAttendanceData.filter(r => r.user_id === selectedEmployeeForCalendar);

  // Roster filtering
  const filteredRecords = records.filter(r => {
    const name = r.users?.name || '';
    const id = r.users?.employee_id || '';
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || id.toLowerCase().includes(q);
  });

  const presentCount = records.filter(r => r.status === 'present').length;
  const absentCount = records.filter(r => r.status === 'absent' || r.status === 'leave').length;
  const lateCount = records.filter(r => r.is_late).length;

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Attendance Operations Center</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Admin & Enterprise Matrix
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time daily punch console, Google Workspace calendar roster, and shift management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAdminReset}
            disabled={actionLoading}
            className="text-xs text-zinc-500 hover:text-purple-600 dark:hover:text-purple-400 font-semibold transition cursor-pointer flex items-center gap-1"
            title="Reset Admin Today's Session"
          >
            ↻ Reset Admin Today
          </button>
        </div>
      </div>

      {/* ── Admin's Daily Punch Console ── */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isAdminCheckedIn ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Administrator Daily Punch Console
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isAdminCheckedIn
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}>
                  {isAdminCheckedIn ? `SESSION #${adminNextSessionNumber} ACTIVE` : adminHasPunchedToday ? 'PUNCHED OUT' : 'NOT PUNCHED IN'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Standard General Shift (09:30 – 18:30 IST) • Multi-Punch & Work Mode Enabled
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
              {format(currentTime, 'hh:mm:ss a')}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {format(currentTime, 'EEEE, dd MMMM yyyy')}
            </div>
          </div>
        </div>

        {/* Action Buttons & Status */}
        <div className="mt-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Shift Status & Daily Tracking
              </span>
            </div>

            {/* Status chip */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Status:</span>
              {isAdminCheckedIn ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active (Session #{adminNextSessionNumber})
                </span>
              ) : adminHasPunchedToday ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                  Punched Out ({adminTodayRecord?.punches?.length || 1} Sessions)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  Pending Check-In
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {!isAdminCheckedIn ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleAdminCheckIn}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-current" />
                {adminHasPunchedToday ? `Punch In (Session #${adminNextSessionNumber})` : 'Punch In'}
              </button>
            ) : (
              <div className="py-3 px-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                In: {format(parseISO(adminTodayRecord.check_in_time), 'hh:mm a')}
              </div>
            )}

            {/* Break / Pause */}
            <div className="py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2">
              <Coffee className="w-4 h-4" />
              Break: {adminTodayRecord?.break_minutes || 0}m
            </div>

            {/* Punch Out */}
            {isAdminCheckedIn ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleAdminCheckOut}
                className="py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-md shadow-rose-600/20 active:scale-[0.98]"
              >
                <Square className="w-4 h-4 fill-current" />
                Punch Out (Session #{adminNextSessionNumber})
              </button>
            ) : (
              <div className="py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-zinc-500 dark:text-zinc-400 font-medium text-xs sm:text-sm flex items-center justify-center gap-2">
                <Square className="w-4 h-4" />
                {adminHasPunchedToday ? `Out (${format(parseISO(adminTodayRecord.check_out_time || new Date().toISOString()), 'hh:mm a')})` : 'Punch Out'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Admin Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'calendar'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Google Workspace Calendar Matrix
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'roster'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Daily Staff Roster ({records.length})
        </button>

        <button
          onClick={() => setActiveTab('regularizations')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'regularizations'
              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Regularization Requests</span>
          {regularizations.filter(r => r.status === 'pending').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
              {regularizations.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB 1: Google Workspace Calendar View (Admin) ── */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {/* Employee Filter for Calendar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Filter Calendar by Employee:
              </span>
              <select
                value={selectedEmployeeForCalendar}
                onChange={(e) => setSelectedEmployeeForCalendar(e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="all">Company-Wide (All Employees Roster)</option>
                {mockUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.employee_id} • {u.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-zinc-500 font-medium">
              Showing past, present, and future attendance records & Indian public holidays
            </div>
          </div>

          <GoogleWorkspaceCalendar
            records={calendarFilteredRecords}
            isAdmin={true}
          />
        </div>
      )}

      {/* ── TAB 2: Daily Staff Roster Table ── */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          {/* Daily Navigator & Summary Cards */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 shadow-xs">
              <button
                onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold bg-transparent text-zinc-900 dark:text-white outline-none cursor-pointer"
              />
              <button
                onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 outline-none"
              >
                <option value="all">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Design">Design</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="leave">On Leave</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Present On Date"
              value={presentCount}
              subtitle={`Checked in on ${selectedDate}`}
              icon={CheckCircle2}
            />
            <StatCard
              title="Late Check-Ins"
              value={lateCount}
              subtitle="After 09:45 AM cutoff"
              icon={AlertTriangle}
            />
            <StatCard
              title="Absences & Leaves"
              value={absentCount}
              subtitle="Non-present employees"
              icon={Clock}
            />
          </div>

          <Card>
            <div className="pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name or employee ID..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-zinc-400 text-xs">Loading roster...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs">No records found for this filter.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Work Mode</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Work Hours</TableHead>
                    <TableHead>Punctuality</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((r) => {
                    const checkIn = r.check_in_time ? format(parseISO(r.check_in_time), 'hh:mm a') : '—';
                    const checkOut = r.check_out_time ? format(parseISO(r.check_out_time), 'hh:mm a') : r.check_in_time ? 'In-Progress' : '—';
                    
                    let workHours = '—';
                    if (r.check_in_time && r.check_out_time) {
                      const gross = Math.max(0, differenceInMinutes(parseISO(r.check_out_time), parseISO(r.check_in_time)));
                      const net = Math.max(0, gross - (r.break_minutes || 0));
                      const h = Math.floor(net / 60);
                      const m = Math.round(net % 60);
                      workHours = `${h}h ${m}m`;
                    }

                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <p className="font-bold text-zinc-900 dark:text-white text-xs">{r.users?.name || 'Staff'}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{r.users?.employee_id || r.user_id}</p>
                        </TableCell>
                        <TableCell className="text-xs uppercase font-semibold text-zinc-700 dark:text-zinc-300">
                          {r.work_mode || 'office'}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-zinc-800 dark:text-zinc-200">{checkIn}</TableCell>
                        <TableCell className="text-xs font-mono text-zinc-800 dark:text-zinc-200">{checkOut}</TableCell>
                        <TableCell className="text-xs font-mono font-bold text-zinc-900 dark:text-white">{workHours}</TableCell>
                        <TableCell>
                          {r.is_late ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                              Late Arrival
                            </span>
                          ) : r.check_in_time ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                              On-Time
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.status}>{r.status}</Badge>
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

      {/* ── TAB 3: Regularization Approvals ── */}
      {activeTab === 'regularizations' && (
        <Card>
          <CardHeader
            title="Attendance Regularization Requests"
            subtitle="Review employee missed punch and on-duty regularization applications"
          />

          {regularizations.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              No regularization requests pending review.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Proposed Punch</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regularizations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell>
                      <p className="font-bold text-zinc-900 dark:text-white text-xs">{reg.users?.name || 'Staff'}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{reg.users?.employee_id || reg.user_id}</p>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{reg.target_date || reg.date}</TableCell>
                    <TableCell className="text-xs font-mono">
                      {reg.proposed_check_in || '09:30'} – {reg.proposed_check_out || '18:30'}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                      {reg.reason || 'Missed Punch'}
                    </TableCell>
                    <TableCell>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        reg.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : reg.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {reg.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {reg.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleReviewReg(reg.id, 'approved')}
                            className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewReg(reg.id, 'rejected')}
                            className="px-2.5 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-rose-600 hover:text-white text-zinc-700 dark:text-zinc-300 text-xs font-semibold cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400">Processed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
};

