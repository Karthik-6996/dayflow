// src/pages/admin/AllAttendancePage.jsx
import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { mockUsers } from '../../mocks/users';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import {
  ClipboardList,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Building,
  User,
  Edit3,
  Plus,
  Search,
  Check,
  X,
  CalendarDays,
  UserX,
  FileText,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  Sparkles,
  Settings
} from 'lucide-react';
import { format, parseISO, differenceInMinutes, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { toast } from 'sonner';
import { getIndianHoliday, isWeekend, getPlannedHolidays, savePlannedHoliday } from '../../lib/indianHolidays';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const AllAttendancePage = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'calendar', 'year-planner'
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for Daily List
  const [selectedDate, setSelectedDate] = useState('2026-08-22');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Calendar specific navigation states
  const [calendarEmployeeId, setCalendarEmployeeId] = useState('usr-001-emp');
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(7); // August = 7

  const calendarMonthDate = new Date(calendarYear, calendarMonth, 1);

  // Mark / Update Attendance Modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [manualForm, setManualForm] = useState({
    id: null,
    userId: 'usr-001-emp',
    date: '2026-08-22',
    checkInTime: '09:30',
    checkOutTime: '18:30',
    status: 'present',
    remarks: ''
  });
  const [savingManual, setSavingManual] = useState(false);

  // Configure Planned Holidays Modal (for upcoming year holiday planning e.g. in September)
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    date: '2027-01-01',
    name: '',
    type: 'gazetted',
    isNational: false,
    description: ''
  });

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const { data, error } = await attendanceService.getAllAttendance({
        dateFilter: selectedDate || undefined,
        statusFilter: statusFilter !== 'all' ? statusFilter : undefined,
        departmentFilter: selectedDepartment !== 'all' ? selectedDepartment : undefined,
        userId: selectedEmployeeId !== 'all' ? selectedEmployeeId : undefined
      });
      if (error) toast.error("Error loading team attendance records");
      setRecords(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedDate, selectedEmployeeId, selectedDepartment, statusFilter]);

  // Handle Mark / Update Attendance submit (with remarks)
  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    setSavingManual(true);
    try {
      const inISO = manualForm.checkInTime ? `${manualForm.date}T${manualForm.checkInTime}:00+05:30` : null;
      const outISO = manualForm.checkOutTime ? `${manualForm.date}T${manualForm.checkOutTime}:00+05:30` : null;

      let isLate = false;
      if (manualForm.checkInTime) {
        const [hrs, mins] = manualForm.checkInTime.split(':').map(Number);
        isLate = (hrs * 60 + mins) > (9 * 60 + 45);
      }

      await attendanceService.adminSaveAttendanceRecord({
        id: manualForm.id || undefined,
        user_id: manualForm.userId,
        date: manualForm.date,
        check_in_time: inISO,
        check_out_time: outISO,
        status: manualForm.status,
        is_late: isLate,
        remarks: manualForm.remarks || 'Manual entry by HR'
      });

      toast.success(isEditing ? "Attendance record updated successfully!" : "Attendance logged successfully!");
      setManualModalOpen(false);
      setIsEditing(false);
      await loadAttendance();
    } catch (err) {
      toast.error("Failed to save attendance record");
    } finally {
      setSavingManual(false);
    }
  };

  // Open Edit Modal for an existing record
  const handleOpenEdit = (record) => {
    setIsEditing(true);
    let checkIn = '09:30';
    let checkOut = '18:30';
    if (record.check_in_time) {
      checkIn = format(parseISO(record.check_in_time), 'HH:mm');
    }
    if (record.check_out_time) {
      checkOut = format(parseISO(record.check_out_time), 'HH:mm');
    }

    setManualForm({
      id: record.id,
      userId: record.user_id,
      date: record.date,
      checkInTime: checkIn,
      checkOutTime: checkOut,
      status: record.status,
      remarks: record.remarks || ''
    });
    setManualModalOpen(true);
  };

  // Open Create Modal for a specific date / employee from calendar
  const handleOpenCreateForDate = (dateStr, empId = calendarEmployeeId) => {
    setIsEditing(false);
    const existing = records.find(r => r.date === dateStr && r.user_id === empId);
    if (existing) {
      handleOpenEdit(existing);
      return;
    }

    setManualForm({
      id: null,
      userId: empId,
      date: dateStr,
      checkInTime: '09:30',
      checkOutTime: '18:30',
      status: 'present',
      remarks: ''
    });
    setManualModalOpen(true);
  };

  // Handle Planned Holiday Addition (Annual Planner)
  const handleSaveHoliday = (e) => {
    e.preventDefault();
    if (!holidayForm.name || !holidayForm.date) {
      toast.error("Please provide holiday name and date");
      return;
    }
    savePlannedHoliday(holidayForm);
    toast.success(`Planned Holiday "${holidayForm.name}" added to corporate calendar!`);
    setHolidayModalOpen(false);
    setHolidayForm({
      date: `${calendarYear}-01-01`,
      name: '',
      type: 'gazetted',
      isNational: false,
      description: ''
    });
  };

  // Calculate duration
  const calcDuration = (checkIn, checkOut) => {
    if (!checkIn) return '—';
    const start = parseISO(checkIn);
    const end = checkOut ? parseISO(checkOut) : new Date();
    const minutes = differenceInMinutes(end, start);
    if (minutes < 0) return '—';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins < 10 ? '0' : ''}${mins}m`;
  };

  // Export CSV
  const handleExportCSV = () => {
    if (records.length === 0) {
      toast.error("No records to export.");
      return;
    }

    const headers = [
      "Employee ID",
      "Employee Name",
      "Department",
      "Date",
      "Check-In Time",
      "Check-Out Time",
      "Working Hours",
      "Status",
      "Late Check-In",
      "Remarks"
    ];

    const rows = records.map(r => [
      `"${r.users?.employee_id || ''}"`,
      `"${r.users?.name || ''}"`,
      `"${r.users?.department || ''}"`,
      `"${r.date}"`,
      `"${r.check_in_time ? format(parseISO(r.check_in_time), 'hh:mm:ss a') : 'N/A'}"`,
      `"${r.check_out_time ? format(parseISO(r.check_out_time), 'hh:mm:ss a') : 'N/A'}"`,
      `"${calcDuration(r.check_in_time, r.check_out_time)}"`,
      `"${r.status}"`,
      `"${r.is_late ? 'YES' : 'NO'}"`,
      `"${r.remarks || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Dayflow_Attendance_${selectedDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${records.length} attendance rows to CSV.`);
  };

  // Filter records by search query
  const filteredRecords = records.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.users?.name?.toLowerCase().includes(q) ||
      r.users?.employee_id?.toLowerCase().includes(q) ||
      r.users?.department?.toLowerCase().includes(q)
    );
  });

  // Summary Metrics
  const presentCount = records.filter(r => r.status === 'present').length;
  const leaveCount = records.filter(r => r.status === 'leave').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  const halfDayCount = records.filter(r => r.status === 'half-day').length;
  const lateCount = records.filter(r => r.is_late).length;

  // Calendar calculations for selected employee
  const monthStart = startOfMonth(calendarMonthDate);
  const monthEnd = endOfMonth(calendarMonthDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOffset = (getDay(monthStart) + 6) % 7;

  // Selected calendar employee
  const calendarUser = mockUsers.find(u => u.id === calendarEmployeeId) || mockUsers[0];
  const plannedHolidaysForYear = getPlannedHolidays(calendarYear);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Attendance Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Admin & HR Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Multi-month attendance roster, annual corporate holiday planner, and manual attendance overrides
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <Button
            variant="outline"
            size="sm"
            icon={Sparkles}
            onClick={() => {
              setHolidayForm({
                date: `${calendarYear}-09-01`,
                name: '',
                type: 'gazetted',
                isNational: false,
                description: 'Annual corporate holiday update'
              });
              setHolidayModalOpen(true);
            }}
            className="border-purple-300 text-purple-800 hover:bg-purple-50 font-semibold"
          >
            Add Planned Holiday
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={() => {
              setIsEditing(false);
              setManualForm({
                id: null,
                userId: 'usr-001-emp',
                date: '2026-08-22',
                checkInTime: '09:30',
                checkOutTime: '18:30',
                status: 'present',
                remarks: ''
              });
              setManualModalOpen(true);
            }}
            className="border-slate-300 font-semibold"
          >
            Mark Attendance Manually
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
            className="bg-slate-900 text-white hover:bg-slate-800 font-semibold"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* 5 Standard Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          title="Total Logs"
          value={records.length.toString()}
          subtitle={`Filtered criteria count`}
          icon={ClipboardList}
          color="purple"
        />
        <StatCard
          title="Present Staff"
          value={presentCount.toString()}
          subtitle="Checked in full shift"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Absent Staff"
          value={absentCount.toString()}
          subtitle="Unexcused absence"
          icon={UserX}
          color={absentCount > 0 ? 'rose' : 'teal'}
        />
        <StatCard
          title="Half-Day / Partial"
          value={halfDayCount.toString()}
          subtitle="Partial shifts recorded"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="On Approved Leave"
          value={leaveCount.toString()}
          subtitle="Excused time off"
          icon={FileText}
          color="blue"
        />
      </div>

      {/* Tab Switcher: Daily List vs Admin/HR Calendar vs Annual Planner */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'list'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Daily Attendance List ({records.length})
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'calendar'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Admin Monthly Attendance Calendar
        </button>

        <button
          onClick={() => setActiveTab('year-planner')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'year-planner'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarRange className="w-3.5 h-3.5" />
          {calendarYear} Corporate Annual Planner ({plannedHolidaysForYear.length} Holidays)
        </button>
      </div>

      {/* TAB 1: Daily Attendance List with Multi-Filters */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <Card className="p-4 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Search Name / ID
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search employee..."
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Filter by Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Filter by Employee
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                >
                  <option value="all">All Employees</option>
                  {mockUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.employee_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Filter by Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                >
                  <option value="all">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Design & UX">Design & UX</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Attendance Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                >
                  <option value="all">All Statuses</option>
                  <option value="present">Present</option>
                  <option value="half-day">Half-Day</option>
                  <option value="absent">Absent</option>
                  <option value="leave">On Leave</option>
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title={`Attendance Logs (${selectedDate || 'All Dates'})`}
              subtitle={`Displaying ${filteredRecords.length} records matching criteria`}
            />

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading attendance records...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No attendance records found for the selected criteria.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Check-In Time</TableHead>
                    <TableHead>Check-Out Time</TableHead>
                    <TableHead>Working Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                            {r.users?.name?.slice(0, 2).toUpperCase() || 'EM'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 leading-tight">{r.users?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{r.users?.employee_id || 'DF-1000'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-medium">
                        {r.users?.department || 'General'}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800 text-xs">
                        {r.date}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {r.check_in_time ? (
                          <span>
                            {format(parseISO(r.check_in_time), 'hh:mm:ss a')}
                            {r.is_late && (
                              <span className="ml-1.5 px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                Late In
                              </span>
                            )}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {r.check_out_time ? (
                          format(parseISO(r.check_out_time), 'hh:mm:ss a')
                        ) : r.check_in_time ? (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> In-Shift
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-slate-800">
                        {calcDuration(r.check_in_time, r.check_out_time)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 max-w-[150px] truncate" title={r.remarks}>
                        {r.remarks || <span className="text-slate-400 italic">None</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-purple-100 hover:text-purple-800 transition-all inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: Admin/HR/Manager Attendance Calendar with Multi-Month Stepper */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {/* Calendar Control Bar */}
          <Card className="p-4 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Select Employee to Inspect Calendar
                </label>
                <select
                  value={calendarEmployeeId}
                  onChange={(e) => setCalendarEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-semibold"
                >
                  {mockUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.employee_id}) — {u.department}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Calendar Month & Year Navigation
                </label>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      if (calendarMonth === 0) {
                        setCalendarMonth(11);
                        setCalendarYear(prev => prev - 1);
                      } else {
                        setCalendarMonth(prev => prev - 1);
                      }
                    }}
                    className="p-1 rounded-lg text-slate-700 hover:bg-white transition-all"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1 px-1 flex-1 justify-center">
                    <select
                      value={calendarMonth}
                      onChange={(e) => setCalendarMonth(Number(e.target.value))}
                      className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
                    >
                      {MONTH_NAMES.map((name, idx) => (
                        <option key={name} value={idx}>{name}</option>
                      ))}
                    </select>

                    <select
                      value={calendarYear}
                      onChange={(e) => setCalendarYear(Number(e.target.value))}
                      className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                      <option value={2027}>2027</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      if (calendarMonth === 11) {
                        setCalendarMonth(0);
                        setCalendarYear(prev => prev + 1);
                      } else {
                        setCalendarMonth(prev => prev + 1);
                      }
                    }}
                    className="p-1 rounded-lg text-slate-700 hover:bg-white transition-all"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  variant="primary"
                  size="md"
                  icon={Plus}
                  onClick={() => handleOpenCreateForDate(`${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-15`, calendarEmployeeId)}
                  className="w-full bg-purple-700 hover:bg-purple-800"
                >
                  Mark / Update for {calendarUser.name.split(' ')[0]}
                </Button>
              </div>
            </div>
          </Card>

          {/* Admin Calendar Grid */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {calendarUser.name}'s Attendance Calendar ({MONTH_NAMES[calendarMonth]} {calendarYear})
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-100 text-purple-800">
                    {calendarUser.employee_id} • {calendarUser.department}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click on any day cell to mark or update attendance and add remarks
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Half-Day</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Leave</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Holiday</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Weekend</span>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center py-2.5 text-xs font-bold text-slate-700">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span className="text-slate-400">Sat</span>
                <span className="text-slate-400">Sun</span>
              </div>

              <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-white">
                {Array.from({ length: startDayOffset }).map((_, i) => (
                  <div key={`cal-empty-${i}`} className="min-h-[95px] bg-slate-50/50 p-2" />
                ))}

                {daysInMonth.map((dayObj) => {
                  const dateStr = format(dayObj, 'yyyy-MM-dd');
                  const isWknd = isWeekend(dayObj);
                  const holiday = getIndianHoliday(dateStr);
                  const record = records.find(a => a.date === dateStr && a.user_id === calendarEmployeeId);
                  const isToday = dateStr === '2026-08-22';

                  return (
                    <div
                      key={`admin-cal-${dateStr}`}
                      onClick={() => handleOpenCreateForDate(dateStr, calendarEmployeeId)}
                      className={`min-h-[100px] p-2.5 transition-all cursor-pointer hover:bg-purple-50/50 relative flex flex-col justify-between group ${
                        isToday ? 'bg-purple-50/60 ring-2 ring-purple-500 ring-inset' : isWknd ? 'bg-slate-50/60' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${
                          isToday ? 'px-1.5 py-0.5 rounded bg-purple-700 text-white' : isWknd ? 'text-slate-400' : 'text-slate-800'
                        }`}>
                          {format(dayObj, 'd')}
                        </span>

                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-purple-700 font-bold flex items-center gap-0.5">
                          <Edit3 className="w-2.5 h-2.5" /> Edit
                        </span>
                      </div>

                      <div className="mt-1">
                        {holiday ? (
                          <div className="text-[10px] font-bold text-purple-700 truncate" title={holiday.name}>
                            🎉 {holiday.name}
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
                                {format(parseISO(record.check_in_time), 'hh:mm')} - {record.check_out_time ? format(parseISO(record.check_out_time), 'hh:mm') : 'In-Shift'}
                              </p>
                            )}
                            {record.remarks && (
                              <p className="text-[8px] text-slate-400 truncate italic">
                                Note: {record.remarks}
                              </p>
                            )}
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
        </div>
      )}

      {/* TAB 3: Corporate Annual Holiday & Schedule Planner */}
      {activeTab === 'year-planner' && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {calendarYear} Corporate Annual Holiday Roster & Planning Hub
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage upcoming year gazetted holidays, corporate calendar publish dates (e.g. September release), and working schedules
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={calendarYear}
                onChange={(e) => setCalendarYear(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800"
              >
                <option value={2025}>2025 Calendar</option>
                <option value={2026}>2026 Calendar</option>
                <option value={2027}>2027 Calendar (Next Year Planned)</option>
              </select>

              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setHolidayForm({
                    date: `${calendarYear}-09-01`,
                    name: '',
                    type: 'gazetted',
                    isNational: false,
                    description: ''
                  });
                  setHolidayModalOpen(true);
                }}
                className="bg-purple-700 hover:bg-purple-800"
              >
                Add Holiday to {calendarYear}
              </Button>
            </div>
          </div>

          {/* 12 Months Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MONTH_NAMES.map((monthName, mIdx) => {
              const mDate = new Date(calendarYear, mIdx, 1);
              const mDays = eachDayOfInterval({ start: startOfMonth(mDate), end: endOfMonth(mDate) });
              const mPrefix = `${calendarYear}-${String(mIdx + 1).padStart(2, '0')}`;
              const mHolidays = plannedHolidaysForYear.filter(h => h.date.startsWith(mPrefix));
              const mWorkDays = mDays.filter(d => !isWeekend(d) && !getIndianHoliday(format(d, 'yyyy-MM-dd'))).length;

              return (
                <div
                  key={monthName}
                  onClick={() => {
                    setCalendarMonth(mIdx);
                    setActiveTab('calendar');
                  }}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900 text-sm">{monthName}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
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
                    <span className="text-purple-700 font-bold hover:underline">Inspect Month Calendar →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Add Planned Holiday Modal */}
      <Modal
        isOpen={holidayModalOpen}
        onClose={() => setHolidayModalOpen(false)}
        title={`Add Holiday to ${calendarYear} Corporate Calendar`}
        subtitle="Configure company public & festive holidays for annual employee planning"
      >
        <form onSubmit={handleSaveHoliday} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Holiday Name *
            </label>
            <input
              type="text"
              required
              value={holidayForm.name}
              onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
              placeholder="e.g. Ganesh Chaturthi / Corporate Annual Day"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Date *
              </label>
              <input
                type="date"
                required
                value={holidayForm.date}
                onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Holiday Category
              </label>
              <select
                value={holidayForm.type}
                onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
              >
                <option value="gazetted">Gazetted Public Holiday</option>
                <option value="restricted">Restricted / Optional Holiday</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={holidayForm.description}
              onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
              placeholder="Optional holiday significance or observance rules..."
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setHolidayModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-purple-700 hover:bg-purple-800">
              Save Planned Holiday
            </Button>
          </div>
        </form>
      </Modal>

      {/* Mark / Update Attendance Modal (with remarks) */}
      <Modal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title={isEditing ? "Update Employee Attendance" : "Mark Attendance Manually"}
        subtitle="Authorized HR/Manager manual override with audit remarks"
      >
        <form onSubmit={handleSaveAttendance} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Employee *
            </label>
            <select
              disabled={isEditing}
              value={manualForm.userId}
              onChange={(e) => setManualForm({ ...manualForm, userId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all disabled:bg-slate-100 font-medium"
            >
              {mockUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.employee_id}) — {u.department}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Date *
            </label>
            <input
              type="date"
              required
              disabled={isEditing}
              value={manualForm.date}
              onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all disabled:bg-slate-100 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Check-In Time
              </label>
              <input
                type="time"
                value={manualForm.checkInTime}
                onChange={(e) => setManualForm({ ...manualForm, checkInTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Check-Out Time
              </label>
              <input
                type="time"
                value={manualForm.checkOutTime}
                onChange={(e) => setManualForm({ ...manualForm, checkOutTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Attendance Status *
            </label>
            <select
              value={manualForm.status}
              onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all font-semibold"
            >
              <option value="present">Present</option>
              <option value="half-day">Half Day</option>
              <option value="absent">Absent</option>
              <option value="leave">On Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Remarks for Manual Change *
            </label>
            <textarea
              required
              rows={2}
              value={manualForm.remarks}
              onChange={(e) => setManualForm({ ...manualForm, remarks: e.target.value })}
              placeholder="e.g. Biometric device sync correction / Manager approved half day"
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setManualModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={savingManual}
              className="bg-purple-700 hover:bg-purple-800 font-bold"
            >
              {isEditing ? 'Save Changes' : 'Confirm Attendance'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
