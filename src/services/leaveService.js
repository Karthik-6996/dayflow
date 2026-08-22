// src/services/leaveService.js
import { supabase, IS_MOCK } from './supabaseClient';
import { mockLeaveRequests } from '../mocks/leaveRequests';
import { mockUsers } from '../mocks/users';
import { validateRow } from '../lib/schema.js';

const STORAGE_KEY = 'dayflow_leave_requests_store';

function getStoredLeaves() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Error reading stored leaves:", e);
  }
  return null;
}

function saveStoredLeaves(leaves) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leaves));
  } catch (e) {
    console.warn("Error saving stored leaves:", e);
  }
}

// Initialize persistent leaves in localStorage if not present
function initializeLeaves() {
  let stored = getStoredLeaves();
  if (!stored || stored.length === 0) {
    saveStoredLeaves(mockLeaveRequests);
    return [...mockLeaveRequests];
  }
  return stored;
}

export async function submitLeaveRequest({ userId, type, startDate, endDate, remarks, daysCount, attachment }) {
  const count = Number(daysCount) || 1;
  const newLeave = {
    id: `leave-${Date.now()}`,
    user_id: userId,
    type: type || 'paid',
    start_date: startDate,
    end_date: endDate,
    days: count,
    days_count: count,
    remarks: remarks || '',
    attachment_url: attachment || null,
    status: 'pending',
    comments: null,
    created_at: new Date().toISOString()
  };

  // 1. Always save to local persistent storage immediately
  const allCurrent = initializeLeaves();
  allCurrent.unshift(newLeave);
  saveStoredLeaves(allCurrent);

  // Also update in-memory array
  mockLeaveRequests.unshift(newLeave);

  // 2. Try Supabase if available
  if (!IS_MOCK) {
    try {
      await supabase
        .from('leave_requests')
        .insert({
          user_id: userId,
          type: type || 'paid',
          start_date: startDate,
          end_date: endDate,
          days: count,
          remarks: remarks || null,
          status: 'pending',
        });
    } catch (err) {
      console.warn("Supabase leave submit notice:", err.message);
    }
  }

  return { data: newLeave, error: null };
}

export async function getEmployeeLeaves(userId) {
  const allStored = initializeLeaves();

  // Find records matching current user ID or primary employee default
  let userLeaves = allStored.filter(l => l.user_id === userId);

  // If user has no records yet (e.g. fresh session), seed with default records for this user
  if (userLeaves.length === 0) {
    userLeaves = allStored.filter(l => l.user_id === 'usr-001-emp').map(l => ({ ...l, user_id: userId }));
    // Save seeded records
    const merged = [...userLeaves, ...allStored];
    saveStoredLeaves(merged);
  }

  // Sort descending by start_date or created_at
  userLeaves.sort((a, b) => new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date));

  // If Supabase has data, try fetching and merging
  if (!IS_MOCK) {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (!error && data && data.length > 0) {
        // Merge Supabase with local submitted leaves
        const mergedIds = new Set(data.map(d => d.id));
        const extraLocal = userLeaves.filter(l => !mergedIds.has(l.id));
        return { data: [...extraLocal, ...data], error: null };
      }
    } catch (err) {
      console.warn("Supabase getEmployeeLeaves fallback to storage:", err);
    }
  }

  return { data: userLeaves, error: null };
}

export const getMyLeaves = getEmployeeLeaves;

export async function getAllLeaves({ statusFilter, typeFilter, status, userId } = {}) {
  const targetStatus = statusFilter || status;
  const allStored = initializeLeaves();

  let enriched = allStored.map(leave => {
    const user = mockUsers.find(u => u.id === leave.user_id || u.employee_id === leave.user_id) || {
      name: 'Staff Member',
      department: 'General',
      employee_id: leave.user_id?.startsWith('DF-') ? leave.user_id : 'DF-1001'
    };
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

  enriched.sort((a, b) => new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date));

  // If Supabase is connected, try to query
  if (!IS_MOCK) {
    try {
      let query = supabase
        .from('leave_requests')
        .select('*, users(name, department, employee_id, job_title)')
        .order('start_date', { ascending: false });

      if (targetStatus && targetStatus !== 'all') query = query.eq('status', targetStatus);
      if (typeFilter && typeFilter !== 'all') query = query.eq('type', typeFilter);
      if (userId) query = query.eq('user_id', userId);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const mergedIds = new Set(data.map(d => d.id));
        const extraLocal = enriched.filter(l => !mergedIds.has(l.id));
        return { data: [...extraLocal, ...data], error: null };
      }
    } catch (err) {
      console.warn("Supabase getAllLeaves fallback to storage:", err);
    }
  }

  return { data: enriched, error: null };
}

export async function updateLeaveStatus(leaveId, { status, comments }) {
  const allStored = initializeLeaves();
  const idx = allStored.findIndex(l => l.id === leaveId || String(l.id) === String(leaveId));

  let updatedRecord = null;
  if (idx !== -1) {
    allStored[idx] = {
      ...allStored[idx],
      status,
      comments: comments !== undefined ? comments : allStored[idx].comments,
      updated_at: new Date().toISOString()
    };
    updatedRecord = allStored[idx];
    saveStoredLeaves(allStored);
  }

  // Update in-memory mock as well
  const mockIdx = mockLeaveRequests.findIndex(l => l.id === leaveId || String(l.id) === String(leaveId));
  if (mockIdx !== -1) {
    mockLeaveRequests[mockIdx] = {
      ...mockLeaveRequests[mockIdx],
      status,
      comments: comments !== undefined ? comments : mockLeaveRequests[mockIdx].comments,
      updated_at: new Date().toISOString()
    };
    if (!updatedRecord) updatedRecord = mockLeaveRequests[mockIdx];
  }

  if (!IS_MOCK) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leaveId);
      if (isUuid) {
        await supabase
          .from('leave_requests')
          .update({
            status,
            comments: comments || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', leaveId);
      }
    } catch (err) {
      console.warn("Supabase update leave notice:", err.message);
    }
  }

  return { data: updatedRecord || { id: leaveId, status, comments }, error: null };
}

export async function getLeaveBalances(userId) {
  const { data: leaves } = await getEmployeeLeaves(userId);
  const approvedLeaves = (leaves || []).filter(l => l.status === 'approved');

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
