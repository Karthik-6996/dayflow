// src/services/leaveService.js
import { supabase, IS_MOCK } from './supabaseClient';
import { mockLeaveRequests } from '../mocks/leaveRequests';
import { mockUsers } from '../mocks/users';
import { validateRow, isValidLeaveTransition } from '../lib/schema.js';

export async function submitLeaveRequest({ userId, type, startDate, endDate, remarks }) {
  if (IS_MOCK) {
    const newLeave = {
      id: `leave-${Date.now()}`,
      user_id: userId,
      type,
      start_date: startDate,
      end_date: endDate,
      remarks: remarks || '',
      status: 'pending',
      comments: null
    };

    const errors = validateRow('leave_requests', newLeave);
    if (errors.length > 0) {
      return { data: null, error: errors.join(', ') };
    }

    mockLeaveRequests.unshift(newLeave);
    return { data: newLeave, error: null };
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      user_id: userId,
      type,
      start_date: startDate,
      end_date: endDate,
      remarks: remarks || null,
      status: 'pending',
    })
    .select()
    .single();

  return { data, error: error?.message || null };
}

export async function getEmployeeLeaves(userId) {
  if (IS_MOCK) {
    const leaves = mockLeaveRequests
      .filter(l => l.user_id === userId)
      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    return { data: leaves, error: null };
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });

  return { data, error: error?.message || null };
}

export const getMyLeaves = getEmployeeLeaves;

export async function getAllLeaves({ statusFilter, typeFilter, status, userId } = {}) {
  const targetStatus = statusFilter || status;

  if (IS_MOCK) {
    let enriched = mockLeaveRequests.map(leave => {
      const user = mockUsers.find(u => u.id === leave.user_id) || { name: 'Unknown Employee', department: 'General', employee_id: 'N/A' };
      return {
        ...leave,
        users: {
          name: user.name,
          department: user.department,
          employee_id: user.employee_id
        }
      };
    });

    if (targetStatus && targetStatus !== 'all') {
      enriched = enriched.filter(l => l.status === targetStatus);
    }
    if (typeFilter && typeFilter !== 'all') {
      enriched = enriched.filter(l => l.type === typeFilter);
    }
    if (userId) {
      enriched = enriched.filter(l => l.user_id === userId);
    }

    enriched.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    return { data: enriched, error: null };
  }

  let query = supabase
    .from('leave_requests')
    .select('*, users(name, department, employee_id, job_title)')
    .order('start_date', { ascending: false });

  if (targetStatus && targetStatus !== 'all') query = query.eq('status', targetStatus);
  if (typeFilter && typeFilter !== 'all') query = query.eq('type', typeFilter);
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  return { data, error: error?.message || null };
}

export async function updateLeaveStatus(leaveId, { status, comments }) {
  if (IS_MOCK) {
    const record = mockLeaveRequests.find(l => l.id === leaveId);
    if (!record) return { data: null, error: 'Leave request not found' };

    if (!isValidLeaveTransition(record.status, status)) {
      return { data: null, error: `Invalid transition from ${record.status} to ${status}` };
    }

    record.status = status;
    record.comments = comments !== undefined ? comments : record.comments;
    return { data: record, error: null };
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .update({ status, comments: comments || null })
    .eq('id', leaveId)
    .select()
    .single();

  return { data, error: error?.message || null };
}

export async function transitionLeave({ leaveId, action, comments }) {
  const nextStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action;
  return updateLeaveStatus(leaveId, { status: nextStatus, comments });
}

export async function cancelLeaveRequest(leaveId, userId) {
  return updateLeaveStatus(leaveId, { status: 'cancelled', comments: 'Cancelled by employee' });
}

export const leaveService = {
  submitLeaveRequest,
  getEmployeeLeaves,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  transitionLeave,
  cancelLeaveRequest,
  validate: (row) => validateRow('leave_requests', row)
};
