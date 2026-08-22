// src/pages/employee/LeavesPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { leaveService } from '../../services/leaveService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle2,
  FileText,
  Calendar,
  AlertCircle,
  Upload,
  Paperclip,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export const LeavesPage = () => {
  const { currentUser, isAdmin } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState({
    paid: { total: 24, used: 0, available: 24 },
    sick: { total: 7, used: 0, available: 7 },
    unpaid: { total: 0, used: 0, available: 99 }
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Form State
  const [formData, setFormData] = useState({
    type: 'paid',
    startDate: '',
    endDate: '',
    remarks: '',
    attachment: null
  });
  const [formError, setFormError] = useState('');

  const loadLeavesData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [leavesRes, balRes] = await Promise.all([
        leaveService.getEmployeeLeaves(currentUser.id),
        leaveService.getLeaveBalances(currentUser.id)
      ]);
      setLeaves(leavesRes.data || []);
      setBalances(balRes.data || balances);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeavesData();
  }, [currentUser, isAdmin]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, attachment: file.name }));
      toast.success(`Attached medical document: ${file.name}`);
    }
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

    // Balance validation
    if (formData.type === 'paid' && daysRequested > balances.paid.available) {
      setFormError(`Insufficient Paid Leave balance. You have ${balances.paid.available} days remaining.`);
      return;
    }
    if (formData.type === 'sick' && daysRequested > balances.sick.available) {
      setFormError(`Insufficient Sick Leave balance. You have ${balances.sick.available} days remaining.`);
      return;
    }

    // Attachment validation for sick leave > 2 days
    if (formData.type === 'sick' && daysRequested > 2 && !formData.attachment) {
      setFormError('Medical certificate attachment is required for sick leave exceeding 2 days.');
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
        daysCount: daysRequested,
        attachment: formData.attachment
      });

      if (error) {
        setFormError(error);
      } else {
        toast.success("Time off application submitted for approval!");
        setIsModalOpen(false);
        setFormData({ type: 'paid', startDate: '', endDate: '', remarks: '', attachment: null });
        await loadLeavesData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminDecision = async (leaveId, action) => {
    try {
      await leaveService.updateLeaveStatus(leaveId, {
        status: action,
        comments: action === 'approved' ? 'Approved by HR' : 'Declined per capacity'
      });
      toast.success(`Leave marked as ${action}!`);
      await loadLeavesData();
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const filteredLeaves = leaves.filter(l => {
    if (statusFilter === 'all') return true;
    return l.status === statusFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Time Off</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              Odoo Leave Module
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            View leave balances, apply for paid or sick time off, and inspect request approvals
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold transition cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" /> Request Time Off
        </button>
      </div>

      {/* Leave Balances Cards (Odoo Wireframe: Paid Time Off 24d, Sick Time Off 07d) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hover className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Paid Time Off (PTO)</p>
              <h4 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                {String(balances.paid.available).padStart(2, '0')} <span className="text-xs font-normal text-zinc-500">Days Available</span>
              </h4>
              <p className="text-xs text-zinc-500 mt-1">{balances.paid.used} Days Used of {balances.paid.total} Total</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
        </Card>

        <Card hover className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Sick Leave</p>
              <h4 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                {String(balances.sick.available).padStart(2, '0')} <span className="text-xs font-normal text-zinc-500">Days Available</span>
              </h4>
              <p className="text-xs text-zinc-500 mt-1">{balances.sick.used} Days Used of {balances.sick.total} Total</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </Card>

        <Card hover className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Pending Requests</p>
              <h4 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                {leaves.filter(l => l.status === 'pending').length} <span className="text-xs font-normal text-zinc-500">Requests</span>
              </h4>
              <p className="text-xs text-zinc-500 mt-1">Awaiting review & approval</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </Card>
      </div>

      {/* Time Off Requests Table */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {isAdmin ? 'All Employee Time Off Applications' : 'My Time Off Requests'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Records and approval statuses</p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-zinc-400 text-xs">Loading requests...</div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-xs">No time-off requests found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && <TableHead>Employee</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason / Notes</TableHead>
                <TableHead>Attachment</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaves.map((leave) => (
                <TableRow key={leave.id}>
                  {isAdmin && (
                    <TableCell>
                      <p className="font-semibold text-zinc-900 dark:text-white">{leave.users?.name || 'Staff'}</p>
                      <p className="text-[10px] text-zinc-400">{leave.users?.employee_id || 'DF-1000'}</p>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant={leave.type}>{leave.type} Leave</Badge>
                  </TableCell>
                  <TableCell className="font-medium text-xs text-zinc-800 dark:text-zinc-200">
                    {leave.start_date} <span className="text-zinc-400">to</span> {leave.end_date}
                  </TableCell>
                  <TableCell className="font-bold text-xs text-zinc-900 dark:text-white">
                    {leave.days || 1} {leave.days === 1 ? 'Day' : 'Days'}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xs truncate" title={leave.remarks}>
                    {leave.remarks || <span className="italic text-zinc-400">None</span>}
                  </TableCell>
                  <TableCell>
                    {leave.attachment_url ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                        <Paperclip className="w-3 h-3" /> Certificate
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-[11px]">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={leave.status}>{leave.status}</Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      {leave.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAdminDecision(leave.id, 'approved')}
                            className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdminDecision(leave.id, 'rejected')}
                            className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-medium text-zinc-400">Resolved</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Request Time Off Modal (Odoo Style with Attachment for Sick Leave) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Time Off"
        subtitle="Specify validity period, reason, and attachments where required"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Time Off Type *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
            >
              <option value="paid">Paid Time Off ({balances.paid.available} Days Available)</option>
              <option value="sick">Sick Leave ({balances.sick.available} Days Available)</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Start Date *</label>
              <input
                type="date"
                required
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">End Date *</label>
              <input
                type="date"
                required
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>
          </div>

          {formData.startDate && formData.endDate && (
            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 flex justify-between font-semibold">
              <span className="text-zinc-600 dark:text-zinc-400">Total Duration:</span>
              <span className="text-zinc-900 dark:text-white">{daysRequested} {daysRequested === 1 ? 'Working Day' : 'Working Days'}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Description / Reason</label>
            <textarea
              name="remarks"
              rows={2}
              value={formData.remarks}
              onChange={handleInputChange}
              placeholder="Reason for requesting time off..."
              className="w-full p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
            />
          </div>

          {/* Attachment (Required for Sick Leave > 2 days) */}
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Medical / Sick Leave Certificate {formData.type === 'sick' && daysRequested > 2 && <span className="text-rose-500">* (Required)</span>}
            </label>
            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
              <Upload className="w-4 h-4 text-zinc-400" />
              <span className="text-zinc-500 text-xs truncate">
                {formData.attachment ? `Attached: ${formData.attachment} ✓` : 'Upload PDF / Medical Certificate'}
              </span>
              <input type="file" accept=".pdf,image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold cursor-pointer shadow-xs"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
