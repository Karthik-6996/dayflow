// src/pages/admin/LeaveApprovalsPage.jsx
import React, { useState, useEffect } from 'react';
import { leaveService } from '../../services/leaveService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { StatCard } from '../../components/ui/StatCard';
import {
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Search,
  Paperclip,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export const LeaveApprovalsPage = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
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
    loadData();
  }, []);

  const handleDecision = async (leaveId, action) => {
    try {
      const { error } = await leaveService.updateLeaveStatus(leaveId, {
        status: action,
        comments: action === 'approved' ? 'Approved by Admin/HR' : 'Declined per team scheduling'
      });

      if (error) {
        toast.error("Failed to update status");
      } else {
        toast.success(`Leave request ${action} successfully!`);
        await loadData();
      }
    } catch (e) {
      toast.error("An error occurred while updating status");
    }
  };

  const filteredLeaves = leaves.filter((l) => {
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const name = l.users?.name || '';
    const id = l.users?.employee_id || '';
    const q = searchQuery.toLowerCase();
    const matchesSearch = name.toLowerCase().includes(q) || id.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = leaves.filter(l => l.status === 'pending').length;
  const approvedCount = leaves.filter(l => l.status === 'approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'rejected').length;

  return (
    <div className="space-y-6 animate-fade-in text-zinc-900 dark:text-zinc-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Leave Approvals</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              Admin & HR Officer
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Review pending employee time-off requests, medical certificates, and manage balances
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending Requests"
          value={pendingCount}
          subtitle="Requires supervisor action"
          icon={Clock}
        />
        <StatCard
          title="Approved This Month"
          value={approvedCount}
          subtitle="Granted time-off records"
          icon={CheckCircle}
        />
        <StatCard
          title="Rejected / Declined"
          value={rejectedCount}
          subtitle="Declined applications"
          icon={XCircle}
        />
      </div>

      {/* Leave Requests Table (Odoo Wireframe Style) */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee or ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg">
            {['pending', 'approved', 'rejected', 'all'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition cursor-pointer ${
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

        {loading ? (
          <div className="py-12 text-center text-zinc-400 text-xs">Loading records...</div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-xs">No time-off requests matching filter.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Time Off Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Number of Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Attachment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaves.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell>
                    <p className="font-semibold text-zinc-900 dark:text-white text-xs">{leave.users?.name || 'Staff'}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{leave.users?.employee_id || 'DF-1000'}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={leave.type}>{leave.type} Leave</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-800 dark:text-zinc-200">{leave.start_date}</TableCell>
                  <TableCell className="text-xs text-zinc-800 dark:text-zinc-200">{leave.end_date}</TableCell>
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
                  <TableCell className="text-right">
                    {leave.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDecision(leave.id, 'approved')}
                          className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecision(leave.id, 'rejected')}
                          className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-medium text-zinc-400">Resolved</span>
                    )}
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
