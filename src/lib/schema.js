// src/lib/schema.js — THE data contract. All teammates import from here.
// If a column is added/renamed in Supabase, update it HERE first.

export const TABLES = {
  users: {
    columns: [
      'id', 'employee_id', 'email', 'role', 'name', 'phone',
      'address', 'job_title', 'department', 'salary', 'profile_pic',
      'bank_details'
    ],
    required: ['id', 'employee_id', 'email', 'role', 'name'],
    enums: {
      role: ['employee', 'admin']
    },
    employeeWritable: ['phone', 'address', 'profile_pic'], // fields employees can update
  },

  attendance: {
    columns: ['id', 'user_id', 'date', 'check_in_time', 'check_out_time', 'status', 'work_mode', 'break_minutes', 'is_late', 'regularization_id', 'location'],
    required: ['id', 'user_id', 'date', 'status'],
    enums: {
      status: ['present', 'absent', 'half-day', 'leave', 'holiday', 'weekend'],
      work_mode: ['office', 'wfh', 'on_duty']
    }
  },

  attendance_regularizations: {
    columns: ['id', 'attendance_id', 'user_id', 'date', 'requested_check_in', 'requested_check_out', 'reason', 'remarks', 'status', 'admin_comments', 'created_at'],
    required: ['id', 'user_id', 'date', 'requested_check_in', 'requested_check_out', 'reason', 'status'],
    enums: {
      status: ['pending', 'approved', 'rejected']
    }
  },

  leave_requests: {
    columns: [
      'id', 'user_id', 'type', 'start_date', 'end_date', 'days_count',
      'is_half_day', 'half_day_session', 'document_name', 'document_url',
      'remarks', 'status', 'comments', 'created_at', 'users'
    ],
    required: ['id', 'user_id', 'type', 'start_date', 'end_date', 'status'],
    enums: {
      type: ['paid', 'sick', 'unpaid'],
      status: ['pending', 'approved', 'rejected', 'cancelled']
    },
    // Valid state transitions for leave status
    transitions: {
      pending:  ['approved', 'rejected', 'cancelled'],
      approved: [],   // terminal state
      rejected: [],   // terminal state — employee should re-apply
      cancelled: [],  // terminal state
    }
  },

  payroll: {
    columns: [
      'id', 'user_id', 'base_salary', 'deductions', 'net_salary',
      'current_status', 'current_month', 'structure', 'history',
      'selectedMonthSlip', 'users'
    ],
    required: ['id', 'user_id', 'base_salary'],
    enums: {}
  }
};

/**
 * Validate that a data object matches the expected schema for a table.
 * Returns an array of error strings (empty = valid).
 *
 * Usage:
 *   import { validateRow } from './schema.js';
 *   const errors = validateRow('users', userData);
 *   if (errors.length) console.error(errors);
 */
export function validateRow(tableName, row) {
  const spec = TABLES[tableName];
  if (!spec) return [`Unknown table: ${tableName}`];

  const errors = [];
  const rowKeys = Object.keys(row);

  // Check required fields
  for (const col of spec.required) {
    if (row[col] === undefined || row[col] === null || row[col] === '') {
      errors.push(`Missing required field: ${col}`);
    }
  }

  // Check for unknown fields
  for (const key of rowKeys) {
    if (!spec.columns.includes(key)) {
      errors.push(`Unknown field: ${key} (not in ${tableName} schema)`);
    }
  }

  // Check enum values
  for (const [field, allowed] of Object.entries(spec.enums)) {
    if (row[field] !== undefined && !allowed.includes(row[field])) {
      errors.push(`Invalid ${field}: "${row[field]}" — must be one of: ${allowed.join(', ')}`);
    }
  }

  return errors;
}

/**
 * Check if a leave status transition is valid.
 * Returns true if allowed, false if blocked.
 */
export function isValidLeaveTransition(currentStatus, newStatus) {
  const allowed = TABLES.leave_requests.transitions[currentStatus];
  if (!allowed) return false;
  return allowed.includes(newStatus);
}
