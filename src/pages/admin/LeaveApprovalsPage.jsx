// src/pages/admin/LeaveApprovalsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { leaveService } from '../../services/leaveService';
import { userService } from '../../services/userService';
import { calculateWorkingDays } from '../../lib/leaveValidation';
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
  Filter,
  Search,
  Paperclip,
  ExternalLink,
  FileText,
  Ban,
  Check,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

export const LeaveApprovalsPage = () => {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending', 'approved', 'rejected', 'cancelled', 'all'
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Decision Modal State
  const [decisionModal, setDecisionModal] = useState(null); // { leave, action: 'approved' | 'rejected' }
  const [commentText, setCommentText] = useState('');
  const [decisionError, setDecisionError] = useState('');
  const [processing, setProcessing] = useState(false);

  // Document Viewer Modal State
  const [viewDocModal, setViewDocModal] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [leavesRes, usersRes] = await Promise.all([
        leaveService.getAllLeaves(),
        userService.getAllEmployees()
      ]);

      if (leavesRes.error) toast.error("Error loading leave applications");
      setLeaves(leavesRes.data || []);
      setEmployees(usersRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDecision = (leave, action) => {
    setDecisionModal({ leave, action });
    setDecisionError('');
    setCommentText(
      action === 'approved'
        ? 'Approved by HR Operations.'
        : ''
    );
  };

  const handleConfirmDecision = async (e) => {
    e.preventDefault();
    if (!decisionModal) return;

    // Strict validation: Rejection requires a non-empty reason
    if (decisionModal.action === 'rejected' && (!commentText || !commentText.trim())) {
      setDecisionError('A reason is mandatory when rejecting a leave request.');
      return;
    }

    setProcessing(true);
    setDecisionError('');
    try {
      const { data, error } = await leaveService.updateLeaveStatus(decisionModal.leave.id, {
        status: decisionModal.action,
        comments: commentText.trim()
      });

      if (error) {
        setDecisionError(error);
        toast.error(error);
      } else {
        toast.success(
          decisionModal.action === 'approved'
            ? `Leave request approved! Leave balance deducted.`
            : `Leave request rejected.`
        );
        setDecisionModal(null);
        setCommentText('');
        await loadData();
      }
    } finally {
      setProcessing(false);
    }
  };

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      // Status filter
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;

      // Employee filter
      if (employeeFilter !== 'all' && l.user_id !== employeeFilter) return false;

      // Leave Type filter
      if (typeFilter !== 'all' && l.type !== typeFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empName = l.users?.name?.toLowerCase() || '';
        const empId = l.users?.employee_id?.toLowerCase() || '';
        const dept = l.users?.department?.toLowerCase() || '';
        const remarks = l.remarks?.toLowerCase() || '';
        if (!empName.includes(q) && !empId.includes(q) && !dept.includes(q) && !remarks.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [leaves, statusFilter, employeeFilter, typeFilter, searchQuery]);

  const pendingLeavesCount = leaves.filter(l => l.status === 'pending').length;
  const approvedLeavesCount = leaves.filter(l => l.status === 'approved').length;
  const rejectedLeavesCount = leaves.filter(l => l.status === 'rejected').length;
  const cancelledLeavesCount = leaves.filter(l => l.status === 'cancelled').length;

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
          <p className="text-xs text-slate-500 mt-1">Review pending leave applications, approve vacation requests with automatic balance deduction, or provide rejection remarks</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Awaiting Review"
          value={pendingLeavesCount.toString()}
          subtitle="Action required by HR"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Approved Grants"
          value={approvedLeavesCount.toString()}
          subtitle="Balances deducted automatically"
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Declined / Rejected"
          value={rejectedLeavesCount.toString()}
          subtitle="With HR rejection reasons"
          icon={XCircle}
          color="rose"
        />
        <StatCard
          title="Cancelled by Staff"
          value={cancelledLeavesCount.toString()}
          subtitle="Restored to staff quota"
          icon={Ban}
          color="purple"
        />
      </div>

      {/* Search and Filters Toolbar */}
      <Card className="p-4 bg-white space-y-3">
        {/* Quick Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
          {[
            { id: 'pending', label: 'Pending Review', count: pendingLeavesCount },
            { id: 'approved', label: 'Approved', count: approvedLeavesCount },
            { id: 'rejected', label: 'Rejected', count: rejectedLeavesCount },
            { id: 'cancelled', label: 'Cancelled', count: cancelledLeavesCount },
            { id: 'all', label: 'All Requests', count: leaves.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
                statusFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === tab.id
                  ? 'bg-purple-700 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter Controls Row: Employee, Leave Type, Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Employee Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Filter by Employee
            </label>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
            >
              <option value="all">All Employees ({employees.length})</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employee_id} - {emp.department})
                </option>
              ))}
            </select>
          </div>

          {/* Leave Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Filter by Leave Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
            >
              <option value="all">All Leave Types</option>
              <option value="paid">Paid Time Off (PTO)</option>
              <option value="sick">Sick / Medical Leave</option>
              <option value="unpaid">Unpaid Sabbatical</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Search by Keyword
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff, dept, remarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader
          title={statusFilter === 'pending' ? 'Pending Applications Queue' : 'Leave Requests & Governance History'}
          subtitle={`Showing ${filteredLeaves.length} records matching current filters`}
        />

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading leave requests...
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            No leave requests found matching the current filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Duration & Dates</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Status & Remarks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaves.map((l) => {
                const days = l.days_count !== undefined
                  ? l.days_count
                  : calculateWorkingDays(l.start_date, l.end_date, l.is_half_day);

                return (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {l.users?.profile_pic ? (
                            <img src={l.users.profile_pic} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            l.users?.name?.slice(0, 2) || 'DF'
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{l.users?.name || 'Staff Member'}</p>
                          <p className="text-[10px] text-slate-400">{l.users?.employee_id || 'ID'} · {l.users?.department || 'General'}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={l.type}>{l.type} Leave</Badge>
                        {l.is_half_day && (
                          <span className="block text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 w-fit">
                            Half Day ({l.half_day_session === 'first_half' ? 'Morning' : 'Afternoon'})
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-semibold text-slate-800">
                        {l.start_date === l.end_date ? (
                          l.start_date
                        ) : (
                          <span>{l.start_date} <span className="text-slate-400 font-normal">to</span> {l.end_date}</span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                        {days} {days === 1 ? 'Working Day' : 'Working Days'}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs text-slate-600 max-w-xs">
                      {l.remarks ? (
                        <p className="truncate" title={l.remarks}>{l.remarks}</p>
                      ) : (
                        <span className="italic text-slate-400">None</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {l.document_name ? (
                        <button
                          type="button"
                          onClick={() => setViewDocModal({ name: l.document_name, url: l.document_url })}
                          className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg border border-purple-200/70 transition-all cursor-pointer font-medium max-w-[130px] truncate"
                          title={l.document_name}
                        >
                          <Paperclip className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{l.document_name}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">None</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant={l.status}>{l.status}</Badge>
                      {l.comments && (
                        <p className="text-[10px] text-slate-500 mt-1 max-w-[160px] truncate" title={l.comments}>
                          Note: {l.comments}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDecisionModal({ leave: l, action: 'view' })}
                          className="text-slate-600 hover:text-slate-900 text-xs px-2 py-1"
                          title="View complete details"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Details
                        </Button>
                        {isPending ? (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => openDecision(l, 'approved')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-xs px-2.5 py-1"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => openDecision(l, 'rejected')}
                              className="bg-rose-600 hover:bg-rose-700 text-xs px-2.5 py-1"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Reject
                            </Button>
                          </>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400 capitalize">
                            {l.status}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Decision & Remarks Modal */}
      <Modal
        isOpen={!!decisionModal}
        onClose={() => setDecisionModal(null)}
        title={
          decisionModal?.action === 'approved'
            ? 'Approve Leave Request'
            : decisionModal?.action === 'rejected'
            ? 'Reject Leave Request'
            : 'Leave Request Details'
        }
        subtitle={`Employee: ${decisionModal?.leave?.users?.name} (${decisionModal?.leave?.type} leave)`}
      >
        {decisionModal && (
          <form onSubmit={handleConfirmDecision} className="space-y-4">
            {decisionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {decisionError}
              </div>
            )}

            {/* Leave Details Summary Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee:</span>
                <span className="font-bold text-slate-800">{decisionModal.leave.users?.name} ({decisionModal.leave.users?.department || 'General'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Employee ID:</span>
                <span className="font-semibold text-slate-700">{decisionModal.leave.users?.employee_id || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Leave Category:</span>
                <Badge variant={decisionModal.leave.type}>{decisionModal.leave.type} Leave</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Dates:</span>
                <span className="font-bold text-slate-800">
                  {decisionModal.leave.start_date} to {decisionModal.leave.end_date}
                  {decisionModal.leave.is_half_day ? ' (Half Day)' : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Calculated Working Days:</span>
                <span className="font-bold text-purple-700">{decisionModal.leave.days_count} Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <Badge variant={decisionModal.leave.status}>{decisionModal.leave.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Employee Reason:</span>
                <span className="text-slate-700 italic max-w-xs">"{decisionModal.leave.remarks || 'None provided'}"</span>
              </div>
              {decisionModal.leave.comments && (
                <div className="flex justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">HR / Approver Remarks:</span>
                  <span className="font-semibold text-slate-800">{decisionModal.leave.comments}</span>
                </div>
              )}
              {decisionModal.leave.document_name && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Attached Document:</span>
                  <button
                    type="button"
                    onClick={() => setViewDocModal({ name: decisionModal.leave.document_name, url: decisionModal.leave.document_url })}
                    className="text-xs text-purple-700 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    {decisionModal.leave.document_name}
                  </button>
                </div>
              )}
            </div>

            {decisionModal.action === 'view' ? (
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="ghost" onClick={() => setDecisionModal(null)}>
                  Close
                </Button>
              </div>
            ) : (
              <>
                {/* Automatic deduction notification if approving */}
                {decisionModal.action === 'approved' ? (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <span>
                      Approving this request will automatically deduct <strong>{decisionModal.leave.days_count} working days</strong> from {decisionModal.leave.users?.name}'s {decisionModal.leave.type} leave balance.
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>
                      <strong>A rejection reason is required.</strong> This reason will be recorded in the audit trail and visible to the employee.
                    </span>
                  </div>
                )}

                {/* Comments Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {decisionModal.action === 'approved' ? 'HR Approval Remarks (Optional)' : 'Rejection Reason / Comments *'}
                  </label>
                  <textarea
                    rows={3}
                    required={decisionModal.action === 'rejected'}
                    value={commentText}
                    onChange={(e) => {
                      setCommentText(e.target.value);
                      setDecisionError('');
                    }}
                    placeholder={
                      decisionModal.action === 'approved'
                        ? 'Add optional remarks for the employee record...'
                        : 'Enter specific reason for rejection (e.g. Critical project milestone, team coverage requirements)...'
                    }
                    className={`w-full p-3 text-xs rounded-xl border focus:ring-2 transition-all ${
                      decisionModal.action === 'rejected' && (!commentText || !commentText.trim())
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
                        : 'border-slate-200 focus:border-purple-600 focus:ring-purple-100'
                    }`}
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
              </>
            )}
          </form>
        )}
      </Modal>

      {/* Document Viewer Modal */}
      <Modal
        isOpen={!!viewDocModal}
        onClose={() => setViewDocModal(null)}
        title="Supporting Document Attachment"
        subtitle={viewDocModal?.name}
      >
        {viewDocModal && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <FileText className="w-12 h-12 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">{viewDocModal.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">Attached supporting documentation for leave</p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setViewDocModal(null)}>
                Close
              </Button>
              {viewDocModal.url && (
                <a
                  href={viewDocModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={viewDocModal.name}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open / Download File
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

