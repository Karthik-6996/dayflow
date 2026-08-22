// src/lib/schema.js — THE data contract. All teammates import from here.
// If a column is added/renamed in Supabase, update it HERE first.

export const TABLES = {
  users: {
    columns: [
      'id', 'employee_id', 'email', 'role', 'name', 'phone',
      'address', 'job_title', 'department', 'salary', 'profile_pic'
    ],
    required: ['id', 'employee_id', 'email', 'role', 'name'],
    enums: {
      role: ['employee', 'admin']
    },
    employeeWritable: ['phone', 'address', 'profile_pic'], // fields employees can update
  },

  attendance: {
    columns: ['id', 'user_id', 'date', 'check_in_time', 'check_out_time', 'status'],
    required: ['id', 'user_id', 'date', 'status'],
    enums: {
      status: ['present', 'absent', 'half-day', 'leave']
    }
  },

  leave_requests: {
    columns: [
      'id', 'user_id', 'type', 'start_date', 'end_date',
      'remarks', 'status', 'comments'
    ],
    required: ['id', 'user_id', 'type', 'start_date', 'end_date', 'status'],
    enums: {
      type: ['paid', 'sick', 'unpaid'],
      status: ['pending', 'approved', 'rejected']
    },
    // Valid state transitions for leave status
    transitions: {
      pending:  ['approved', 'rejected'],
      approved: [],   // terminal state
      rejected: [],   // terminal state — employee should re-apply
    }
  },

  payroll: {
    columns: ['id', 'user_id', 'base_salary', 'deductions', 'net_salary'],
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
