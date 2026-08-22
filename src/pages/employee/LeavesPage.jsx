// src/pages/employee/LeavesPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { leaveService } from '../../services/leaveService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  AlertCircle,
  Check,
  X,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

export const LeavesPage = () => {
  const { currentUser } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Apply Leave Form State
  const [formData, setFormData] = useState({
    type: 'paid', // 'paid' | 'sick' | 'unpaid'
    startDate: '',
    endDate: '',
    remarks: ''
  });
  const [formError, setFormError] = useState('');

  const loadLeavesData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await leaveService.getEmployeeLeaves(currentUser.id);
      setLeaves(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeavesData();
  }, [currentUser]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e - s);
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  };

  const daysRequested = calculateDays(formData.startDate, formData.endDate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.startDate || !formData.endDate) {
      setFormError('Please select both start and end dates');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setFormError('End date cannot be earlier than start date');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await leaveService.submitLeaveRequest({
        userId: currentUser.id,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        remarks: formData.remarks,
        daysCount: daysRequested
      });

      if (error) {
        setFormError(error);
        toast.error(error);
      } else {
        toast.success("Leave request submitted successfully!");
        if (data) {
          setLeaves(prev => [data, ...prev.filter(p => p.id !== data.id)]);
        }
        setStatusFilter('all'); // Show all requests so new pending request is instantly visible
        setIsModalOpen(false);
        setFormData({ type: 'paid', startDate: '', endDate: '', remarks: '' });
        await loadLeavesData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const approvedLeaves = leaves.filter(l => l.status === 'approved');
  const rejectedLeaves = leaves.filter(l => l.status === 'rejected');

  const filteredLeaves = leaves.filter(l => {
    if (statusFilter === 'all') return true;
    return l.status === statusFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Leave Requests</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Apply for leave, track pending approvals, and view your approved and rejected requests
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 font-semibold self-start sm:self-auto"
        >
          Apply for Leave
        </Button>
      </div>

      {/* Summary Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-zinc-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total Requests</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{leaves.length}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">All submitted applications</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Requests</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingLeaves.length}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Awaiting HR / Admin review</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Approved Requests</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{approvedLeaves.length}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Granted time-off</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Rejected Requests</p>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{rejectedLeaves.length}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Declined with remarks</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Leave Requests Table Card */}
      <Card className="p-6">
        {/* Status Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">My Leave Applications History</h3>
            <p className="text-xs text-zinc-500">Track current status and HR comments for all your leave applications</p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl w-fit">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              All ({leaves.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-amber-600'
              }`}
            >
              Pending ({pendingLeaves.length})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-emerald-600'
              }`}
            >
              Approved ({approvedLeaves.length})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                statusFilter === 'rejected'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-rose-600'
              }`}
            >
              Rejected ({rejectedLeaves.length})
            </button>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-16 text-center text-zinc-400 text-xs">Loading your leave requests...</div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-xs">
            No {statusFilter !== 'all' ? statusFilter : ''} leave requests found. Click "Apply for Leave" above to submit one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leave Type</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Reason / Remarks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>HR Comments / Feedback</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaves.map((leave) => {
                const count = leave.days || leave.days_count || 1;
                return (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <Badge variant={leave.type}>{leave.type} Leave</Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                      {leave.start_date} {leave.start_date !== leave.end_date ? `to ${leave.end_date}` : ''}
                    </TableCell>
                    <TableCell className="font-bold text-xs text-zinc-900 dark:text-white font-mono">
                      {count} {count === 1 ? 'Day' : 'Days'}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-700 dark:text-zinc-300 max-w-xs">
                      {leave.remarks || <span className="text-zinc-400 italic">No remarks</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={leave.status}>{leave.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {leave.comments ? (
                        <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-medium bg-zinc-50 dark:bg-zinc-800/60 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                          <MessageSquare className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{leave.comments}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">Awaiting HR feedback</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Apply for Leave Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Apply for Leave"
        subtitle="Submit a new leave application to HR"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}

          {/* Leave Type Selector (Paid, Sick, Unpaid) */}
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Select Leave Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm font-semibold focus:border-teal-600"
            >
              <option value="paid">Paid Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>

          {/* Date Range Picker */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Start Date *
              </label>
              <input
                type="date"
                required
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                End Date *
              </label>
              <input
                type="date"
                required
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:border-teal-600"
              />
            </div>
          </div>

          {formData.startDate && formData.endDate && (
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex justify-between items-center text-xs font-semibold text-teal-900 dark:text-teal-200">
              <span>Total Duration:</span>
              <span className="font-mono font-bold text-sm text-teal-700 dark:text-teal-300">
                {daysRequested} {daysRequested === 1 ? 'Day' : 'Days'}
              </span>
            </div>
          )}

          {/* Remarks / Reason */}
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Reason / Remarks
            </label>
            <textarea
              name="remarks"
              rows={3}
              value={formData.remarks}
              onChange={handleInputChange}
              placeholder="e.g. Attending family wedding, feeling unwell, personal work..."
              className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:border-teal-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting} className="bg-teal-600 hover:bg-teal-700 font-bold">
              Submit Leave Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
