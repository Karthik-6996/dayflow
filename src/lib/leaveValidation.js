/**
 * Dayflow — Leave Validation Utilities
 *
 * Pure validation functions for leave requests.
 * No Supabase or React dependencies.
 */

import { LEAVE_STATUS, LEAVE_TYPE, DEFAULT_LEAVE_QUOTA } from './constants.js';

// ── Date Utilities ──────────────────────────────────────────────

/**
 * Calculate the number of days between two dates (inclusive).
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {number}
 */
export function calculateDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1; // +1 for inclusive
}

/**
 * Check if a date range is valid (start <= end, both are valid dates, not in the past).
 * @param {string} startDate
 * @param {string} endDate
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return { valid: false, error: 'Start date is not a valid date.' };
  }
  if (isNaN(end.getTime())) {
    return { valid: false, error: 'End date is not a valid date.' };
  }
  if (start > end) {
    return { valid: false, error: 'Start date must be on or before end date.' };
  }

  // Start date should not be in the past (allow today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start < today) {
    return { valid: false, error: 'Start date cannot be in the past.' };
  }

  return { valid: true, error: null };
}

// ── Overlap Detection ───────────────────────────────────────────

/**
 * Check if two date ranges overlap.
 * Ranges are inclusive: [start1, end1] overlaps [start2, end2]
 * iff start1 <= end2 AND end1 >= start2.
 *
 * @param {string|Date} start1
 * @param {string|Date} end1
 * @param {string|Date} start2
 * @param {string|Date} end2
 * @returns {boolean}
 */
export function datesOverlap(start1, end1, start2, end2) {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  return s1 <= e2 && e1 >= s2;
}

/**
 * Check if a proposed leave overlaps with any existing active leave requests.
 * "Active" = not cancelled or rejected.
 *
 * @param {Object} proposed - { start_date, end_date }
 * @param {Object[]} existingLeaves - Array of leave request objects
 * @param {string} [excludeId] - ID to exclude (for editing an existing request)
 * @returns {{ hasOverlap: boolean, conflicting: Object|null }}
 */
export function checkOverlap(proposed, existingLeaves, excludeId = null) {
  const activeStatuses = [LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED];

  for (const leave of existingLeaves) {
    // Skip self (when editing)
    if (excludeId && leave.id === excludeId) continue;

    // Skip non-active leaves
    if (!activeStatuses.includes(leave.status)) continue;

    if (datesOverlap(proposed.start_date, proposed.end_date, leave.start_date, leave.end_date)) {
      return { hasOverlap: true, conflicting: leave };
    }
  }

  return { hasOverlap: false, conflicting: null };
}

// ── Balance Check ───────────────────────────────────────────────

/**
 * Calculate remaining leave balance for a given type and year
 * by counting approved + pending leaves from the leave_requests array.
 *
 * @param {string} leaveType - 'paid', 'sick', or 'unpaid'
 * @param {Object[]} leaveRequests - All leave requests for the user
 * @param {number} [year] - Year to check (defaults to current year)
 * @returns {{ total: number, used: number, pending: number, available: number }}
 */
export function calculateBalance(leaveType, leaveRequests, year = new Date().getFullYear()) {
  const total = DEFAULT_LEAVE_QUOTA[leaveType];

  // Unpaid leave has no cap
  if (total === Infinity) {
    return { total: Infinity, used: 0, pending: 0, available: Infinity };
  }

  let used = 0;
  let pending = 0;

  for (const req of leaveRequests) {
    // Only count requests of the same type in the same year
    if (req.type !== leaveType) continue;

    const reqYear = new Date(req.start_date).getFullYear();
    if (reqYear !== year) continue;

    const days = calculateDays(req.start_date, req.end_date);

    if (req.status === LEAVE_STATUS.APPROVED) {
      used += days;
    } else if (req.status === LEAVE_STATUS.PENDING) {
      pending += days;
    }
  }

  return {
    total,
    used,
    pending,
    available: Math.max(0, total - used - pending),
  };
}

/**
 * Check if the user has sufficient leave balance for a new request.
 *
 * @param {string} leaveType
 * @param {number} requestedDays
 * @param {Object[]} leaveRequests - All leave requests for the user
 * @returns {{ sufficient: boolean, balance: Object, error: string|null }}
 */
export function checkBalance(leaveType, requestedDays, leaveRequests) {
  const balance = calculateBalance(leaveType, leaveRequests);

  // Unpaid leave always has sufficient balance
  if (balance.available === Infinity) {
    return { sufficient: true, balance, error: null };
  }

  if (requestedDays > balance.available) {
    return {
      sufficient: false,
      balance,
      error: `Insufficient ${leaveType} leave balance. Available: ${balance.available} days, Requested: ${requestedDays} days.`,
    };
  }

  return { sufficient: true, balance, error: null };
}

// ── Full Submission Validation ──────────────────────────────────

/**
 * Validate a complete leave request before submission.
 * Returns an array of error strings (empty if valid).
 *
 * @param {Object} request - { type, start_date, end_date, remarks }
 * @param {Object[]} existingLeaves - User's existing leave requests
 * @returns {string[]} Array of validation error messages
 */
export function validateLeaveRequest(request, existingLeaves) {
  const errors = [];

  // 1. Required fields
  if (!request.type || !Object.values(LEAVE_TYPE).includes(request.type)) {
    errors.push('Please select a valid leave type.');
  }
  if (!request.start_date) errors.push('Start date is required.');
  if (!request.end_date) errors.push('End date is required.');

  // Early return if dates are missing
  if (!request.start_date || !request.end_date) return errors;

  // 2. Date range validation
  const dateCheck = validateDateRange(request.start_date, request.end_date);
  if (!dateCheck.valid) errors.push(dateCheck.error);

  // 3. Overlap check
  const overlap = checkOverlap(request, existingLeaves);
  if (overlap.hasOverlap) {
    errors.push(
      `Leave dates overlap with an existing ${overlap.conflicting.type} leave request (${overlap.conflicting.start_date} to ${overlap.conflicting.end_date}).`
    );
  }

  // 4. Balance check
  if (request.type && request.start_date && request.end_date) {
    const days = calculateDays(request.start_date, request.end_date);
    const balanceCheck = checkBalance(request.type, days, existingLeaves);
    if (!balanceCheck.sufficient) {
      errors.push(balanceCheck.error);
    }
  }

  return errors;
}
