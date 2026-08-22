/**
 * Dayflow — Leave Service
 *
 * All Supabase CRUD operations for leave_requests.
 * Business logic (state machine, validation) lives in lib/ — this is just the data layer.
 */

import { supabase } from './supabaseClient.js';
import { executeTransition } from '../lib/leaveStateMachine.js';
import { validateLeaveRequest, calculateDays } from '../lib/leaveValidation.js';

// ── Employee Operations ─────────────────────────────────────────

/**
 * Submit a new leave request.
 * Validates dates, overlap, and balance before inserting.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.type - 'paid' | 'sick' | 'unpaid'
 * @param {string} params.startDate - ISO date string
 * @param {string} params.endDate - ISO date string
 * @param {string} [params.remarks]
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function submitLeaveRequest({ userId, type, startDate, endDate, remarks }) {
  try {
    // 1. Fetch existing leaves for overlap/balance validation
    const { data: existingLeaves, error: fetchError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) throw fetchError;

    // 2. Validate the request (overlap + balance + dates)
    const request = { type, start_date: startDate, end_date: endDate, remarks };
    const errors = validateLeaveRequest(request, existingLeaves || []);

    if (errors.length > 0) {
      return { data: null, error: errors.join(' ') };
    }

    // 3. Also check overlap via DB function (defense in depth)
    const { data: hasOverlap, error: rpcError } = await supabase.rpc('check_leave_overlap', {
      p_user_id: userId,
      p_start: startDate,
      p_end: endDate,
    });

    // If the RPC doesn't exist yet, skip (graceful degradation)
    if (!rpcError && hasOverlap) {
      return { data: null, error: 'Leave dates overlap with an existing request (server check).' };
    }

    // 4. Insert the request
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

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message || 'Failed to submit leave request.' };
  }
}

/**
 * Fetch the current user's leave requests.
 *
 * @param {string} userId
 * @returns {Promise<{ data: Object[]|null, error: string|null }>}
 */
export async function getMyLeaves(userId) {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });

  return { data, error: error?.message || null };
}

/**
 * Cancel a pending leave request (employee action).
 *
 * @param {string} leaveId
 * @param {string} userId - The current user (for ownership check)
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function cancelLeaveRequest(leaveId, userId) {
  // Fetch the request first to validate the transition
  const { data: leave, error: fetchError } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('id', leaveId)
    .single();

  if (fetchError) return { data: null, error: fetchError.message };

  const isOwner = leave.user_id === userId;
  const result = executeTransition({
    currentStatus: leave.status,
    action: 'cancel',
    userRole: 'employee',
    isOwner,
  });

  if (!result.success) return { data: null, error: result.error };

  const { data, error } = await supabase
    .from('leave_requests')
    .update({ status: result.nextStatus })
    .eq('id', leaveId)
    .select()
    .single();

  return { data, error: error?.message || null };
}

// ── Admin Operations ────────────────────────────────────────────

/**
 * Fetch all leave requests with employee details (admin view).
 *
 * @param {Object} [filters]
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.userId] - Filter by specific employee
 * @returns {Promise<{ data: Object[]|null, error: string|null }>}
 */
export async function getAllLeaves(filters = {}) {
  let query = supabase
    .from('leave_requests')
    .select('*, users(name, department, job_title)')
    .order('start_date', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  const { data, error } = await query;
  return { data, error: error?.message || null };
}

/**
 * Approve or reject a leave request (admin action).
 *
 * @param {Object} params
 * @param {string} params.leaveId
 * @param {string} params.action - 'approve' | 'reject'
 * @param {string} [params.comments] - Required for reject
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function transitionLeave({ leaveId, action, comments }) {
  // Fetch the current request
  const { data: leave, error: fetchError } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('id', leaveId)
    .single();

  if (fetchError) return { data: null, error: fetchError.message };

  // Validate the transition via state machine
  const result = executeTransition({
    currentStatus: leave.status,
    action,
    userRole: 'admin',
    isOwner: false,
    comments,
  });

  if (!result.success) return { data: null, error: result.error };

  // Perform the update
  const { data, error } = await supabase
    .from('leave_requests')
    .update({
      status: result.nextStatus,
      comments: comments || null,
    })
    .eq('id', leaveId)
    .select()
    .single();

  return { data, error: error?.message || null };
}
