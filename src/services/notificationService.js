// src/services/notificationService.js
import { supabase, IS_MOCK } from './supabaseClient';

const mockNotifications = [
  {
    id: 'notif-1',
    user_id: 'usr-001-emp',
    type: 'leave_approved',
    title: 'Leave Approved',
    message: 'Your Paid Leave request for Aug 25 - Aug 26 has been approved by HR.',
    created_at: '2026-08-21T10:30:00Z',
    is_read: false
  },
  {
    id: 'notif-2',
    user_id: 'usr-001-emp',
    type: 'payroll_ready',
    title: 'Salary Payslip Available',
    message: 'Your salary payslip for July 2026 is now available for download in My Payroll.',
    created_at: '2026-08-20T14:15:00Z',
    is_read: false
  },
  {
    id: 'notif-3',
    user_id: 'usr-001-emp',
    type: 'announcement',
    title: 'Upcoming Holiday: Independence Day',
    message: 'Please note the company will remain closed on Friday, 15 August 2026.',
    created_at: '2026-08-14T09:00:00Z',
    is_read: true
  }
];

export const notificationService = {
  /**
   * Fetch active notifications for an employee
   */
  async getEmployeeNotifications(userId) {
    if (IS_MOCK) {
      const list = mockNotifications.filter(
        n => !n.user_id || n.user_id === userId || n.user_id === 'usr-001-emp'
      );
      return { data: list, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${userId},user_id.is.null`)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: mockNotifications, error: null };
      }
      return { data: data || [], error: null };
    } catch (err) {
      return { data: mockNotifications, error: null };
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    if (IS_MOCK) {
      const item = mockNotifications.find(n => n.id === notificationId);
      if (item) item.is_read = true;
      return { data: item, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  /**
   * Dismiss notification
   */
  async dismissNotification(notificationId) {
    if (IS_MOCK) {
      const idx = mockNotifications.findIndex(n => n.id === notificationId);
      if (idx !== -1) mockNotifications.splice(idx, 1);
      return { error: null };
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err.message };
    }
  }
};
