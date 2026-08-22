// src/services/notificationService.js
<<<<<<< Updated upstream
import { supabase, IS_MOCK } from './supabaseClient';
=======
>>>>>>> Stashed changes
import { leaveService } from './leaveService';
import { payrollService } from './payrollService';
import { attendanceService } from './attendanceService';

<<<<<<< Updated upstream
const NOTIF_STORAGE_KEY = 'dayflow_user_notifications_store';

function getStoredNotifications() {
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Error reading stored notifications:", e);
  }
  return [];
}

function saveStoredNotifications(notifs) {
  try {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifs));
  } catch (e) {
    console.warn("Error saving stored notifications:", e);
  }
}

/**
 * Add a new real-time notification to an employee's inbox (e.g. when Admin accepts/rejects a leave/holiday request)
 */
export function addNotification({ userId, type, title, message, priority = 'normal' }) {
  const newNotif = {
    id: `notif-user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    user_id: userId,
    type, // 'leave_approved' | 'leave_rejected' | 'salary' | 'holiday'
    title,
    message,
    timestamp: new Date().toISOString(),
    unread: true,
    priority
  };

  const stored = getStoredNotifications();
  stored.unshift(newNotif);
  saveStoredNotifications(stored);

  return newNotif;
}

=======
>>>>>>> Stashed changes
/**
 * Fetch real, dynamic notifications for the current logged-in employee
 * based on actual database records (salary credits, leave statuses, regularization updates).
 */
export async function getEmployeeNotifications(userId) {
  const notifications = [];
<<<<<<< Updated upstream
  const storedList = getStoredNotifications();

  // 1. Add user's explicit notifications from Admin actions
  const userDirectNotifs = storedList.filter(n => !n.user_id || n.user_id === userId || n.user_id === 'usr-001-emp');
  notifications.push(...userDirectNotifs);

  try {
    // 2. Check Payroll / Salary events
    const { data: payroll } = await payrollService.getEmployeePayroll(userId);
    if (payroll && (payroll.net_salary || payroll.monthly_net)) {
      const netVal = payroll.monthly_net || payroll.net_salary || 95450;
      notifications.push({
        id: `notif-pay-${payroll.id || 'curr'}`,
        user_id: userId,
        type: 'salary',
        title: 'Monthly Salary Credited',
        message: `Salary of ₹${Number(netVal).toLocaleString('en-IN')} for August 2026 has been credited to your bank account.`,
=======

  try {
    // 1. Check Payroll / Salary events
    const { data: payroll } = await payrollService.getEmployeePayroll(userId);
    if (payroll && payroll.net_salary) {
      notifications.push({
        id: `notif-pay-${payroll.id || 'curr'}`,
        type: 'salary',
        title: 'Monthly Salary Credited',
        message: `Salary of ₹${payroll.net_salary.toLocaleString('en-IN')} for August 2026 has been credited to your bank account.`,
>>>>>>> Stashed changes
        timestamp: '2026-08-20T10:00:00+05:30',
        unread: false,
        priority: 'high'
      });
    }

<<<<<<< Updated upstream
    // 3. Check Leave / Holiday Requests from leaveService
    const { data: leaves } = await leaveService.getEmployeeLeaves(userId);
    if (leaves && leaves.length > 0) {
      leaves.forEach((leave) => {
        const leaveLabel = leave.type ? `${leave.type.toUpperCase()} Leave` : 'Holiday / Time-Off';
        const dateRange = `${leave.start_date}${leave.start_date !== leave.end_date ? ` to ${leave.end_date}` : ''}`;

        if (leave.status === 'approved') {
          // Avoid duplicate if already in stored list
          const exists = notifications.some(n => n.id === `notif-leave-${leave.id}`);
          if (!exists) {
            notifications.push({
              id: `notif-leave-${leave.id}`,
              user_id: userId,
              type: 'leave_approved',
              title: `🎉 ${leaveLabel} Approved`,
              message: `Your request for ${dateRange} has been accepted by Admin.${leave.comments ? ` Note: "${leave.comments}"` : ''}`,
              timestamp: leave.updated_at || leave.created_at || new Date().toISOString(),
              unread: true,
              priority: 'high'
            });
          }
        } else if (leave.status === 'rejected') {
          const exists = notifications.some(n => n.id === `notif-leave-${leave.id}`);
          if (!exists) {
            notifications.push({
              id: `notif-leave-${leave.id}`,
              user_id: userId,
              type: 'leave_rejected',
              title: `⚠️ ${leaveLabel} Declined`,
              message: `Your request for ${dateRange} was not approved.${leave.comments ? ` Reason: "${leave.comments}"` : ''}`,
              timestamp: leave.updated_at || leave.created_at || new Date().toISOString(),
              unread: true,
              priority: 'high'
            });
          }
        } else if (leave.status === 'pending') {
          const exists = notifications.some(n => n.id === `notif-leave-${leave.id}`);
          if (!exists) {
            notifications.push({
              id: `notif-leave-${leave.id}`,
              user_id: userId,
              type: 'leave_pending',
              title: `⏳ ${leaveLabel} Pending Approval`,
              message: `Your request for ${dateRange} is currently awaiting Admin/HR review.`,
              timestamp: leave.created_at || new Date().toISOString(),
              unread: false,
              priority: 'low'
            });
          }
=======
    // 2. Check Leave Requests events
    const { data: leaves } = await leaveService.getEmployeeLeaves(userId);
    if (leaves && leaves.length > 0) {
      leaves.slice(0, 3).forEach((leave) => {
        if (leave.status === 'approved') {
          notifications.push({
            id: `notif-leave-${leave.id}`,
            type: 'leave_approved',
            title: 'Leave Request Approved',
            message: `Your ${leave.type} leave for ${leave.start_date} ${leave.start_date !== leave.end_date ? `to ${leave.end_date}` : ''} was approved by HR.`,
            timestamp: leave.created_at || '2026-08-18T14:30:00+05:30',
            unread: false,
            priority: 'normal'
          });
        } else if (leave.status === 'rejected') {
          notifications.push({
            id: `notif-leave-${leave.id}`,
            type: 'leave_rejected',
            title: 'Leave Request Denied',
            message: `Your ${leave.type} leave for ${leave.start_date} was not approved: "${leave.comments || 'Please contact HR'}".`,
            timestamp: leave.created_at || '2026-08-17T11:20:00+05:30',
            unread: true,
            priority: 'high'
          });
        } else if (leave.status === 'pending') {
          notifications.push({
            id: `notif-leave-${leave.id}`,
            type: 'leave_pending',
            title: 'Leave Request Under Review',
            message: `Your ${leave.type} leave application for ${leave.start_date} is currently pending HR review.`,
            timestamp: leave.created_at || '2026-08-21T09:15:00+05:30',
            unread: false,
            priority: 'low'
          });
        }
      });
    }

    // 3. Check Attendance Regularization events
    const { data: regularizations } = await attendanceService.getRegularizationRequests({ userId });
    if (regularizations && regularizations.length > 0) {
      regularizations.slice(0, 2).forEach((reg) => {
        if (reg.status === 'approved') {
          notifications.push({
            id: `notif-reg-${reg.id}`,
            type: 'reg_approved',
            title: 'Attendance Regularization Approved',
            message: `Your punch regularization for ${reg.date} (${reg.requested_check_in} - ${reg.requested_check_out}) was verified & approved.`,
            timestamp: reg.created_at || '2026-08-19T16:45:00+05:30',
            unread: false,
            priority: 'normal'
          });
>>>>>>> Stashed changes
        }
      });
    }

    // Sort by most recent
<<<<<<< Updated upstream
    notifications.sort((a, b) => new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at));

    // Deduplicate by ID
    const uniqueMap = new Map();
    notifications.forEach(item => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });

    return { data: Array.from(uniqueMap.values()), error: null };
  } catch (err) {
    console.error("Error generating notifications:", err);
    return { data: notifications, error: err.message };
=======
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return { data: notifications, error: null };
  } catch (err) {
    console.error("Error generating notifications:", err);
    return { data: [], error: err.message };
>>>>>>> Stashed changes
  }
}

export const notificationService = {
<<<<<<< Updated upstream
  getEmployeeNotifications,
  addNotification,
  async markAsRead(notificationId) {
    const stored = getStoredNotifications();
    const target = stored.find(n => n.id === notificationId);
    if (target) {
      target.unread = false;
      saveStoredNotifications(stored);
    }
    return { data: true, error: null };
  },
  async dismissNotification(notificationId) {
    const stored = getStoredNotifications();
    const updated = stored.filter(n => n.id !== notificationId);
    saveStoredNotifications(updated);
    return { error: null };
  }
=======
  getEmployeeNotifications
>>>>>>> Stashed changes
};
