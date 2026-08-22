// src/services/leaveService.js
import { supabase, IS_MOCK } from './supabaseClient';
import { mockLeaveRequests } from '../mocks/leaveRequests';
import { mockUsers } from '../mocks/users';
import { validateRow, isValidLeaveTransition } from '../lib/schema.js';

export const leaveService = {
  /**
   * Submit a new leave request (Employee)
   * Query: supabase.from('leave_requests').insert({user_id, type, start_date, end_date, remarks, status: 'pending'})
   */
  async submitLeaveRequest({ userId, type, startDate, endDate, remarks }) {
    if (IS_MOCK) {
      const newLeave = {
        id: `leave-${Date.now()}`,
        user_id: userId,
        type,
        start_date: startDate,
        end_date: endDate,
        remarks: remarks || '',
        status: 'pending',
        comments: null
      };

      const errors = validateRow('leave_requests', newLeave);
      if (errors.length > 0) {
        return { data: null, error: errors.join(', ') };
      }

      mockLeaveRequests.unshift(newLeave);
      return { data: newLeave, error: null };
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        user_id: userId,
        type,
        start_date: startDate,
        end_date: endDate,
        remarks,
        status: 'pending'
      })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Fetch leave requests for single employee
   * Query: supabase.from('leave_requests').select('*').eq('user_id', userId)
   */
  async getEmployeeLeaves(userId) {
    if (IS_MOCK) {
      const leaves = mockLeaveRequests
        .filter(l => l.user_id === userId)
        .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
      return { data: leaves, error: null };
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    return { data, error };
  },

  /**
   * Fetch all leave requests (Admin view)
   * Query: supabase.from('leave_requests').select('*, users(name)')
   */
  async getAllLeaves({ statusFilter, typeFilter } = {}) {
    if (IS_MOCK) {
      let enriched = mockLeaveRequests.map(leave => {
        const user = mockUsers.find(u => u.id === leave.user_id) || { name: 'Unknown Employee', department: 'General', employee_id: 'N/A' };
        return {
          ...leave,
          users: {
            name: user.name,
            department: user.department,
            employee_id: user.employee_id
          }
        };
      });

      if (statusFilter && statusFilter !== 'all') {
        enriched = enriched.filter(l => l.status === statusFilter);
      }
      if (typeFilter && typeFilter !== 'all') {
        enriched = enriched.filter(l => l.type === typeFilter);
      }

      enriched.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
      return { data: enriched, error: null };
    }

    let query = supabase
      .from('leave_requests')
      .select('*, users(name, department, employee_id)')
      .order('start_date', { ascending: false });

    if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (typeFilter && typeFilter !== 'all') query = query.eq('type', typeFilter);

    const { data, error } = await query;
    return { data, error };
  },

  /**
   * Update leave request status (Admin only)
   * Query: supabase.from('leave_requests').update({status, comments}).eq('id', leaveId)
   */
  async updateLeaveStatus(leaveId, { status, comments }) {
    if (IS_MOCK) {
      const record = mockLeaveRequests.find(l => l.id === leaveId);
      if (!record) return { data: null, error: 'Leave request not found' };

      if (!isValidLeaveTransition(record.status, status)) {
        return { data: null, error: `Invalid transition from ${record.status} to ${status}` };
      }

      record.status = status;
      record.comments = comments !== undefined ? comments : record.comments;
      return { data: record, error: null };
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .update({ status, comments })
      .eq('id', leaveId)
      .select()
      .single();

    return { data, error };
  }
};
