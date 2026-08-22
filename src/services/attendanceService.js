// src/services/attendanceService.js
import { supabase, IS_MOCK } from './supabaseClient';
import { mockAttendance } from '../mocks/attendance';
import { mockUsers } from '../mocks/users';
import { validateRow } from '../lib/schema.js';

/**
 * Check in employee for today
 */
export async function checkIn(userId) {
  const today = new Date().toISOString().split('T')[0];
  const checkInTime = new Date().toISOString();

  if (IS_MOCK) {
    const existing = mockAttendance.find(a => a.user_id === userId && a.date === today);
    if (existing) {
      existing.check_in_time = checkInTime;
      existing.status = 'present';
      return { data: existing, error: null };
    }

    const newRecord = {
      id: `att-${Date.now()}`,
      user_id: userId,
      date: today,
      check_in_time: checkInTime,
      check_out_time: null,
      status: 'present'
    };

    mockAttendance.unshift(newRecord);
    return { data: newRecord, error: null };
  }

  const { data, error } = await supabase
    .from('attendance')
    .insert({
      user_id: userId,
      date: today,
      check_in_time: checkInTime,
      status: 'present'
    })
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Check out employee for today
 */
export async function checkOut(attendanceId) {
  const checkOutTime = new Date().toISOString();

  if (IS_MOCK) {
    const record = mockAttendance.find(a => a.id === attendanceId);
    if (!record) return { data: null, error: 'Attendance record not found' };
    
    record.check_out_time = checkOutTime;
    return { data: record, error: null };
  }

  const { data, error } = await supabase
    .from('attendance')
    .update({ check_out_time: checkOutTime })
    .eq('id', attendanceId)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Fetch a single employee's attendance records
 */
export async function getEmployeeAttendance(userId, { startDate, endDate } = {}) {
  if (IS_MOCK) {
    let filtered = mockAttendance.filter(a => a.user_id === userId);
    if (startDate) filtered = filtered.filter(a => a.date >= startDate);
    if (endDate) filtered = filtered.filter(a => a.date <= endDate);
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    return { data: filtered, error: null };
  }

  let query = supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query;
  return { data, error: error?.message || null };
}

/**
 * Fetch all attendance records (Admin view)
 */
export async function getAllAttendance({ dateFilter, startDate, endDate, userId, departmentFilter, statusFilter, status } = {}) {
  const targetStatus = statusFilter || status;
  const targetStartDate = dateFilter || startDate;

  if (IS_MOCK) {
    let enriched = mockAttendance.map(att => {
      const user = mockUsers.find(u => u.id === att.user_id) || { name: 'Unknown', department: 'General', employee_id: 'N/A' };
      return {
        ...att,
        users: {
          name: user.name,
          department: user.department,
          employee_id: user.employee_id
        }
      };
    });

    if (targetStartDate) enriched = enriched.filter(a => a.date >= targetStartDate);
    if (endDate) enriched = enriched.filter(a => a.date <= endDate);
    if (userId) enriched = enriched.filter(a => a.user_id === userId);
    if (departmentFilter && departmentFilter !== 'all') {
      enriched = enriched.filter(a => a.users.department === departmentFilter);
    }
    if (targetStatus && targetStatus !== 'all') {
      enriched = enriched.filter(a => a.status === targetStatus);
    }

    enriched.sort((a, b) => new Date(b.date) - new Date(a.date));
    return { data: enriched, error: null };
  }

  let query = supabase
    .from('attendance')
    .select('*, users(name, department, employee_id)')
    .order('date', { ascending: false });

  if (targetStartDate) query = query.gte('date', targetStartDate);
  if (endDate) query = query.lte('date', endDate);
  if (userId) query = query.eq('user_id', userId);
  if (targetStatus && targetStatus !== 'all') query = query.eq('status', targetStatus);

  const { data, error } = await query;
  return { data, error: error?.message || null };
}

/**
 * Get attendance summary/stats for a specific employee
 */
export async function getAttendanceSummary(userId, year = new Date().getFullYear()) {
  if (IS_MOCK) {
    const records = mockAttendance.filter(r => r.user_id === userId && r.date.startsWith(`${year}`));
    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      halfDay: records.filter(r => r.status === 'half-day').length,
      onLeave: records.filter(r => r.status === 'leave').length,
    };
    return { data: summary, error: null };
  }

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

export const attendanceService = {
  checkIn,
  checkOut,
  getEmployeeAttendance,
  getAllAttendance,
  getAttendanceSummary,
  validate: (row) => validateRow('attendance', row)
};
