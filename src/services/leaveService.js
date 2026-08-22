// src/services/leaveService.js
import { supabase, IS_MOCK } from './supabaseClient';
import { mockLeaveRequests } from '../mocks/leaveRequests';
import { mockUsers } from '../mocks/users';
import { validateRow, isValidLeaveTransition } from '../lib/schema.js';
import { calculateWorkingDays, validateLeaveRequest, calculateBalance } from '../lib/leaveValidation.js';
import { LEAVE_TYPE } from '../lib/constants.js';

export async function submitLeaveRequest({
  userId,
  type,
  startDate,
  endDate,
  isHalfDay = false,
  halfDaySession = null,
  remarks = '',
  documentName = null,
  documentUrl = null
}) {
  const daysCount = calculateWorkingDays(startDate, endDate, isHalfDay);

  const proposedLeave = {
    user_id: userId,
    type,
    start_date: startDate,
    end_date: endDate,
    days_count: daysCount,
    is_half_day: isHalfDay,
    half_day_session: isHalfDay ? halfDaySession : null,
    remarks: remarks || '',
    document_name: documentName || null,
    document_url: documentUrl || null,
    status: 'pending',
    comments: null
  };

  // Get current user leaves for overlap and balance validation
  const { data: existingLeaves } = await getEmployeeLeaves(userId);
  const validationErrors = validateLeaveRequest(proposedLeave, existingLeaves || []);

  if (validationErrors.length > 0) {
    return { data: null, error: validationErrors.join(' ') };
  }

  if (IS_MOCK) {
    const newLeave = {
      id: `leave-${Date.now()}`,
      ...proposedLeave,
      created_at: new Date().toISOString()
    };

    const schemaErrors = validateRow('leave_requests', newLeave);
    if (schemaErrors.length > 0) {
      return { data: null, error: schemaErrors.join(', ') };
    }

    mockLeaveRequests.unshift(newLeave);
    return { data: newLeave, error: null };
  }

  // Supabase insertion with fallback if custom columns are not present in remote schema
  let formattedRemarks = remarks || '';
  const tags = [];
  if (isHalfDay) {
    tags.push(`[Half-Day: ${halfDaySession === 'second_half' ? 'Second Half' : 'First Half'}]`);
  }
  if (documentName) {
    tags.push(`[Document: ${documentName}]`);
  }
  if (tags.length > 0) {
    formattedRemarks = formattedRemarks ? `${formattedRemarks} ${tags.join(' ')}` : tags.join(' ');
  }

  // First try full insert (if DB schema has new columns)
  let insertRes = await supabase
    .from('leave_requests')
    .insert({
      user_id: userId,
      type,
      start_date: startDate,
      end_date: endDate,
      days_count: daysCount,
      is_half_day: isHalfDay,
      half_day_session: isHalfDay ? halfDaySession : null,
      remarks: formattedRemarks,
      document_name: documentName || null,
      document_url: documentUrl || null,
      status: 'pending',
    })
    .select()
    .single();

  // If column error, fallback to standard Supabase table columns
  if (insertRes.error && insertRes.error.message?.includes('column of \'leave_requests\'')) {
    insertRes = await supabase
      .from('leave_requests')
      .insert({
        user_id: userId,
        type,
        start_date: startDate,
        end_date: endDate,
        remarks: formattedRemarks,
        status: 'pending',
      })
      .select()
      .single();
  }

  if (insertRes.data) {
    insertRes.data.is_half_day = isHalfDay;
    insertRes.data.half_day_session = halfDaySession;
    insertRes.data.days_count = daysCount;
    insertRes.data.document_name = documentName;
    insertRes.data.document_url = documentUrl;
  }

  return { data: insertRes.data, error: insertRes.error?.message || null };
}

function enrichLeaveRecord(l) {
  let isHalfDay = l.is_half_day ?? false;
  let halfDaySession = l.half_day_session ?? null;
  let docName = l.document_name ?? null;

  if (l.remarks) {
    if (!isHalfDay && l.remarks.includes('[Half-Day:')) {
      isHalfDay = true;
      halfDaySession = l.remarks.includes('Second Half') ? 'second_half' : 'first_half';
    }
    if (!docName && l.remarks.includes('[Document:')) {
      const match = l.remarks.match(/\[Document:\s*([^\]]+)\]/);
      if (match) docName = match[1];
    }
  }

  const daysCount = l.days_count !== undefined && l.days_count !== null
    ? Number(l.days_count)
    : calculateWorkingDays(l.start_date, l.end_date, isHalfDay);

  return {
    ...l,
    is_half_day: isHalfDay,
    half_day_session: halfDaySession,
    document_name: docName,
    days_count: daysCount
  };
}

export async function getEmployeeLeaves(userId) {
  if (IS_MOCK) {
    const leaves = mockLeaveRequests
      .filter(l => l.user_id === userId)
      .map(enrichLeaveRecord)
      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    return { data: leaves, error: null };
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });

  const enriched = (data || []).map(enrichLeaveRecord);
  return { data: enriched, error: error?.message || null };
}

export const getMyLeaves = getEmployeeLeaves;

export async function getAllLeaves({ statusFilter, typeFilter, status, userId, employeeId, search } = {}) {
  const targetStatus = statusFilter || status;
  const targetUser = employeeId || userId;

  if (IS_MOCK) {
    let enriched = mockLeaveRequests.map(leave => {
      const user = mockUsers.find(u => u.id === leave.user_id) || {
        name: 'Unknown Employee',
        department: 'General',
        employee_id: 'N/A',
        profile_pic: null
      };
      return {
        ...enrichLeaveRecord(leave),
        users: {
          name: user.name,
          department: user.department,
          employee_id: user.employee_id,
          profile_pic: user.profile_pic
        }
      };
    });

    if (targetStatus && targetStatus !== 'all') {
      enriched = enriched.filter(l => l.status === targetStatus);
    }
    if (typeFilter && typeFilter !== 'all') {
      enriched = enriched.filter(l => l.type === typeFilter);
    }
    if (targetUser && targetUser !== 'all') {
      enriched = enriched.filter(l => l.user_id === targetUser);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      enriched = enriched.filter(l =>
        l.users?.name?.toLowerCase().includes(q) ||
        l.users?.employee_id?.toLowerCase().includes(q) ||
        l.remarks?.toLowerCase().includes(q)
      );
    }

    enriched.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    return { data: enriched, error: null };
  }

  let query = supabase
    .from('leave_requests')
    .select('*, users(name, department, employee_id, job_title, profile_pic)')
    .order('start_date', { ascending: false });

  if (targetStatus && targetStatus !== 'all') query = query.eq('status', targetStatus);
  if (typeFilter && typeFilter !== 'all') query = query.eq('type', typeFilter);
  if (targetUser && targetUser !== 'all') query = query.eq('user_id', targetUser);

  const { data, error } = await query;
  let enriched = (data || []).map(l => ({
    ...enrichLeaveRecord(l),
    users: l.users
  }));

  if (search && search.trim()) {
    const q = search.toLowerCase();
    enriched = enriched.filter(l =>
      l.users?.name?.toLowerCase().includes(q) ||
      l.users?.employee_id?.toLowerCase().includes(q) ||
      l.remarks?.toLowerCase().includes(q)
    );
  }

  return { data: enriched, error: error?.message || null };
}

export async function updateLeaveStatus(leaveId, { status, comments }) {
  if (status === 'rejected' && (!comments || !comments.trim())) {
    return { data: null, error: 'A reason is required when rejecting a leave request.' };
  }

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
  const nextStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'cancel' ? 'cancelled' : action;
  return updateLeaveStatus(leaveId, { status: nextStatus, comments });
}

export async function cancelLeaveRequest(leaveId, userId) {
  return updateLeaveStatus(leaveId, { status: 'cancelled', comments: 'Cancelled by employee' });
}

export async function getUserBalances(userId) {
  const { data: leaves } = await getEmployeeLeaves(userId);
  return {
    [LEAVE_TYPE.PAID]: calculateBalance(LEAVE_TYPE.PAID, leaves || []),
    [LEAVE_TYPE.SICK]: calculateBalance(LEAVE_TYPE.SICK, leaves || []),
    [LEAVE_TYPE.UNPAID]: calculateBalance(LEAVE_TYPE.UNPAID, leaves || []),
  };
}

export const leaveService = {
  submitLeaveRequest,
  getEmployeeLeaves,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  transitionLeave,
  cancelLeaveRequest,
  getUserBalances,
  validate: (row) => validateRow('leave_requests', row)
};

