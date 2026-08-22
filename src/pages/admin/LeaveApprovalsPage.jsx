// src/pages/admin/LeaveApprovalsPage.jsx
import React, { useState, useEffect } from 'react';
import { leaveService } from '../../services/leaveService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { Avatar } from '../../components/ui/Avatar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Check,
  X,
  Eye,
  Calendar,
  AlertCircle,
  FileText,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

export const LeaveApprovalsPage = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending'); // default to pending queue
  const [searchQuery, setSearchQuery] = useState('');
  const [actionModal, setActionModal] = useState(null); // { leave, action: 'approved' | 'rejected' | 'view' }
  const [commentText, setCommentText] = useState('');
  const [actionError, setActionError] = useState('');
  const [processing, setProcessing] = useState(false);

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
      setActionError('A reason for rejection is required.');
      return;
    }

    setProcessing(true);
    setActionError('');

    try {
      const comments = commentText.trim() || (actionModal.action === 'approved' ? 'Approved by Admin/HR' : 'Declined per policy');
      const res = await leaveService.updateLeaveStatus(actionModal.leave.id, {
        status: actionModal.action,
        comments
      });

      if (res && res.error) {
        setActionError(res.error || "Failed to update status");
        toast.error(res.error || "Failed to update status");
      } else {
        toast.success(`Leave request ${actionModal.action === 'approved' ? 'Approved' : 'Rejected'} successfully!`);
        // Immediate local state update
        setLeaves(prev => prev.map(l => l.id === actionModal.leave.id ? { ...l, status: actionModal.action, comments } : l));
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

  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const approvedLeaves = leaves.filter(l => l.status === 'approved');
  const rejectedLeaves = leaves.filter(l => l.status === 'rejected');

  const filteredLeaves = leaves.filter((l) => {
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const name = l.users?.name || '';
    const id = l.users?.employee_id || '';
    const dept = l.users?.department || '';
    const q = searchQuery.toLowerCase();
    const matchesSearch = name.toLowerCase().includes(q) || id.toLowerCase().includes(q) || dept.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Leave Approvals & Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Admin / HR
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Review all employee leave requests, approve or reject applications, and add comments
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Approvals</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingLeaves.length}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Awaiting decision</p>
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
              <p className="text-xs text-zinc-500 mt-0.5">Granted leaves</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Rejected Requests</p>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{rejectedLeaves.length}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Declined applications</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Status Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by employee name, ID, or department..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl overflow-x-auto">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-amber-600'
              }`}
            >
              Pending ({pendingLeaves.length})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-emerald-600'
              }`}
            >
              Approved ({approvedLeaves.length})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                statusFilter === 'rejected'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-rose-600'
              }`}
            >
              Rejected ({rejectedLeaves.length})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              All Requests ({leaves.length})
            </button>
          </div>
        </div>
      </Card>

      {/* Requests List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-zinc-400 text-xs">Loading leave requests...</div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-xs">
            No {statusFilter !== 'all' ? statusFilter : ''} leave requests found matching search criteria.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Dates & Duration</TableHead>
                <TableHead>Employee Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>HR Feedback</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaves.map((leave) => {
                const daysCount = leave.days || leave.days_count || 1;
                const isPending = leave.status === 'pending';

                return (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={leave.users?.name || 'Staff'} size="sm" />
                        <div>
                          <p className="font-bold text-xs text-zinc-900 dark:text-white">{leave.users?.name || 'Staff Member'}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{leave.users?.employee_id || 'DF-1000'} • {leave.users?.department || 'General'}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={leave.type}>{leave.type} Leave</Badge>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {leave.start_date} {leave.start_date !== leave.end_date ? `to ${leave.end_date}` : ''}
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500">
                        {daysCount} {daysCount === 1 ? 'day' : 'days'}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs text-zinc-700 dark:text-zinc-300 max-w-xs truncate" title={leave.remarks}>
                      {leave.remarks || <span className="text-zinc-400 italic">No remarks</span>}
                    </TableCell>

                    <TableCell>
                      <Badge variant={leave.status}>{leave.status}</Badge>
                    </TableCell>

                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xs">
                      {leave.comments ? (
                        <div className="flex items-center gap-1 text-zinc-800 dark:text-zinc-200 font-medium">
                          <MessageSquare className="w-3 h-3 text-purple-600 shrink-0" />
                          <span className="truncate">{leave.comments}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openActionModal(leave, 'approved')}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => openActionModal(leave, 'rejected')}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openActionModal(leave, 'view')}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" /> View
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Approve / Reject / View Modal */}
      {actionModal && (
        <Modal
          isOpen={!!actionModal}
          onClose={() => setActionModal(null)}
          title={
            actionModal.action === 'approved'
              ? 'Approve Leave Application'
              : actionModal.action === 'rejected'
              ? 'Reject Leave Application'
              : 'Leave Application Details'
          }
          subtitle={`Employee: ${actionModal.leave.users?.name || 'Staff'}`}
        >
          <form onSubmit={handleConfirmAction} className="space-y-4 text-xs">
            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {actionError}
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Employee:</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {actionModal.leave.users?.name} ({actionModal.leave.users?.employee_id})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Department:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{actionModal.leave.users?.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Leave Type:</span>
                <Badge variant={actionModal.leave.type}>{actionModal.leave.type} Leave</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Dates:</span>
                <span className="font-bold text-zinc-900 dark:text-white font-mono">
                  {actionModal.leave.start_date} to {actionModal.leave.end_date} ({actionModal.leave.days || actionModal.leave.days_count || 1} Days)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Employee Remarks:</span>
                <span className="text-zinc-800 dark:text-zinc-200 italic max-w-xs">
                  "{actionModal.leave.remarks || 'None'}"
                </span>
              </div>
            </div>

            {actionModal.action === 'view' ? (
              <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button type="button" variant="ghost" onClick={() => setActionModal(null)}>
                  Close
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    {actionModal.action === 'approved' ? 'HR Comments (Optional)' : 'Rejection Reason *'}
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
                        ? 'Add optional comments for the employee...'
                        : 'Enter mandatory reason for rejection (e.g. overlapping sprint deliverable)...'
                    }
                    className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:border-purple-600"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <Button type="button" variant="ghost" onClick={() => setActionModal(null)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={processing}
                    className={
                      actionModal.action === 'approved'
                        ? 'bg-emerald-600 hover:bg-emerald-700 font-bold'
                        : 'bg-rose-600 hover:bg-rose-700 font-bold'
                    }
                  >
                    Confirm {actionModal.action === 'approved' ? 'Approval' : 'Rejection'}
                  </Button>
                </div>
              </>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
};
