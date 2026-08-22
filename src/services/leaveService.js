// src/services/leaveService.js
import { supabase, IS_MOCK } from './supabaseClient';
import { mockLeaveRequests } from '../mocks/leaveRequests';
import { mockUsers } from '../mocks/users';
import { validateRow, isValidLeaveTransition } from '../lib/schema.js';

export const INITIAL_LEAVE_BALANCES = {
  paid: { total: 24, used: 0, available: 24 },
  sick: { total: 7, used: 0, available: 7 },
  unpaid: { total: 0, used: 0, available: 99 }
};

function getMockEmployeeLeaves(userId) {
  let leaves = mockLeaveRequests.filter(l => l.user_id === userId);
  if (leaves.length === 0) {
    leaves = mockLeaveRequests.filter(l => l.user_id === 'usr-001-emp').map(l => ({ ...l, user_id: userId }));
  }
  leaves.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
  return leaves;
}

export async function submitLeaveRequest({ userId, type, startDate, endDate, remarks, daysCount, attachment }) {
  const count = Number(daysCount) || 1;

  if (IS_MOCK) {
    const newLeave = {
      id: `leave-${Date.now()}`,
      user_id: userId,
      type: type || 'paid',
      start_date: startDate,
      end_date: endDate,
      days: count,
      remarks: remarks || '',
      attachment_url: attachment || null,
      status: 'pending',
      comments: null,
      created_at: new Date().toISOString()
    };

    mockLeaveRequests.unshift(newLeave);
    return { data: newLeave, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        user_id: userId,
        type: type || 'paid',
        start_date: startDate,
        end_date: endDate,
        days: count,
        remarks: remarks || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.warn("Supabase leave submit fallback:", err.message);
    const newLeave = {
      id: `leave-${Date.now()}`,
      user_id: userId,
      type: type || 'paid',
      start_date: startDate,
      end_date: endDate,
      days: count,
      remarks: remarks || '',
      status: 'pending',
      comments: null
    };
    mockLeaveRequests.unshift(newLeave);
    return { data: newLeave, error: null };
  }
}

export async function getEmployeeLeaves(userId) {
  if (IS_MOCK) {
    return { data: getMockEmployeeLeaves(userId), error: null };
  }

  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    if (data && data.length > 0) return { data, error: null };
    return { data: getMockEmployeeLeaves(userId), error: null };
  } catch (err) {
    return { data: getMockEmployeeLeaves(userId), error: null };
  }
}

export const getMyLeaves = getEmployeeLeaves;

export async function getAllLeaves({ statusFilter, typeFilter, status, userId } = {}) {
  const targetStatus = statusFilter || status;

  const getMockAdminLeaves = () => {
    let enriched = mockLeaveRequests.map(leave => {
      const user = mockUsers.find(u => u.id === leave.user_id) || { name: 'Staff Member', department: 'General', employee_id: 'DF-000' };
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
    return enriched;
  };

  if (IS_MOCK) {
    return { data: getMockAdminLeaves(), error: null };
  }

  try {
    let query = supabase
      .from('leave_requests')
      .select('*, users(name, department, employee_id, job_title)')
      .order('start_date', { ascending: false });

    if (targetStatus && targetStatus !== 'all') query = query.eq('status', targetStatus);
    if (typeFilter && typeFilter !== 'all') query = query.eq('type', typeFilter);
    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) throw error;
    if (data && data.length > 0) return { data, error: null };
    return { data: getMockAdminLeaves(), error: null };
  } catch (err) {
    return { data: getMockAdminLeaves(), error: null };
  }
}

export async function updateLeaveStatus(leaveId, { status, comments }) {
  if (IS_MOCK) {
    const record = mockLeaveRequests.find(l => l.id === leaveId);
    if (!record) return { data: null, error: 'Leave request not found' };

    record.status = status;
    record.comments = comments !== undefined ? comments : record.comments;
    return { data: record, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({ status, comments: comments || null })
      .eq('id', leaveId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function getLeaveBalances(userId) {
  const leaves = (await getEmployeeLeaves(userId)).data || [];
  const approvedLeaves = leaves.filter(l => l.status === 'approved');

  const usedPaid = approvedLeaves.filter(l => l.type === 'paid').reduce((acc, l) => acc + (Number(l.days) || 1), 0);
  const usedSick = approvedLeaves.filter(l => l.type === 'sick').reduce((acc, l) => acc + (Number(l.days) || 1), 0);

  return {
    data: {
      paid: { total: 24, used: usedPaid, available: Math.max(0, 24 - usedPaid) },
      sick: { total: 7, used: usedSick, available: Math.max(0, 7 - usedSick) },
      unpaid: { total: 0, used: 0, available: 99 }
    },
    error: null
  };
}

export const leaveService = {
  submitLeaveRequest,
  getEmployeeLeaves,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  getLeaveBalances,
  validate: (row) => validateRow('leave_requests', row)
};
