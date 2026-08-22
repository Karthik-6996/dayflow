/**
 * Dayflow — Leave Validation Utilities
 *
 * Pure validation functions for leave requests.
 * Accounts for weekends, Indian Gazetted/Company holidays, half-day leaves, and balance validation.
 */

import { LEAVE_STATUS, LEAVE_TYPE, DEFAULT_LEAVE_QUOTA } from './constants.js';
import { isWeekend, getIndianHoliday } from './indianHolidays.js';

// ── Date Utilities ──────────────────────────────────────────────

/**
 * Calculate the total calendar days between two dates (inclusive).
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {number}
 */
export function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1; // +1 for inclusive
}

/**
 * Calculate the number of actual working days between two dates (inclusive),
 * strictly excluding weekends (Sat/Sun) and gazetted Indian company holidays.
 *
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @param {boolean} [isHalfDay=false]
 * @returns {number}
 */
export function calculateWorkingDays(startDate, endDate, isHalfDay = false) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return 0;
  }

  let workingDays = 0;
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);

  const endUtc = new Date(end);
  endUtc.setHours(0, 0, 0, 0);

  while (cur <= endUtc) {
    const year = cur.getFullYear();
    const month = String(cur.getMonth() + 1).padStart(2, '0');
    const day = String(cur.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const isWk = isWeekend(cur);
    const holiday = getIndianHoliday(dateStr);
    const isGazettedHoliday = holiday && (holiday.type === 'gazetted' || holiday.isNational);

    if (!isWk && !isGazettedHoliday) {
      workingDays += 1;
    }

    cur.setDate(cur.getDate() + 1);
  }

  if (isHalfDay) {
    return workingDays > 0 ? 0.5 : 0;
  }

  return workingDays;
}

/**
 * Get detailed breakdown of calendar days, working days, weekends, and holidays in a range.
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @param {boolean} [isHalfDay=false]
 * @returns {{ totalDays: number, workingDays: number, weekends: Array<{ date: string, day: string }>, holidays: Array<{ date: string, name: string }> }}
 */
export function getExcludedDaysBreakdown(startDate, endDate, isHalfDay = false) {
  if (!startDate || !endDate) {
    return { totalDays: 0, workingDays: 0, weekends: [], holidays: [] };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return { totalDays: 0, workingDays: 0, weekends: [], holidays: [] };
  }

  let totalDays = 0;
  const weekends = [];
  const holidays = [];

  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endUtc = new Date(end);
  endUtc.setHours(0, 0, 0, 0);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  while (cur <= endUtc) {
    totalDays += 1;
    const year = cur.getFullYear();
    const month = String(cur.getMonth() + 1).padStart(2, '0');
    const day = String(cur.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const isWk = isWeekend(cur);
    const holiday = getIndianHoliday(dateStr);
    const isGazettedHoliday = holiday && (holiday.type === 'gazetted' || holiday.isNational);

    if (isWk) {
      weekends.push({ date: dateStr, day: dayNames[cur.getDay()] });
    } else if (isGazettedHoliday) {
      holidays.push({ date: dateStr, name: holiday.name });
    }

    cur.setDate(cur.getDate() + 1);
  }

  const workingDays = isHalfDay ? (totalDays - weekends.length - holidays.length > 0 ? 0.5 : 0) : Math.max(0, totalDays - weekends.length - holidays.length);

  return {
    totalDays,
    workingDays,
    weekends,
    holidays
  };
}

/**
 * Check if a date range is valid (start <= end, both are valid dates).
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
 * "Active" = pending or approved (rejected and cancelled are excluded).
 *
 * @param {Object} proposed - { start_date, end_date }
 * @param {Object[]} existingLeaves - Array of leave request objects
 * @param {string} [excludeId] - ID to exclude (for editing/updating an existing request)
 * @returns {{ hasOverlap: boolean, conflicting: Object|null }}
 */
export function checkOverlap(proposed, existingLeaves = [], excludeId = null) {
  const activeStatuses = [LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED];

  for (const leave of existingLeaves) {
    // Skip self
    if (excludeId && leave.id === excludeId) continue;

    // Skip non-active leaves (rejected or cancelled)
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
export function calculateBalance(leaveType, leaveRequests = [], year = new Date().getFullYear()) {
  const total = DEFAULT_LEAVE_QUOTA[leaveType] ?? 0;

  // Unpaid leave has no cap
  if (total === Infinity) {
    let unpaidUsed = 0;
    let unpaidPending = 0;
    for (const req of leaveRequests) {
      if (req.type !== leaveType) continue;
      const reqYear = new Date(req.start_date).getFullYear();
      if (reqYear !== year) continue;

      const days = req.days_count !== undefined
        ? Number(req.days_count)
        : calculateWorkingDays(req.start_date, req.end_date, req.is_half_day);

      if (req.status === LEAVE_STATUS.APPROVED) unpaidUsed += days;
      else if (req.status === LEAVE_STATUS.PENDING) unpaidPending += days;
    }
    return { total: Infinity, used: unpaidUsed, pending: unpaidPending, available: Infinity };
  }

  let used = 0;
  let pending = 0;

  for (const req of leaveRequests) {
    // Only count requests of the same type in the same year
    if (req.type !== leaveType) continue;

    const reqYear = new Date(req.start_date).getFullYear();
    if (reqYear !== year) continue;

    const days = req.days_count !== undefined
      ? Number(req.days_count)
      : calculateWorkingDays(req.start_date, req.end_date, req.is_half_day);

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
export function checkBalance(leaveType, requestedDays, leaveRequests = []) {
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
 * @param {Object} request - { type, start_date, end_date, is_half_day, remarks }
 * @param {Object[]} existingLeaves - User's existing leave requests
 * @returns {string[]} Array of validation error messages
 */
export function validateLeaveRequest(request, existingLeaves = []) {
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

  // 3. Working days calculation & zero working days check
  const workingDays = calculateWorkingDays(request.start_date, request.end_date, request.is_half_day);
  if (workingDays === 0) {
    errors.push('Selected dates only contain weekends or official public holidays (0 working days).');
  }

  // 4. Overlap check against active pending or approved leaves
  const overlap = checkOverlap(request, existingLeaves);
  if (overlap.hasOverlap) {
    errors.push(
      `Leave dates overlap with an existing ${overlap.conflicting.type} leave request (${overlap.conflicting.start_date} to ${overlap.conflicting.end_date}) with status "${overlap.conflicting.status}".`
    );
  }

  // 5. Balance check
  if (request.type && request.start_date && request.end_date && workingDays > 0) {
    const balanceCheck = checkBalance(request.type, workingDays, existingLeaves);
    if (!balanceCheck.sufficient) {
      errors.push(balanceCheck.error);
    }
  }

  return errors;
}
