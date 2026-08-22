/**
 * Dayflow — User Service
 *
 * Supabase queries for user/employee data (admin dashboard).
 */

import { supabase } from './supabaseClient.js';

/**
 * Fetch all employees (admin view).
 *
 * @param {Object} [filters]
 * @param {string} [filters.department] - Filter by department
 * @param {string} [filters.search] - Search by name or email
 * @returns {Promise<{ data: Object[]|null, error: string|null }>}
 */
export async function getAllEmployees(filters = {}) {
  let query = supabase
    .from('users')
    .select('id, employee_id, name, email, department, job_title, role, profile_pic')
    .order('name', { ascending: true });

  if (filters.department) {
    query = query.eq('department', filters.department);
  }
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  return { data, error: error?.message || null };
}

/**
 * Fetch a single employee's full profile.
 *
 * @param {string} userId
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function getEmployeeById(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  return { data, error: error?.message || null };
}

/**
 * Get distinct departments from the users table (for filters).
 *
 * @returns {Promise<{ data: string[]|null, error: string|null }>}
 */
export async function getDepartments() {
  const { data, error } = await supabase
    .from('users')
    .select('department')
    .not('department', 'is', null);

  if (error) return { data: null, error: error.message };

  const unique = [...new Set(data.map((d) => d.department).filter(Boolean))];
  return { data: unique, error: null };
}
