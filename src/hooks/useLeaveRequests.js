/**
 * Dayflow — Leave Requests Hook
 *
 * Custom hook for leave request data and actions.
 */

import { useState, useEffect, useCallback } from 'react';
import { getMyLeaves, getAllLeaves, submitLeaveRequest, cancelLeaveRequest, transitionLeave } from '../services/leaveService.js';
import { calculateBalance } from '../lib/leaveValidation.js';
import { LEAVE_TYPE } from '../lib/constants.js';

/**
 * Hook for employee's own leave requests.
 */
export function useMyLeaves(userId) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaves = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error: err } = await getMyLeaves(userId);
    setLeaves(data || []);
    setError(err);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  // Calculate balances from the current leaves
  const balances = {
    [LEAVE_TYPE.PAID]: calculateBalance(LEAVE_TYPE.PAID, leaves),
    [LEAVE_TYPE.SICK]: calculateBalance(LEAVE_TYPE.SICK, leaves),
    [LEAVE_TYPE.UNPAID]: calculateBalance(LEAVE_TYPE.UNPAID, leaves),
  };

  async function submit(request) {
    const result = await submitLeaveRequest({ userId, ...request });
    if (!result.error) await fetchLeaves(); // Refresh
    return result;
  }

  async function cancel(leaveId) {
    const result = await cancelLeaveRequest(leaveId, userId);
    if (!result.error) await fetchLeaves();
    return result;
  }

  return { leaves, balances, loading, error, submit, cancel, refresh: fetchLeaves };
}

/**
 * Hook for admin leave management (all employees).
 */
export function useAllLeaves(filters = {}) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await getAllLeaves(filters);
    setLeaves(data || []);
    setError(err);
    setLoading(false);
  }, [filters.status, filters.userId]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  async function handleTransition(leaveId, action, comments) {
    const result = await transitionLeave({ leaveId, action, comments });
    if (!result.error) await fetchLeaves();
    return result;
  }

  return { leaves, loading, error, handleTransition, refresh: fetchLeaves };
}
