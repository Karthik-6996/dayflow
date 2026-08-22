// src/pages/admin/LeaveApprovalsPage.jsx
import React, { useState, useEffect } from 'react';
import { leaveService } from '../../services/leaveService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { StatCard } from '../../components/ui/StatCard';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  AlertCircle,
  Calendar,
  User,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

export const LeaveApprovalsPage = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending, all, history
  const [decisionModal, setDecisionModal] = useState(null); // { leave, action: 'approved' | 'rejected' }
  const [commentText, setCommentText] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadLeaves = async () => {
    setLoading(true);
    try {
      const { data, error } = await leaveService.getAllLeaves();
      if (error) toast.error("Error loading leave applications");
      setLeaves(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const openDecision = (leave, action) => {
    setDecisionModal({ leave, action });
    setCommentText(action === 'approved' ? 'Approved by HR Operations.' : 'Unable to approve due to team capacity constraints.');
  };

  const handleConfirmDecision = async (e) => {
    e.preventDefault();
    if (!decisionModal) return;

    setProcessing(true);
    try {
      const { data, error } = await leaveService.updateLeaveStatus(decisionModal.leave.id, {
        status: decisionModal.action,
        comments: commentText
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success(`Leave request marked as ${decisionModal.action}!`);
        setDecisionModal(null);
        setCommentText('');
        await loadLeaves();
      }
    } finally {
      setProcessing(false);
    }
  };

  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const resolvedLeaves = leaves.filter(l => l.status !== 'pending');
  const displayedLeaves = activeTab === 'pending' ? pendingLeaves : activeTab === 'history' ? resolvedLeaves : leaves;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Approvals & Governance</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Admin & HR Ops
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Review pending leave applications, approve vacation requests, or provide feedback remarks</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Awaiting Review"
          value={pendingLeaves.length.toString()}
          subtitle="Action required by HR"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Approved (All Time)"
          value={leaves.filter(l => l.status === 'approved').length.toString()}
          subtitle="Granted leaves"
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Declined / Rejected"
          value={leaves.filter(l => l.status === 'rejected').length.toString()}
          subtitle="Requires employee re-application"
          icon={XCircle}
          color="rose"
        />
      </div>

      {/* Tab bar */}
      <Card className="p-2 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'pending'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Pending Review</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'pending' ? 'bg-purple-700 text-white' : 'bg-amber-100 text-amber-800 font-bold'}`}>
              {pendingLeaves.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Decisions History ({resolvedLeaves.length})
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Requests ({leaves.length})
          </button>
        </div>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader
          title={activeTab === 'pending' ? 'Pending Applications Queue' : 'Leave Requests History'}
          subtitle={`Showing ${displayedLeaves.length} records`}
        />

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading leave requests...
          </div>
        ) : displayedLeaves.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            No leave requests in this view. All caught up!
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Duration / Dates</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedLeaves.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-slate-900 leading-tight">{l.users?.name || 'Staff'}</p>
                      <p className="text-[10px] text-slate-400">{l.users?.department || 'General'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={l.type}>{l.type}</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-800">
                    {l.start_date} <span className="text-slate-400">to</span> {l.end_date}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-xs truncate" title={l.remarks}>
                    {l.remarks || <span className="italic text-slate-400">None</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={l.status}>{l.status}</Badge>
                    {l.comments && (
                      <p className="text-[10px] text-slate-500 mt-1 max-w-[150px] truncate" title={l.comments}>
                        Note: {l.comments}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {l.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => openDecision(l, 'approved')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-xs px-2.5 py-1"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => openDecision(l, 'rejected')}
                          className="bg-rose-600 hover:bg-rose-700 text-xs px-2.5 py-1"
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400">
                        Resolved
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Decision & Remarks Modal */}
      <Modal
        isOpen={!!decisionModal}
        onClose={() => setDecisionModal(null)}
        title={decisionModal?.action === 'approved' ? 'Approve Leave Request' : 'Decline Leave Request'}
        subtitle={`Employee: ${decisionModal?.leave?.users?.name} (${decisionModal?.leave?.type} leave)`}
      >
        {decisionModal && (
          <form onSubmit={handleConfirmDecision} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Dates:</span>
                <span className="font-bold text-slate-800">{decisionModal.leave.start_date} to {decisionModal.leave.end_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Employee Remarks:</span>
                <span className="text-slate-700 italic">"{decisionModal.leave.remarks || 'None'}"</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                HR Comments / Feedback to Employee
              </label>
              <textarea
                rows={3}
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add optional explanatory notes..."
                className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setDecisionModal(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={decisionModal.action === 'approved' ? 'success' : 'danger'}
                loading={processing}
                className={decisionModal.action === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
              >
                Confirm {decisionModal.action === 'approved' ? 'Approval' : 'Rejection'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
