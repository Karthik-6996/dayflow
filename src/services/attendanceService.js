/**
 * Dayflow — Attendance Service
 *
 * Supabase queries for attendance records (admin dashboard).
 */

import { supabase } from './supabaseClient.js';

/**
 * Fetch all attendance records with user info (admin view).
 *
 * @param {Object} [filters]
 * @param {string} [filters.startDate] - ISO date string
 * @param {string} [filters.endDate] - ISO date string
 * @param {string} [filters.userId] - Filter by specific employee
 * @param {string} [filters.status] - Filter by attendance status
 * @returns {Promise<{ data: Object[]|null, error: string|null }>}
 */
export async function getAllAttendance(filters = {}) {
  let query = supabase
    .from('attendance')
    .select('*, users(name, department)')
    .order('date', { ascending: false });

  if (filters.startDate) {
    query = query.gte('date', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('date', filters.endDate);
  }
  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  return { data, error: error?.message || null };
}

/**
 * Fetch a single employee's attendance records.
 *
 * @param {string} userId
 * @param {Object} [filters]
 * @param {string} [filters.startDate]
 * @param {string} [filters.endDate]
 * @returns {Promise<{ data: Object[]|null, error: string|null }>}
 */
export async function getEmployeeAttendance(userId, filters = {}) {
  let query = supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (filters.startDate) {
    query = query.gte('date', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('date', filters.endDate);
  }

  const { data, error } = await query;
  return { data, error: error?.message || null };
}

/**
 * Get attendance summary/stats for a specific employee.
 *
 * @param {string} userId
 * @param {number} [year]
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function getAttendanceSummary(userId, year = new Date().getFullYear()) {
  const startOfYear = `${year}-01-01`;
  const endOfYear = `${year}-12-31`;

  const { data, error } = await supabase
    .from('attendance')
    .select('status')
    .eq('user_id', userId)
    .gte('date', startOfYear)
    .lte('date', endOfYear);

  if (error) return { data: null, error: error.message };

  const summary = {
    total: data.length,
    present: data.filter((r) => r.status === 'present').length,
    absent: data.filter((r) => r.status === 'absent').length,
    halfDay: data.filter((r) => r.status === 'half-day').length,
    onLeave: data.filter((r) => r.status === 'leave').length,
  };

  return { data: summary, error: null };
}
