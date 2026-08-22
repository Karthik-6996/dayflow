// src/pages/admin/AllAttendancePage.jsx
import React, { useState, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { toast } from 'sonner';

export const AllAttendancePage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('2026-08-22');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadAttendance = async (date) => {
    setLoading(true);
    try {
      const { data, error } = await attendanceService.getAllAttendance({
        dateFilter: date,
        departmentFilter: selectedDepartment,
        statusFilter: statusFilter
      });
      if (error) toast.error("Error loading attendance");
      setRecords(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance(selectedDate);
  }, [selectedDate, selectedDepartment, statusFilter]);

  const handlePrevDay = () => {
    const prev = format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd');
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd');
    setSelectedDate(next);
  };

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
      {/* Header with Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Attendance Master</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              Odoo Daily View
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time daily attendance logs, work hours, and extra hours calculations
          </p>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 shadow-xs">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2 py-1 text-xs font-semibold bg-transparent text-zinc-900 dark:text-white outline-none cursor-pointer"
          />
          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Daily Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Present Today"
          value={presentCount}
          subtitle={`Checked in on ${selectedDate}`}
          icon={CheckCircle2}
        />
        <StatCard
          title="Late Arrivals"
          value={lateCount}
          subtitle="Checked in after 09:45 cutoff"
          icon={AlertTriangle}
        />
        <StatCard
          title="Absences / On Leave"
          value={absentCount}
          subtitle="Non-present employee count"
          icon={Clock}
        />
      </div>

      {/* Attendance Table */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter employee or ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="leave">On Leave</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-zinc-400 text-xs">Loading records...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-xs">No attendance records found for this date.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Work Hours</TableHead>
                <TableHead>Extra Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((r) => {
                const checkIn = r.check_in_time ? format(parseISO(r.check_in_time), 'hh:mm a') : '—';
                const checkOut = r.check_out_time ? format(parseISO(r.check_out_time), 'hh:mm a') : r.check_in_time ? 'In-Progress' : '—';
                
                let workHours = '—';
                let extraHours = '0h';
                if (r.check_in_time && r.check_out_time) {
                  const gross = Math.max(0, (new Date(r.check_out_time) - new Date(r.check_in_time)) / (1000 * 60));
                  const net = Math.max(0, gross - (r.break_minutes || 0));
                  const h = Math.floor(net / 60);
                  const m = Math.round(net % 60);
                  workHours = `${h}h ${m}m`;
                  if (net > 480) {
                    const extra = net - 480;
                    extraHours = `${Math.floor(extra / 60)}h ${Math.round(extra % 60)}m`;
                  }
                }

                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-semibold text-zinc-900 dark:text-white text-xs">{r.users?.name || 'Staff'}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{r.users?.employee_id || r.user_id}</p>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">{r.date}</TableCell>
                    <TableCell className="text-xs font-mono text-zinc-800 dark:text-zinc-200">{checkIn}</TableCell>
                    <TableCell className="text-xs font-mono text-zinc-800 dark:text-zinc-200">{checkOut}</TableCell>
                    <TableCell className="text-xs font-mono font-bold text-zinc-900 dark:text-white">{workHours}</TableCell>
                    <TableCell className="text-xs font-mono text-zinc-600 dark:text-zinc-400">{extraHours}</TableCell>
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
  );
};
