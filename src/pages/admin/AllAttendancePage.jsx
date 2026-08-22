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
  XCircle,
  Clock,
  Download,
  Building,
  User,
  Laptop,
  Briefcase,
  FileCheck2,
  Edit3,
  Plus,
  Search,
  Check,
  X
} from 'lucide-react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';
import { WORK_MODES, WORK_MODE_LABELS, REGULARIZATION_STATUS } from '../../lib/constants';

export const AllAttendancePage = () => {
  const [activeTab, setActiveTab] = useState('muster'); // 'muster' or 'regularizations'
  const [records, setRecords] = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('2026-08-22');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [workModeFilter, setWorkModeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Regularization Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  const [reviewAction, setReviewAction] = useState('approved'); // 'approved' or 'rejected'
  const [adminFeedback, setAdminFeedback] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Manual Attendance Modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    userId: 'usr-001-emp',
    date: '2026-08-22',
    checkInTime: '09:30',
    checkOutTime: '18:30',
    workMode: 'office',
    status: 'present'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [attRes, regRes] = await Promise.all([
        attendanceService.getAllAttendance({
          dateFilter: selectedDate || undefined,
          statusFilter,
          departmentFilter: deptFilter,
          workModeFilter
        }),
        attendanceService.getRegularizationRequests()
      ]);

      if (attRes.error) toast.error("Error loading team attendance");
      setRecords(attRes.data || []);
      setRegularizations(regRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, statusFilter, deptFilter, workModeFilter]);

  // Export Indian Muster Roll CSV
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
      "Work Mode",
      "Check-In (IST)",
      "Check-Out (IST)",
      "Break Minutes",
      "Net Work Hours",
      "Late Check-In",
      "Attendance Status"
    ];

    const rows = records.map(r => {
      const start = r.check_in_time ? format(parseISO(r.check_in_time), 'hh:mm a') : 'N/A';
      const end = r.check_out_time ? format(parseISO(r.check_out_time), 'hh:mm a') : 'N/A';
      let netHours = '0.0';
      if (r.check_in_time && r.check_out_time) {
        const gross = differenceInMinutes(parseISO(r.check_out_time), parseISO(r.check_in_time));
        const net = Math.max(0, gross - (r.break_minutes || 0));
        netHours = (net / 60).toFixed(1);
      }
      return [
        `"${r.users?.employee_id || ''}"`,
        `"${r.users?.name || ''}"`,
        `"${r.users?.department || ''}"`,
        `"${r.date}"`,
        `"${r.work_mode || 'office'}"`,
        `"${start}"`,
        `"${end}"`,
        `"${r.break_minutes || 0}"`,
        `"${netHours} hrs"`,
        `"${r.is_late ? 'YES' : 'NO'}"`,
        `"${r.status}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Dayflow_Indian_Muster_Roll_${selectedDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${records.length} Muster Roll records to CSV.`);
  };

  // Handle Regularization Review (Approve / Reject)
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReg) return;
    setReviewLoading(true);
    try {
      const { error } = await attendanceService.reviewRegularizationRequest(selectedReg.id, {
        status: reviewAction,
        adminComments: adminFeedback || (reviewAction === 'approved' ? 'Approved by HR' : 'Declined per company policy')
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success(`Regularization request ${reviewAction === 'approved' ? 'Approved' : 'Declined'} successfully!`);
        setReviewModalOpen(false);
        setSelectedReg(null);
        setAdminFeedback('');
        await loadData();
      }
    } finally {
      setReviewLoading(false);
    }
  };

  // Handle Manual Attendance Entry
  const handleManualSave = async (e) => {
    e.preventDefault();
    setReviewLoading(true);
    try {
      const inISO = `${manualForm.date}T${manualForm.checkInTime}:00+05:30`;
      const outISO = `${manualForm.date}T${manualForm.checkOutTime}:00+05:30`;

      await attendanceService.adminSaveAttendanceRecord({
        user_id: manualForm.userId,
        date: manualForm.date,
        check_in_time: inISO,
        check_out_time: outISO,
        work_mode: manualForm.workMode,
        status: manualForm.status,
        break_minutes: 45,
        is_late: false,
        location: 'Office (Admin Entry)'
      });

      toast.success("Attendance entry logged successfully!");
      setManualModalOpen(false);
      await loadData();
    } finally {
      setReviewLoading(false);
    }
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

  const presentCount = records.filter(r => r.status === 'present').length;
  const leaveCount = records.filter(r => r.status === 'leave').length;
  const lateCount = records.filter(r => r.is_late).length;
  const wfhCount = records.filter(r => r.work_mode === WORK_MODES.WFH).length;
  const pendingRegs = regularizations.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Attendance & Muster Roll</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Indian Labor & HR Compliance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            General Shift (09:30 - 18:30 IST) • Real-time Daily Attendance Muster • Regularization Approvals
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <Button
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={() => setManualModalOpen(true)}
            className="border-slate-300 font-semibold"
          >
            Manual Entry
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
            className="bg-slate-900 text-white hover:bg-slate-800 font-semibold shadow-xs"
          >
            Export Muster Roll (CSV)
          </Button>
        </div>
      </div>

      {/* Indian HR Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Daily Roster Strength"
          value={records.length.toString()}
          subtitle={`Filtered for ${selectedDate || 'all dates'}`}
          icon={ClipboardList}
          color="purple"
        />
        <StatCard
          title="Present Today"
          value={presentCount.toString()}
          subtitle="Currently active / logged"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Working From Home"
          value={wfhCount.toString()}
          subtitle="Remote / Hybrid sessions"
          icon={Laptop}
          color="blue"
        />
        <StatCard
          title="Late Arrivals"
          value={lateCount.toString()}
          subtitle="Past 09:45 AM threshold"
          icon={AlertTriangle}
          color={lateCount > 0 ? 'amber' : 'teal'}
        />
        <StatCard
          title="Regularization Pending"
          value={pendingRegs.toString()}
          subtitle="Awaiting HR approval"
          icon={FileCheck2}
          color={pendingRegs > 0 ? 'rose' : 'teal'}
        />
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('muster')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'muster'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Daily Attendance Muster Roll ({records.length})
        </button>

        <button
          onClick={() => setActiveTab('regularizations')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'regularizations'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          Regularization Requests
          {pendingRegs > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
              {pendingRegs}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Daily Muster Roll */}
      {activeTab === 'muster' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <Card className="p-4 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Search Employee
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Name or DF-ID..."
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Muster Date (IST)
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
                  Department
                </label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
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
                  Work Mode
                </label>
                <select
                  value={workModeFilter}
                  onChange={(e) => setWorkModeFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                >
                  <option value="all">All Work Modes</option>
                  <option value={WORK_MODES.OFFICE}>Work From Office (WFO)</option>
                  <option value={WORK_MODES.WFH}>Work From Home (WFH)</option>
                  <option value={WORK_MODES.ON_DUTY}>Client On-Duty (OD)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Status Filter
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                >
                  <option value="all">All Statuses</option>
                  <option value="present">Present</option>
                  <option value="half-day">Half-Day</option>
                  <option value="leave">On Leave</option>
                  <option value="absent">Absent / LOP</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Muster Roll Table */}
          <Card>
            <CardHeader
              title={`Muster Roll for ${selectedDate || 'All Dates'}`}
              subtitle={`Showing ${filteredRecords.length} staff attendance logs with Indian standard shift calculations`}
            />

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading muster records...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No attendance logs found for the selected criteria.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Work Mode</TableHead>
                    <TableHead>Check-In (IST)</TableHead>
                    <TableHead>Check-Out (IST)</TableHead>
                    <TableHead>Net Work Hrs</TableHead>
                    <TableHead>Attendance Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((r) => {
                    let netDuration = '—';
                    if (r.check_in_time) {
                      const start = parseISO(r.check_in_time);
                      const end = r.check_out_time ? parseISO(r.check_out_time) : new Date();
                      const gross = differenceInMinutes(end, start);
                      const net = Math.max(0, gross - (r.break_minutes || 0));
                      netDuration = `${Math.floor(net / 60)}h ${net % 60}m`;
                    }

                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                              {r.users?.name?.slice(0, 2).toUpperCase() || 'DF'}
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
                        <TableCell>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize flex items-center gap-1 w-fit">
                            {r.work_mode === WORK_MODES.WFH ? <Laptop className="w-3 h-3 text-blue-600" /> : <Building className="w-3 h-3 text-teal-600" />}
                            {r.work_mode === WORK_MODES.WFH ? 'WFH' : r.work_mode === WORK_MODES.ON_DUTY ? 'On-Duty' : 'Office'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {r.check_in_time ? (
                            <span>
                              {format(parseISO(r.check_in_time), 'hh:mm:ss a')}
                              {r.is_late && (
                                <span className="ml-1.5 px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                  Late
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
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Active In-Shift
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-800 font-mono">
                          {netDuration}
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.status}>{r.status}</Badge>
                          {r.regularization_id && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              Regularized
                            </span>
                          )}
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

      {/* TAB 2: Regularization Requests Review */}
      {activeTab === 'regularizations' && (
        <Card>
          <CardHeader
            title="Attendance Regularization & Missed Punch Approvals"
            subtitle="Review employee justifications for device glitch, offsite duty, or missed punches"
          />

          {regularizations.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No regularization requests currently pending.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Requested Timings (IST)</TableHead>
                  <TableHead>Reason Category</TableHead>
                  <TableHead>Employee Remarks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regularizations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-900 text-xs">{r.users?.name || 'Employee'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{r.users?.employee_id || 'DF-1000'} • {r.users?.department}</p>
                      </div>
                    </TableCell>
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
                      {r.admin_comments && (
                        <p className="text-[10px] text-teal-800 mt-1 truncate max-w-[120px]" title={r.admin_comments}>
                          Note: {r.admin_comments}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedReg(r);
                              setReviewAction('approved');
                              setAdminFeedback('Approved based on biometric log & swipe verification');
                              setReviewModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-2xs"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReg(r);
                              setReviewAction('rejected');
                              setAdminFeedback('Declined: Inadequate justification or swipe proof');
                              setReviewModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-all flex items-center gap-1 shadow-2xs"
                          >
                            <X className="w-3 h-3" /> Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 italic">Resolved</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Review Regularization Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={reviewAction === 'approved' ? 'Approve Attendance Regularization' : 'Decline Attendance Regularization'}
        subtitle={`Review application for ${selectedReg?.users?.name} on ${selectedReg?.date}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <p><span className="font-bold text-slate-700">Requested Shift:</span> {selectedReg?.requested_check_in} to {selectedReg?.requested_check_out} IST</p>
            <p><span className="font-bold text-slate-700">Reason:</span> {selectedReg?.reason?.replace(/_/g, ' ')}</p>
            <p><span className="font-bold text-slate-700">Employee Remarks:</span> {selectedReg?.remarks}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              HR / Reviewer Comments
            </label>
            <textarea
              required
              rows={3}
              value={adminFeedback}
              onChange={(e) => setAdminFeedback(e.target.value)}
              placeholder="e.g. Verified with access card log..."
              className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setReviewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={reviewAction === 'approved' ? 'primary' : 'danger'}
              loading={reviewLoading}
              className={reviewAction === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
            >
              Confirm {reviewAction === 'approved' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manual Attendance Entry Modal */}
      <Modal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title="Manual Attendance Entry / Override"
        subtitle="Directly log or correct staff attendance for HR compliance"
      >
        <form onSubmit={handleManualSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Employee *
            </label>
            <select
              value={manualForm.userId}
              onChange={(e) => setManualForm({ ...manualForm, userId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
            >
              {mockUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.employee_id}) — {u.department}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Date *
              </label>
              <input
                type="date"
                required
                value={manualForm.date}
                onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Mode *
              </label>
              <select
                value={manualForm.workMode}
                onChange={(e) => setManualForm({ ...manualForm, workMode: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
              >
                <option value="office">Work From Office</option>
                <option value="wfh">Work From Home</option>
                <option value="on_duty">Client On-Duty</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Check-In (IST) *
              </label>
              <input
                type="time"
                required
                value={manualForm.checkInTime}
                onChange={(e) => setManualForm({ ...manualForm, checkInTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Check-Out (IST) *
              </label>
              <input
                type="time"
                required
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all"
            >
              <option value="present">Present (Full Day)</option>
              <option value="half-day">Half Day</option>
              <option value="leave">On Leave</option>
              <option value="absent">Absent / LOP</option>
            </select>
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
              loading={reviewLoading}
              className="bg-purple-700 hover:bg-purple-800"
            >
              Save Attendance Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
