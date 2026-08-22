// src/pages/employee/AttendancePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceService } from '../../services/attendanceService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import {
  CalendarCheck,
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Play,
  Square,
  Filter,
  History,
  TrendingUp
} from 'lucide-react';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { toast } from 'sonner';

export const AttendancePage = () => {
  const { currentUser } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterRange, setFilterRange] = useState('all'); // all, month, week
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAttendance = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      let startDate;
      if (filterRange === 'week') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        startDate = d.toISOString().split('T')[0];
      } else if (filterRange === 'month') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        startDate = d.toISOString().split('T')[0];
      }

      const { data, error } = await attendanceService.getEmployeeAttendance(currentUser.id, { startDate });
      if (error) toast.error("Error loading attendance records");
      setAttendanceRecords(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [currentUser, filterRange]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendanceRecords.find(a => a.date === todayStr);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const { data, error } = await attendanceService.checkIn(currentUser.id);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Successfully checked in for today!");
        await loadAttendance();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    setActionLoading(true);
    try {
      const { data, error } = await attendanceService.checkOut(todayRecord.id);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Successfully checked out. Have a great evening!");
        await loadAttendance();
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate work duration
  const calcDuration = (checkIn, checkOut) => {
    if (!checkIn) return '-';
    const start = parseISO(checkIn);
    const end = checkOut ? parseISO(checkOut) : currentTime;
    const minutes = differenceInMinutes(end, start);
    if (minutes < 0) return '-';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  // Stats calculation
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
  const halfDays = attendanceRecords.filter(r => r.status === 'half-day').length;
  const onTimeRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance & Time Tracker</h1>
          <p className="text-xs text-slate-500 mt-1">Manage daily check-ins, view past logs, and track work hours</p>
        </div>

        {/* Range filter pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-xl shadow-xs self-start">
          <button
            onClick={() => setFilterRange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterRange === 'all' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Logs
          </button>
          <button
            onClick={() => setFilterRange('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterRange === 'month' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Past 30 Days
          </button>
          <button
            onClick={() => setFilterRange('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterRange === 'week' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            This Week
          </button>
        </div>
      </div>

      {/* Live Punch Clock Card & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Punch Widget */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">
                Today's Timesheet
              </span>
              <span className="text-xs text-slate-400">
                {format(currentTime, 'MMM dd, yyyy')}
              </span>
            </div>

            {/* Live digital clock */}
            <div className="my-6 text-center">
              <div className="text-3xl sm:text-4xl font-mono font-extrabold text-white tracking-wider">
                {format(currentTime, 'hh:mm:ss')}
                <span className="text-sm font-sans font-medium text-teal-400 ml-2">
                  {format(currentTime, 'a')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Standard Working Hours: 09:00 AM — 06:00 PM
              </p>
            </div>

            {/* Status overview */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 mb-6">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Check In</span>
                <p className="text-xs font-bold text-teal-300 mt-0.5">
                  {todayRecord?.check_in_time ? format(parseISO(todayRecord.check_in_time), 'hh:mm a') : '—'}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Check Out</span>
                <p className="text-xs font-bold text-teal-300 mt-0.5">
                  {todayRecord?.check_out_time ? format(parseISO(todayRecord.check_out_time), 'hh:mm a') : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div>
            {!todayRecord?.check_in_time ? (
              <Button
                variant="primary"
                size="lg"
                loading={actionLoading}
                onClick={handleCheckIn}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/20"
                icon={Play}
              >
                Punch In for Today
              </Button>
            ) : !todayRecord?.check_out_time ? (
              <Button
                variant="danger"
                size="lg"
                loading={actionLoading}
                onClick={handleCheckOut}
                className="w-full bg-rose-500 hover:bg-rose-600 font-bold shadow-lg shadow-rose-500/20"
                icon={Square}
              >
                Punch Out (End Day)
              </Button>
            ) : (
              <div className="p-3 text-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                ✓ Day completed • Total: {calcDuration(todayRecord.check_in_time, todayRecord.check_out_time)}
              </div>
            )}
          </div>
        </Card>

        {/* 3 Metric Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Present Days"
            value={presentDays.toString()}
            subtitle={`${halfDays} Half-day sessions`}
            icon={CheckCircle}
            color="emerald"
          />
          <StatCard
            title="On-Time Attendance"
            value={`${onTimeRate}%`}
            subtitle="Punctuality index"
            icon={TrendingUp}
            color="teal"
          />
          <StatCard
            title="Avg Work Hours"
            value="8.4 hrs"
            subtitle="Per logged business day"
            icon={Clock}
            color="blue"
          />

          {/* Weekly attendance mini-grid */}
          <div className="sm:col-span-3">
            <Card className="p-4 bg-slate-50 border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase">Recent 7-Day Attendance Matrix</span>
                <span className="text-[11px] text-slate-400">Green = Present, Amber = Half-day, Gray = Off</span>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                  <div key={day} className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-400 block">{day}</span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">{17 + idx}</span>
                    <span className={`inline-block w-2.5 h-2.5 rounded-full mt-1.5 ${
                      idx === 2 ? 'bg-amber-400' : idx > 4 ? 'bg-slate-300' : 'bg-emerald-500'
                    }`} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <Card>
        <CardHeader
          title="Attendance Log History"
          subtitle={`Showing ${attendanceRecords.length} recorded entries`}
        />

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading attendance records...
          </div>
        ) : attendanceRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No attendance records found for this period.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check-In Time</TableHead>
                <TableHead>Check-Out Time</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Status</TableHead>
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
                    {record.check_in_time ? format(parseISO(record.check_in_time), 'hh:mm:ss a') : '—'}
                  </TableCell>
                  <TableCell>
                    {record.check_out_time ? format(parseISO(record.check_out_time), 'hh:mm:ss a') : (
                      record.check_in_time && record.date === todayStr ? (
                        <span className="text-teal-600 font-medium text-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" /> Active Now
                        </span>
                      ) : '—'
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {calcDuration(record.check_in_time, record.check_out_time)}
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
    </div>
  );
};
