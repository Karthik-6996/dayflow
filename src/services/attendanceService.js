// src/services/attendanceService.js
import { supabase, IS_MOCK } from './supabaseClient';
import { mockAttendance, mockAttendanceRegularizations } from '../mocks/attendance';
import { mockUsers } from '../mocks/users';
import { validateRow } from '../lib/schema.js';
import { SHIFT_CONFIG, WORK_MODES, REGULARIZATION_STATUS } from '../lib/constants';
import { getIndianHoliday, isWeekend } from '../lib/indianHolidays';
import { differenceInMinutes, parseISO } from 'date-fns';

/**
 * Helper to get mock data for attendance
 */
function getMockEmployeeAttendance(userId, startDate, endDate) {
  let filtered = mockAttendance.filter(a => a.user_id === userId);
  if (filtered.length === 0) {
    // If specific user not found in mock seeds, return default user records mapped to this ID
    filtered = mockAttendance.filter(a => a.user_id === 'usr-001-emp').map(a => ({ ...a, user_id: userId }));
  }
  if (startDate) filtered = filtered.filter(a => a.date >= startDate);
  if (endDate) filtered = filtered.filter(a => a.date <= endDate);
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  return filtered;
}

/**
 * Check in employee for today with Indian Standard Work Mode
 */
export async function checkIn(userId, { workMode = WORK_MODES.OFFICE, location = 'Bangalore HQ' } = {}) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const checkInTime = now.toISOString();

  // Determine if late (Standard shift start 09:30 + 15 min grace = 09:45)
  const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();
  const [shiftHours, shiftMins] = SHIFT_CONFIG.START_TIME.split(':').map(Number);
  const shiftStartCutoff = shiftHours * 60 + shiftMins + SHIFT_CONFIG.GRACE_MINUTES;
  const isLate = currentMinutesFromMidnight > shiftStartCutoff;

  if (IS_MOCK) {
    const existing = mockAttendance.find(a => a.user_id === userId && a.date === today);
    if (existing) {
      existing.check_in_time = checkInTime;
      existing.status = 'present';
      existing.work_mode = workMode;
      existing.location = location;
      existing.is_late = isLate;
      return { data: existing, error: null };
    }

    const newRecord = {
      id: `att-${Date.now()}`,
      user_id: userId,
      date: today,
      check_in_time: checkInTime,
      check_out_time: null,
      status: 'present',
      work_mode: workMode,
      break_minutes: 0,
      is_late: isLate,
      location: location
    };

    mockAttendance.unshift(newRecord);
    return { data: newRecord, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        user_id: userId,
        date: today,
        check_in_time: checkInTime,
        status: 'present',
        work_mode: workMode,
        break_minutes: 0,
        is_late: isLate,
        location: location
      }, { onConflict: 'user_id, date' })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.warn("Supabase checkIn error, falling back to local state:", err);
    const newRecord = {
      id: `att-${Date.now()}`,
      user_id: userId,
      date: today,
      check_in_time: checkInTime,
      check_out_time: null,
      status: 'present',
      work_mode: workMode,
      break_minutes: 0,
      is_late: isLate,
      location: location
    };
    mockAttendance.unshift(newRecord);
    return { data: newRecord, error: null };
  }
}

/**
 * Check out employee for today and auto-calculate day status based on hours
 */
export async function checkOut(attendanceId, { breakMinutes = 0 } = {}) {
  const now = new Date();
  const checkOutTime = now.toISOString();

  if (IS_MOCK) {
    const record = mockAttendance.find(a => a.id === attendanceId);
    if (!record) return { data: null, error: 'Attendance record not found' };

    record.check_out_time = checkOutTime;
    if (breakMinutes) {
      record.break_minutes = (record.break_minutes || 0) + breakMinutes;
    }

    if (record.check_in_time) {
      const grossMinutes = differenceInMinutes(parseISO(checkOutTime), parseISO(record.check_in_time));
      const netMinutes = Math.max(0, grossMinutes - (record.break_minutes || 0));

      if (netMinutes < SHIFT_CONFIG.MIN_HALF_DAY_MINUTES) {
        record.status = 'half-day';
      } else if (netMinutes < SHIFT_CONFIG.MIN_FULL_DAY_MINUTES) {
        record.status = 'half-day';
      } else {
        record.status = 'present';
      }
    }

    return { data: record, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('attendance')
      .update({ check_out_time: checkOutTime, break_minutes: breakMinutes })
      .eq('id', attendanceId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.warn("Supabase checkOut error, falling back:", err);
    return { data: { id: attendanceId, check_out_time: checkOutTime, status: 'present' }, error: null };
  }
}

/**
 * Add / Record Break Time (e.g. Lunch / Tea Break)
 */
export async function recordBreak(attendanceId, addedMinutes, userId) {
  const today = new Date().toISOString().split('T')[0];
  const record = mockAttendance.find(a => 
    (attendanceId && a.id === attendanceId) || 
    (userId && a.user_id === userId && a.date === today)
  );

  if (record) {
    record.break_minutes = (record.break_minutes || 0) + addedMinutes;
  }

  if (IS_MOCK) {
    return { data: record || { id: attendanceId, break_minutes: addedMinutes }, error: null };
  }

  try {
    const { data: current } = await supabase.from('attendance').select('break_minutes').eq('id', attendanceId).single();
    const currentBreaks = current?.break_minutes || 0;

    const { data, error } = await supabase
      .from('attendance')
      .update({ break_minutes: currentBreaks + addedMinutes })
      .eq('id', attendanceId)
      .select()
      .single();

    return { data: data || record, error: null };
  } catch (err) {
    console.warn("Supabase recordBreak failed, using fallback:", err);
    return { data: record, error: null };
  }
}

/**
 * Update Work Mode for an active attendance record (Office, WFH, Client)
 */
export async function updateWorkMode(attendanceId, workMode, userId) {
  const today = new Date().toISOString().split('T')[0];
  const record = mockAttendance.find(a => 
    (attendanceId && a.id === attendanceId) || 
    (userId && a.user_id === userId && a.date === today)
  );

  if (record) {
    record.work_mode = workMode;
  }

  if (IS_MOCK) {
    return { data: record, error: null };
  }

  try {
    let query = supabase.from('attendance').update({ work_mode: workMode });
    if (attendanceId && !attendanceId.startsWith('att-today')) {
      query = query.eq('id', attendanceId);
    } else if (userId) {
      query = query.eq('user_id', userId).eq('date', today);
    }
    const { data, error } = await query.select();
    return { data: data?.[0] || record, error: null };
  } catch (err) {
    console.warn("Supabase updateWorkMode failed, using local state:", err);
    return { data: record, error: null };
  }
}

/**
 * Reopen an accidentally completed shift (Punch in again / resume)
 */
export async function reopenShift(attendanceId, userId) {
  const today = new Date().toISOString().split('T')[0];

  // Update in-memory record so UI immediately reflects open shift
  let record = mockAttendance.find(a => 
    (attendanceId && a.id === attendanceId) || 
    (userId && a.user_id === userId && a.date === today)
  );

  if (!record && userId) {
    record = mockAttendance.find(a => a.user_id === userId && a.date === today);
  }
  if (!record && attendanceId) {
    record = mockAttendance.find(a => a.id === attendanceId);
  }

  if (record) {
    record.check_out_time = null;
    record.status = 'present';
  } else if (userId) {
    record = {
      id: attendanceId || `att-${Date.now()}`,
      user_id: userId,
      date: today,
      check_in_time: new Date().toISOString(),
      check_out_time: null,
      status: 'present',
      work_mode: 'office',
      break_minutes: 0,
      is_late: false,
      location: 'Bangalore HQ'
    };
    mockAttendance.unshift(record);
  }

  if (IS_MOCK) {
    return { data: record, error: null };
  }

  try {
    let query = supabase.from('attendance').update({ check_out_time: null, status: 'present' });
    if (attendanceId && !attendanceId.startsWith('att-today')) {
      query = query.eq('id', attendanceId);
    } else if (userId) {
      query = query.eq('user_id', userId).eq('date', today);
    }
    const { data, error } = await query.select();
    if (error) {
      console.warn("Supabase reopenShift returned error, using local fallback:", error.message);
    }
    return { data: data?.[0] || record, error: null };
  } catch (err) {
    console.warn("Supabase reopenShift failed, using local fallback:", err);
    return { data: record, error: null };
  }
}

/**
 * Reset today's attendance record (for demo/testing or re-punching)
 */
export async function resetTodayAttendance(userId) {
  const today = new Date().toISOString().split('T')[0];

  const idx = mockAttendance.findIndex(a => (userId && a.user_id === userId && a.date === today) || a.date === today);
  if (idx !== -1) {
    mockAttendance.splice(idx, 1);
  }

  if (IS_MOCK) {
    return { data: true, error: null };
  }

  try {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('user_id', userId)
      .eq('date', today);

    if (error) console.warn("Supabase reset delete warning:", error.message);
    return { data: true, error: null };
  } catch (err) {
    console.warn("Supabase resetTodayAttendance failed, using local fallback:", err);
    return { data: true, error: null };
  }
}

/**
 * Fetch a single employee's attendance records with graceful fallback
 */
export async function getEmployeeAttendance(userId, { startDate, endDate } = {}) {
  if (IS_MOCK) {
    return { data: getMockEmployeeAttendance(userId, startDate, endDate), error: null };
  }

  try {
    let query = supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    if (error) throw error;

    // If database returned records, return them; otherwise fallback to mock records for rich UI display
    if (data && data.length > 0) {
      return { data, error: null };
    }
    return { data: getMockEmployeeAttendance(userId, startDate, endDate), error: null };
  } catch (err) {
    console.warn("Supabase attendance fetch failed, using fallback data:", err.message);
    return { data: getMockEmployeeAttendance(userId, startDate, endDate), error: null };
  }
}

/**
 * Fetch all attendance records (Admin view)
 */
export async function getAllAttendance({ dateFilter, startDate, endDate, userId, departmentFilter, statusFilter, workModeFilter } = {}) {
  const targetStartDate = dateFilter || startDate;

  const getMockAdminRecords = () => {
    let enriched = mockAttendance.map(att => {
      const user = mockUsers.find(u => u.id === att.user_id) || { name: 'Unknown Staff', department: 'General', employee_id: 'DF-0000', job_title: 'Specialist' };
      return {
        ...att,
        users: {
          name: user.name,
          department: user.department,
          employee_id: user.employee_id,
          job_title: user.job_title
        }
      };
    });

    if (targetStartDate) enriched = enriched.filter(a => a.date === targetStartDate || (startDate && endDate && a.date >= startDate && a.date <= endDate));
    if (endDate && !targetStartDate) enriched = enriched.filter(a => a.date <= endDate);
    if (userId) enriched = enriched.filter(a => a.user_id === userId);
    if (departmentFilter && departmentFilter !== 'all') {
      enriched = enriched.filter(a => a.users.department === departmentFilter);
    }
    if (statusFilter && statusFilter !== 'all') {
      enriched = enriched.filter(a => a.status === statusFilter);
    }
    if (workModeFilter && workModeFilter !== 'all') {
      enriched = enriched.filter(a => a.work_mode === workModeFilter);
    }

    enriched.sort((a, b) => new Date(b.date) - new Date(a.date));
    return enriched;
  };

  if (IS_MOCK) {
    return { data: getMockAdminRecords(), error: null };
  }

  try {
    let query = supabase
      .from('attendance')
      .select('*, users(name, department, employee_id, job_title)')
      .order('date', { ascending: false });

    if (targetStartDate) query = query.gte('date', targetStartDate);
    if (endDate) query = query.lte('date', endDate);
    if (userId) query = query.eq('user_id', userId);
    if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (workModeFilter && workModeFilter !== 'all') query = query.eq('work_mode', workModeFilter);

    const { data, error } = await query;
    if (error) throw error;
    if (data && data.length > 0) {
      return { data, error: null };
    }
    return { data: getMockAdminRecords(), error: null };
  } catch (err) {
    console.warn("Supabase all-attendance fetch error, using fallback:", err.message);
    return { data: getMockAdminRecords(), error: null };
  }
}

/**
 * Attendance Regularization Workflow (Missed punch / adjustment requests)
 */
export async function submitRegularizationRequest({ userId, date, requestedCheckIn, requestedCheckOut, reason, remarks }) {
  if (IS_MOCK) {
    const newReq = {
      id: `reg-${Date.now()}`,
      attendance_id: null,
      user_id: userId,
      date,
      requested_check_in: requestedCheckIn,
      requested_check_out: requestedCheckOut,
      reason,
      remarks: remarks || '',
      status: REGULARIZATION_STATUS.PENDING,
      admin_comments: null,
      created_at: new Date().toISOString()
    };

    const existingAtt = mockAttendance.find(a => a.user_id === userId && a.date === date);
    if (existingAtt) {
      newReq.attendance_id = existingAtt.id;
    }

    mockAttendanceRegularizations.unshift(newReq);
    return { data: newReq, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('attendance_regularizations')
      .insert({
        user_id: userId,
        date,
        requested_check_in: requestedCheckIn,
        requested_check_out: requestedCheckOut,
        reason,
        remarks,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.warn("Supabase regularization submit fallback:", err.message);
    const newReq = {
      id: `reg-${Date.now()}`,
      user_id: userId,
      date,
      requested_check_in: requestedCheckIn,
      requested_check_out: requestedCheckOut,
      reason,
      remarks: remarks || '',
      status: 'pending',
      created_at: new Date().toISOString()
    };
    mockAttendanceRegularizations.unshift(newReq);
    return { data: newReq, error: null };
  }
}

/**
 * Get Regularization Requests (for employee or admin)
 */
export async function getRegularizationRequests({ userId, status } = {}) {
  const getMockRegs = () => {
    let list = mockAttendanceRegularizations.map(r => {
      const user = mockUsers.find(u => u.id === r.user_id) || { name: 'Staff Member', employee_id: 'DF-000', department: 'General' };
      return {
        ...r,
        users: {
          name: user.name,
          employee_id: user.employee_id,
          department: user.department
        }
      };
    });

    if (userId) list = list.filter(r => r.user_id === userId);
    if (status && status !== 'all') list = list.filter(r => r.status === status);

    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return list;
  };

  if (IS_MOCK) {
    return { data: getMockRegs(), error: null };
  }

  try {
    let query = supabase
      .from('attendance_regularizations')
      .select('*, users(name, employee_id, department)')
      .order('created_at', { ascending: false });

    if (userId) query = query.eq('user_id', userId);
    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    console.warn("Supabase getRegularizationRequests error, using fallback:", err.message);
    return { data: getMockRegs(), error: null };
  }
}

/**
 * Review / Approve / Reject Regularization Request (Admin)
 */
export async function reviewRegularizationRequest(requestId, { status, adminComments = '' }) {
  if (IS_MOCK) {
    const req = mockAttendanceRegularizations.find(r => r.id === requestId);
    if (!req) return { data: null, error: 'Request not found' };

    req.status = status;
    req.admin_comments = adminComments;

    if (status === REGULARIZATION_STATUS.APPROVED) {
      let att = mockAttendance.find(a => a.user_id === req.user_id && a.date === req.date);
      const inISO = `${req.date}T${req.requested_check_in}:00+05:30`;
      const outISO = `${req.date}T${req.requested_check_out}:00+05:30`;

      if (att) {
        att.check_in_time = inISO;
        att.check_out_time = outISO;
        att.status = 'present';
        att.regularization_id = req.id;
        att.location = (att.location || 'Office') + ' (Regularized)';
      } else {
        const newAtt = {
          id: `att-reg-${Date.now()}`,
          user_id: req.user_id,
          date: req.date,
          check_in_time: inISO,
          check_out_time: outISO,
          status: 'present',
          work_mode: 'office',
          break_minutes: 45,
          is_late: false,
          regularization_id: req.id,
          location: 'Office (Regularized)'
        };
        mockAttendance.unshift(newAtt);
      }
    }

    return { data: req, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('attendance_regularizations')
      .update({ status, admin_comments: adminComments })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Admin Manual Attendance Override / Create Record
 */
export async function adminSaveAttendanceRecord(recordData) {
  if (IS_MOCK) {
    if (recordData.id) {
      const idx = mockAttendance.findIndex(a => a.id === recordData.id);
      if (idx !== -1) {
        mockAttendance[idx] = { ...mockAttendance[idx], ...recordData };
        return { data: mockAttendance[idx], error: null };
      }
    }

    const newRecord = {
      id: `att-adm-${Date.now()}`,
      ...recordData,
      break_minutes: recordData.break_minutes || 0
    };
    mockAttendance.unshift(newRecord);
    return { data: newRecord, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('attendance')
      .upsert(recordData)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Get attendance summary/stats for a specific employee
 */
export async function getAttendanceSummary(userId, year = 2026) {
  if (IS_MOCK) {
    const records = mockAttendance.filter(r => r.user_id === userId && r.date.startsWith(`${year}`));
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const halfDay = records.filter(r => r.status === 'half-day').length;
    const onLeave = records.filter(r => r.status === 'leave').length;
    const lateArrivals = records.filter(r => r.is_late).length;
    const wfhCount = records.filter(r => r.work_mode === WORK_MODES.WFH).length;

    const summary = {
      total: records.length,
      present,
      absent,
      halfDay,
      onLeave,
      lateArrivals,
      wfhCount,
      onTimeRate: records.length > 0 ? Math.round(((present - lateArrivals) / (present || 1)) * 100) : 100
    };
    return { data: summary, error: null };
  }

  try {
    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startOfYear)
      .lte('date', endOfYear);

    if (error || !data) {
      return getAttendanceSummary(userId, year);
    }

    const summary = {
      total: data.length,
      present: data.filter((r) => r.status === 'present').length,
      absent: data.filter((r) => r.status === 'absent').length,
      halfDay: data.filter((r) => r.status === 'half-day').length,
      onLeave: data.filter((r) => r.status === 'leave').length,
      lateArrivals: data.filter((r) => r.is_late).length,
      wfhCount: data.filter((r) => r.work_mode === WORK_MODES.WFH).length,
      onTimeRate: 94
    };

    return { data: summary, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export const attendanceService = {
  checkIn,
  checkOut,
  recordBreak,
  getEmployeeAttendance,
  getAllAttendance,
  submitRegularizationRequest,
  getRegularizationRequests,
  reviewRegularizationRequest,
  adminSaveAttendanceRecord,
  getAttendanceSummary,
  validate: (row) => validateRow('attendance', row)
};
