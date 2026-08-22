/**
 * Dayflow — Leave Management Constants
 * Pure data definitions. No framework or Supabase dependencies.
 */

// ── Leave Statuses ──────────────────────────────────────────────
export const LEAVE_STATUS = Object.freeze({
  PENDING:   'pending',
  APPROVED:  'approved',
  REJECTED:  'rejected',
  CANCELLED: 'cancelled',
});

// ── Leave Types ─────────────────────────────────────────────────
export const LEAVE_TYPE = Object.freeze({
  PAID:   'paid',
  SICK:   'sick',
  UNPAID: 'unpaid',
});

// Human-readable labels for UI
export const LEAVE_TYPE_LABELS = Object.freeze({
  [LEAVE_TYPE.PAID]:   'Paid Leave',
  [LEAVE_TYPE.SICK]:   'Sick Leave',
  [LEAVE_TYPE.UNPAID]: 'Unpaid Leave',
});

export const LEAVE_STATUS_LABELS = Object.freeze({
  [LEAVE_STATUS.PENDING]:   'Pending',
  [LEAVE_STATUS.APPROVED]:  'Approved',
  [LEAVE_STATUS.REJECTED]:  'Rejected',
  [LEAVE_STATUS.CANCELLED]: 'Cancelled',
});

// ── User Roles ──────────────────────────────────────────────────
export const USER_ROLE = Object.freeze({
  EMPLOYEE: 'employee',
  ADMIN:    'admin',
});

// ── Attendance Statuses ─────────────────────────────────────────
export const ATTENDANCE_STATUS = Object.freeze({
  PRESENT:  'present',
  ABSENT:   'absent',
  HALF_DAY: 'half-day',
  LEAVE:    'leave',
});

export const ATTENDANCE_STATUS_LABELS = Object.freeze({
  [ATTENDANCE_STATUS.PRESENT]:  'Present',
  [ATTENDANCE_STATUS.ABSENT]:   'Absent',
  [ATTENDANCE_STATUS.HALF_DAY]: 'Half Day',
  [ATTENDANCE_STATUS.LEAVE]:    'On Leave',
});

// ── Leave Balance Defaults ──────────────────────────────────────
export const DEFAULT_LEAVE_QUOTA = Object.freeze({
  [LEAVE_TYPE.PAID]: 12,
  [LEAVE_TYPE.SICK]: 6,
  [LEAVE_TYPE.UNPAID]: Infinity, // No cap on unpaid leave
});

// ── Status Colors (for UI badges) ───────────────────────────────
export const STATUS_COLORS = Object.freeze({
  [LEAVE_STATUS.PENDING]:   { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  [LEAVE_STATUS.APPROVED]:  { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  [LEAVE_STATUS.REJECTED]:  { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  [LEAVE_STATUS.CANCELLED]: { bg: '#e5e7eb', text: '#374151', border: '#9ca3af' },
});

export const ATTENDANCE_COLORS = Object.freeze({
  [ATTENDANCE_STATUS.PRESENT]:  { bg: '#d1fae5', text: '#065f46' },
  [ATTENDANCE_STATUS.ABSENT]:   { bg: '#fee2e2', text: '#991b1b' },
  [ATTENDANCE_STATUS.HALF_DAY]: { bg: '#fef3c7', text: '#92400e' },
  [ATTENDANCE_STATUS.LEAVE]:    { bg: '#dbeafe', text: '#1e40af' },
});
