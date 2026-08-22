// src/pages/admin/LeaveApprovalsPage.jsx
import React, { useState, useEffect } from 'react';
import { leaveService } from '../../services/leaveService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Paperclip,
  Check,
  X,
  Eye,
  Calendar,
  AlertCircle,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export const LeaveApprovalsPage = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionModal, setActionModal] = useState(null); // { leave, action: 'approved' | 'rejected' | 'view' }
  const [commentText, setCommentText] = useState('');
  const [actionError, setActionError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [viewDocModal, setViewDocModal] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await leaveService.getAllLeaves();
      if (error) console.warn("Error loading leaves:", error);
      setLeaves(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openActionModal = (leave, action) => {
    setActionModal({ leave, action });
    setCommentText(action === 'approved' ? 'Approved by Admin/HR' : '');
    setActionError('');
  };

  const handleConfirmAction = async (e) => {
    if (e) e.preventDefault();
    if (!actionModal) return;

    if (actionModal.action === 'rejected' && (!commentText || !commentText.trim())) {
      setActionError('A rejection reason is required.');
      return;
    }

    setProcessing(true);
    setActionError('');

    try {
      const res = await leaveService.updateLeaveStatus(actionModal.leave.id, {
        status: actionModal.action,
        comments: commentText.trim() || (actionModal.action === 'approved' ? 'Approved by Admin/HR' : 'Declined per policy')
      });

      if (res && res.error) {
        setActionError(res.error || "Failed to update status");
        toast.error(res.error || "Failed to update status");
      } else {
        toast.success(`Leave request ${actionModal.action} successfully!`);
        // Update locally in state immediately for fast feedback
        setLeaves(prev => prev.map(l => l.id === actionModal.leave.id ? { ...l, status: actionModal.action, comments: commentText } : l));
        setActionModal(null);
        await loadData();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setProcessing(false);
    }
  };

  const filteredLeaves = leaves.filter((l) => {
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const name = l.users?.name || '';
    const id = l.users?.employee_id || '';
    const dept = l.users?.department || '';
    const q = searchQuery.toLowerCase();
    const matchesSearch = name.toLowerCase().includes(q) || id.toLowerCase().includes(q) || dept.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = leaves.filter(l => l.status === 'pending').length;
  const approvedCount = leaves.filter(l => l.status === 'approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'rejected').length;

  return (
    <div className="space-y-5 animate-fade-in text-zinc-900 dark:text-zinc-100 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Leave Approvals</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              HR Administration
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Review and decide on employee time-off applications, reasons, and supporting certificates
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          title="Pending Queue"
          value={pendingCount}
          subtitle="Awaiting supervisor action"
          icon={Clock}
        />
        <StatCard
          title="Approved Requests"
          value={approvedCount}
          subtitle="Granted time-off records"
          icon={CheckCircle}
        />
        <StatCard
          title="Declined / Rejected"
          value={rejectedCount}
          subtitle="Declined applications"
          icon={XCircle}
        />
      </div>

      {/* Search & Status Filter Bar */}
      <Card className="p-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee, ID, department..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg overflow-x-auto">
            {['pending', 'approved', 'rejected', 'all'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Compact Leave Requests List (No Horizontal Slider) */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-zinc-400 text-xs">Loading leave requests...</div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-xs">No time-off requests matching filter.</div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredLeaves.map((leave) => {
              const daysCount = leave.days || leave.days_count || 1;
              const isPending = leave.status === 'pending';

              return (
                <div
                  key={leave.id}
                  className="p-4 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* Left: Employee Info */}
                  <div className="flex items-center gap-3 min-w-[220px]">
                    <Avatar name={leave.users?.name || 'Staff'} size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-zinc-900 dark:text-white">
                          {leave.users?.name || 'Staff Member'}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                          {leave.users?.employee_id || 'DF-1000'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500">{leave.users?.department || 'Operations'}</p>
                    </div>
                  </div>

                  {/* Middle: Leave Type, Dates & Duration */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Badge variant={leave.type}>{leave.type} Leave</Badge>

                    <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1 rounded-md">
                      <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span>{leave.start_date}</span>
                      {leave.start_date !== leave.end_date && (
                        <>
                          <span className="text-zinc-400">→</span>
                          <span>{leave.end_date}</span>
                        </>
                      )}
                      <span className="font-bold text-zinc-900 dark:text-white ml-1">
                        ({daysCount} {daysCount === 1 ? 'day' : 'days'})
                      </span>
                    </div>

                    {leave.attachment_url || leave.document_name ? (
                      <button
                        type="button"
                        onClick={() => setViewDocModal({ name: leave.document_name || 'Medical Certificate', url: leave.attachment_url || leave.document_url })}
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                      >
                        <Paperclip className="w-3 h-3" /> Certificate
                      </button>
                    ) : null}
                  </div>

                  {/* Right: Remarks, Status Badge & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                    {leave.remarks ? (
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 italic max-w-[200px] truncate hidden lg:inline-block" title={leave.remarks}>
                        "{leave.remarks}"
                      </span>
                    ) : null}

                    <Badge variant={leave.status}>{leave.status}</Badge>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openActionModal(leave, 'view')}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5 inline mr-1" /> View
                      </button>

                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => openActionModal(leave, 'approved')}
                            className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-xs flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => openActionModal(leave, 'rejected')}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer shadow-xs flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Decision & Details Modal */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        title={
          actionModal?.action === 'approved'
            ? 'Approve Leave Request'
            : actionModal?.action === 'rejected'
            ? 'Reject Leave Request'
            : 'Leave Request Details'
        }
        subtitle={`Employee: ${actionModal?.leave?.users?.name || 'Staff'}`}
      >
        {actionModal && (
          <form onSubmit={handleConfirmAction} className="space-y-4 text-xs">
            {actionError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {actionError}
              </div>
            )}

            {/* Leave Details Summary */}
            <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Employee:</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {actionModal.leave.users?.name || 'Staff'} ({actionModal.leave.users?.employee_id || 'DF-1000'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Department:</span>
                <span className="text-zinc-800 dark:text-zinc-200">{actionModal.leave.users?.department || 'Operations'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Leave Category:</span>
                <Badge variant={actionModal.leave.type}>{actionModal.leave.type} Leave</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Dates & Duration:</span>
                <span className="font-bold text-zinc-900 dark:text-white font-mono">
                  {actionModal.leave.start_date} to {actionModal.leave.end_date} ({actionModal.leave.days || actionModal.leave.days_count || 1} Days)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Employee Remarks:</span>
                <span className="text-zinc-800 dark:text-zinc-200 italic max-w-xs">
                  "{actionModal.leave.remarks || 'No remarks provided'}"
                </span>
              </div>
              {actionModal.leave.comments && (
                <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-500">Admin Remarks:</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{actionModal.leave.comments}</span>
                </div>
              )}
            </div>

            {actionModal.action === 'view' ? (
              <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                {actionModal.action === 'approved' ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>
                      Approving will grant <strong>{actionModal.leave.days || actionModal.leave.days_count || 1} days</strong> of {actionModal.leave.type} leave to {actionModal.leave.users?.name || 'the employee'}.
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>
                      <strong>A rejection reason is required</strong> and will be visible to the employee.
                    </span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {actionModal.action === 'approved' ? 'HR Remarks (Optional)' : 'Rejection Reason *'}
                  </label>
                  <textarea
                    rows={3}
                    required={actionModal.action === 'rejected'}
                    value={commentText}
                    onChange={(e) => {
                      setCommentText(e.target.value);
                      setActionError('');
                    }}
                    placeholder={
                      actionModal.action === 'approved'
                        ? 'Add optional remarks for the employee...'
                        : 'Enter reason for rejection (e.g. Milestone delivery week, insufficient team coverage)...'
                    }
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setActionModal(null)}
                    className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className={`px-5 py-2 rounded-lg text-white font-semibold cursor-pointer transition ${
                      actionModal.action === 'approved'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {processing ? 'Updating...' : `Confirm ${actionModal.action === 'approved' ? 'Approval' : 'Rejection'}`}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </Modal>

      {/* Certificate Viewer Modal */}
      <Modal
        isOpen={!!viewDocModal}
        onClose={() => setViewDocModal(null)}
        title="Supporting Certificate"
        subtitle={viewDocModal?.name}
      >
        {viewDocModal && (
          <div className="space-y-4 text-xs text-center py-4">
            <FileText className="w-12 h-12 text-indigo-600 mx-auto" />
            <p className="font-semibold text-zinc-900 dark:text-white">{viewDocModal.name}</p>
            <p className="text-zinc-500">Supporting document attached by the employee for time-off verification.</p>
            <div className="flex justify-center gap-2 pt-3">
              <button
                type="button"
                onClick={() => setViewDocModal(null)}
                className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

