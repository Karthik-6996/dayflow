// src/pages/employee/LeavesPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { leaveService } from '../../services/leaveService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea, Select } from '../../components/ui/Input';
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
  ShieldAlert,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export const LeavesPage = () => {
  const { currentUser } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Form State
  const [formData, setFormData] = useState({
    type: 'paid',
    startDate: '',
    endDate: '',
    remarks: ''
  });
  const [formError, setFormError] = useState('');

  const loadLeaves = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const { data, error } = await leaveService.getEmployeeLeaves(currentUser.id);
      if (error) toast.error("Error loading leave requests");
      setLeaves(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [currentUser]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
        remarks: formData.remarks
      });

      if (error) {
        setFormError(error);
      } else {
        toast.success("Leave request submitted for approval!");
        setIsModalOpen(false);
        setFormData({ type: 'paid', startDate: '', endDate: '', remarks: '' });
        await loadLeaves();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLeaves = leaves.filter(l => {
    if (statusFilter === 'all') return true;
    return l.status === statusFilter;
  });

  const pendingCount = leaves.filter(l => l.status === 'pending').length;
  const approvedCount = leaves.filter(l => l.status === 'approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'rejected').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Time Off & Leave Management</h1>
          <p className="text-xs text-slate-500 mt-1">Apply for paid time off, medical sick leave, and track approval status</p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
          className="self-start shadow-md shadow-teal-600/20"
        >
          Request Leave
        </Button>
      </div>

      {/* Leave Balances / Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Paid Time Off (PTO)"
          value="14 Days"
          subtitle="Annual allowance balance"
          icon={CalendarDays}
          color="teal"
        />
        <StatCard
          title="Medical / Sick Leave"
          value="5 Days"
          subtitle="Available for health events"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Pending Approvals"
          value={pendingCount.toString()}
          subtitle="Awaiting HR review"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Total Approved (YTD)"
          value={`${approvedCount} Grants`}
          subtitle={`${rejectedCount} Declined applications`}
          icon={FileText}
          color="purple"
        />
      </div>

      {/* Leave Requests Table */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">My Leave Applications</h3>
            <p className="text-xs text-slate-500 mt-0.5">Complete record of your submitted requests</p>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading leave requests...
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            No {statusFilter !== 'all' ? statusFilter : ''} leave applications found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Employee Remarks</TableHead>
                <TableHead>Approval Status</TableHead>
                <TableHead>HR Feedback / Comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaves.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell>
                    <Badge variant={leave.type}>{leave.type}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">{leave.start_date}</TableCell>
                  <TableCell className="font-semibold text-slate-900">{leave.end_date}</TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-xs truncate" title={leave.remarks}>
                    {leave.remarks || <span className="italic text-slate-400">None provided</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={leave.status}>{leave.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {leave.comments ? (
                      <span className="text-slate-700 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
                        {leave.comments}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">No notes yet</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Request Leave Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit Leave Request"
        subtitle="Specify leave category, dates, and purpose for HR review"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Leave Category *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all"
            >
              <option value="paid">Paid Time Off (PTO / Vacation)</option>
              <option value="sick">Medical & Sick Leave</option>
              <option value="unpaid">Unpaid Leave / Sabbatical</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Date *
              </label>
              <input
                type="date"
                required
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                End Date *
              </label>
              <input
                type="date"
                required
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Reason / Remarks
            </label>
            <textarea
              name="remarks"
              rows={3}
              value={formData.remarks}
              onChange={handleInputChange}
              placeholder="e.g. Attending a family wedding out of town..."
              className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all"
            />
          </div>

          <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-xs text-teal-800 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-teal-600" />
            <span>
              Once submitted, your request will be routed to HR for review. Valid leave status transitions follow the company schema rules.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
