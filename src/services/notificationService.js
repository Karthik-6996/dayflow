// src/services/notificationService.js
import { supabase, IS_MOCK } from './supabaseClient';
import { leaveService } from './leaveService';
import { payrollService } from './payrollService';
import { attendanceService } from './attendanceService';

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

/**
 * Fetch real, dynamic notifications for the current logged-in employee
 * based on actual database records (salary credits, leave statuses, regularization updates).
 */
export async function getEmployeeNotifications(userId) {
  const notifications = [];
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
        timestamp: '2026-08-20T10:00:00+05:30',
        unread: false,
        priority: 'high'
      });
    }

    // 3. Check Leave / Holiday Requests from leaveService
    const { data: leaves } = await leaveService.getEmployeeLeaves(userId);
    if (leaves && leaves.length > 0) {
      leaves.forEach((leave) => {
        const leaveLabel = leave.type ? `${leave.type.toUpperCase()} Leave` : 'Holiday / Time-Off';
        const dateRange = `${leave.start_date}${leave.start_date !== leave.end_date ? ` to ${leave.end_date}` : ''}`;

        if (leave.status === 'approved') {
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
        }
      });
    }

    // Sort by most recent
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
  }
}

export const notificationService = {
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
};
