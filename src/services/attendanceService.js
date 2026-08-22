// src/services/attendanceService.js
import { supabase, IS_MOCK } from './supabaseClient';
import { mockAttendance } from '../mocks/attendance';
import { mockUsers } from '../mocks/users';
import { validateRow } from '../lib/schema.js';

export const attendanceService = {
  /**
   * Check in employee for today
   * Query: supabase.from('attendance').insert({user_id, date, check_in_time, status})
   */
  async checkIn(userId) {
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

    return { data, error };
  },

  /**
   * Check out employee for today
   * Query: supabase.from('attendance').update({check_out_time}).eq('id', attendanceId)
   */
  async checkOut(attendanceId) {
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

    return { data, error };
  },

  /**
   * Get attendance for single employee (Daily / Weekly / Monthly filterable)
   * Query: supabase.from('attendance').select('*').eq('user_id', userId)
   */
  async getEmployeeAttendance(userId, { startDate, endDate } = {}) {
    if (IS_MOCK) {
      let filtered = mockAttendance.filter(a => a.user_id === userId);
      if (startDate) {
        filtered = filtered.filter(a => a.date >= startDate);
      }
      if (endDate) {
        filtered = filtered.filter(a => a.date <= endDate);
      }
      // Sort newest first
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
    return { data, error };
  },

  /**
   * Get all attendance records (Admin view)
   * Query: supabase.from('attendance').select('*, users(name)')
   */
  async getAllAttendance({ dateFilter, departmentFilter, statusFilter } = {}) {
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

      if (dateFilter) {
        enriched = enriched.filter(a => a.date === dateFilter);
      }
      if (departmentFilter && departmentFilter !== 'all') {
        enriched = enriched.filter(a => a.users.department === departmentFilter);
      }
      if (statusFilter && statusFilter !== 'all') {
        enriched = enriched.filter(a => a.status === statusFilter);
      }

      enriched.sort((a, b) => new Date(b.date) - new Date(a.date));
      return { data: enriched, error: null };
    }

    let query = supabase
      .from('attendance')
      .select('*, users(name, department, employee_id)')
      .order('date', { ascending: false });

    if (dateFilter) query = query.eq('date', dateFilter);
    if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);

    const { data, error } = await query;
    return { data, error };
  },

  /**
   * Validate attendance row against contract schema
   */
  validate(row) {
    return validateRow('attendance', row);
  }
};
