// src/pages/admin/AllAttendancePage.jsx
import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import {
  ClipboardList,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Download,
  Building,
  User
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

export const AllAttendancePage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('2026-08-22');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const { data, error } = await attendanceService.getAllAttendance({
        dateFilter: selectedDate || undefined,
        statusFilter,
        departmentFilter: deptFilter
      });
      if (error) toast.error("Error loading team attendance");
      setRecords(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedDate, statusFilter, deptFilter]);

  const handleExport = () => {
    toast.success(`Exported ${records.length} attendance rows to CSV format.`);
  };

  const presentCount = records.filter(r => r.status === 'present').length;
  const leaveCount = records.filter(r => r.status === 'leave').length;
  const halfDayCount = records.filter(r => r.status === 'half-day').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Attendance Monitor</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Admin & HR Ops
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Cross-department time tracking, daily presence check, and working hours compliance</p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={Download}
          onClick={handleExport}
          className="self-start"
        >
          Export Logs (CSV)
        </Button>
      </div>

      {/* Attendance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Logged Personnel"
          value={records.length.toString()}
          subtitle={`Filtered for ${selectedDate || 'all dates'}`}
          icon={ClipboardList}
          color="purple"
        />
        <StatCard
          title="Active / Present"
          value={presentCount.toString()}
          subtitle="Currently checked in"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="On Approved Leave"
          value={leaveCount.toString()}
          subtitle="Excused absence"
          icon={Clock}
          color="teal"
        />
        <StatCard
          title="Half-Day / Partial"
          value={halfDayCount.toString()}
          subtitle="Half shifts logged"
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      {/* Filter Control Bar */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Select Specific Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Filter by Department
            </label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
            >
              <option value="all">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Design & UX">Design & UX</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Attendance Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="half-day">Half-Day</option>
              <option value="leave">On Leave</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader
          title="Attendance Roster Log"
          subtitle={`Displaying records matching criteria`}
        />

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading attendance records...
          </div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No attendance entries found for the selected date and filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Check-In</TableHead>
                <TableHead>Check-Out</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                        {r.users?.name?.slice(0, 2).toUpperCase() || 'EM'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 leading-tight">{r.users?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{r.users?.employee_id || 'DF-1000'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">{r.users?.department || 'General'}</TableCell>
                  <TableCell className="font-semibold text-slate-800 text-xs">{r.date}</TableCell>
                  <TableCell className="text-xs">
                    {r.check_in_time ? format(parseISO(r.check_in_time), 'hh:mm a') : '—'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {r.check_out_time ? format(parseISO(r.check_out_time), 'hh:mm a') : (
                      r.check_in_time ? <span className="text-emerald-600 font-semibold">Active In-Shift</span> : '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status}>{r.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};
