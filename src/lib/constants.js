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
  HOLIDAY:  'holiday',
  WEEKEND:  'weekend',
});

export const ATTENDANCE_STATUS_LABELS = Object.freeze({
  [ATTENDANCE_STATUS.PRESENT]:  'Present',
  [ATTENDANCE_STATUS.ABSENT]:   'Absent',
  [ATTENDANCE_STATUS.HALF_DAY]: 'Half Day',
  [ATTENDANCE_STATUS.LEAVE]:    'On Leave',
  [ATTENDANCE_STATUS.HOLIDAY]:  'Public Holiday',
  [ATTENDANCE_STATUS.WEEKEND]:  'Weekly Off',
});

// ── Work Modes (Indian Standard Corporate Setup) ────────────────
export const WORK_MODES = Object.freeze({
  OFFICE:      'office',
  WFH:         'wfh',
  ON_DUTY:     'on_duty',
  CLIENT:      'on_duty',
  CLIENT_SITE: 'on_duty',
});

export const WORK_MODE_LABELS = Object.freeze({
  [WORK_MODES.OFFICE]:      'Work from Office',
  [WORK_MODES.WFH]:         'Work from Home',
  [WORK_MODES.ON_DUTY]:     'Client On-Duty (OD)',
  'client':                 'Client On-Duty (OD)',
  'client_site':            'Client On-Duty (OD)',
});

// ── Shift Configuration (Indian Standard General Shift - IST) ──
export const SHIFT_CONFIG = Object.freeze({
  START_TIME: '09:30',        // 09:30 AM IST
  END_TIME: '18:30',          // 06:30 PM IST
  GRACE_MINUTES: 15,          // Grace up to 09:45 AM
  MIN_HALF_DAY_MINUTES: 240,  // 4 hours minimum for half day
  MIN_FULL_DAY_MINUTES: 480,  // 8 hours minimum for full day
  MAX_DAILY_HOURS: 9,         // Standard 9 hours workday
  TIMEZONE: 'Asia/Kolkata',   // Indian Standard Time (IST)
});

// ── Attendance Regularization ───────────────────────────────────
export const REGULARIZATION_STATUS = Object.freeze({
  PENDING:  'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

export const REGULARIZATION_REASONS = [
  { id: 'biometric_glitch', label: 'Biometric / App Device Glitch' },
  { id: 'forgot_punch', label: 'Forgot to Punch In / Out' },
  { id: 'client_visit', label: 'Client Site Visit / Field Duty' },
  { id: 'power_network_issue', label: 'Power / Internet Connectivity Outage' },
  { id: 'medical_emergency', label: 'Emergency / Late Commute' },
];

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
  [ATTENDANCE_STATUS.HOLIDAY]:  { bg: '#f3e8ff', text: '#6b21a8' },
  [ATTENDANCE_STATUS.WEEKEND]:  { bg: '#f1f5f9', text: '#475569' },
});
