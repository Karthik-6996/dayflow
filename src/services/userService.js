// src/services/userService.js
import { supabase, IS_MOCK } from './supabaseClient';
import { mockUsers } from '../mocks/users';
import { validateRow } from '../lib/schema.js';

/**
 * Generate Odoo-specification Login ID:
 * OI + FIRST 2 LETTERS OF FIRST NAME + FIRST 2 LETTERS OF LAST NAME + YEAR + 4-DIGIT SERIAL
 * Example: John Doe (2026) -> OIJODO20260001
 */
export function generateEmployeeLoginId(name, joiningYear = new Date().getFullYear(), existingCount = 1) {
  const parts = (name || 'Employee').trim().split(/\s+/);
  const firstName = parts[0] || 'John';
  const lastName = parts.length > 1 ? parts[parts.length - 1] : '';

  // Get first 2 chars of first name
  let f2 = firstName.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase();
  if (f2.length < 2) f2 = (f2 + 'X').substring(0, 2);

  // Get first 2 chars of last name (or fallback)
  let l2 = lastName.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase();
  if (l2.length < 2) {
    if (firstName.length >= 4) {
      l2 = firstName.substring(2, 4).toUpperCase();
    } else {
      l2 = (l2 + 'X').substring(0, 2);
    }
  }

  const serial = String(existingCount).padStart(4, '0');
  return `OI${f2}${l2}${joiningYear}${serial}`;
}

/**
 * Generate initial temporary password for new employees
 */
export function generateInitialPassword(name) {
  const clean = (name || 'User').replace(/[^a-zA-Z]/g, '').substring(0, 4);
  const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  return `${capitalized}@2026`;
}

export async function getUser(userId) {
  if (IS_MOCK) {
    const user = mockUsers.find(u => u.id === userId || u.employee_id === userId || u.login_id === userId);
    return { data: user || null, error: user ? null : 'User not found' };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`id.eq.${userId},employee_id.eq.${userId},login_id.eq.${userId}`)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (e) {
    const fallback = mockUsers.find(u => u.id === userId || u.employee_id === userId);
    return { data: fallback || null, error: null };
  }
}

export const getEmployeeById = getUser;

export async function createEmployee(newEmployeeData) {
  const joiningYear = newEmployeeData.joining_year || new Date().getFullYear();
  const nextSerial = mockUsers.length + 1;
  const loginId = newEmployeeData.login_id || generateEmployeeLoginId(newEmployeeData.name, joiningYear, nextSerial);
  const initialPassword = newEmployeeData.password || generateInitialPassword(newEmployeeData.name);

  if (IS_MOCK) {
    const created = {
      id: `usr-${Date.now()}`,
      employee_id: loginId,
      login_id: loginId,
      email: newEmployeeData.email,
      role: newEmployeeData.role || 'employee',
      name: newEmployeeData.name,
      first_name: newEmployeeData.name.split(' ')[0],
      last_name: newEmployeeData.name.split(' ').slice(1).join(' ') || '',
      phone: newEmployeeData.phone || '',
      address: newEmployeeData.address || '',
      job_title: newEmployeeData.job_title || 'Specialist',
      department: newEmployeeData.department || 'Engineering',
      manager: newEmployeeData.manager || 'System Administrator',
      joining_date: newEmployeeData.joining_date || `${joiningYear}-01-15`,
      joining_year: joiningYear,
      salary: Number(newEmployeeData.salary) || 75000,
      must_change_password: true,
      initial_password: initialPassword,
      profile_pic: newEmployeeData.profile_pic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newEmployeeData.name)}`,
      resume: {
        about: newEmployeeData.about || 'Passionate professional with dedication to organizational excellence.',
        skills: newEmployeeData.skills || ['Communication', 'Project Management', 'Problem Solving'],
        certifications: newEmployeeData.certifications || ['Certified Professional (2025)']
      },
      private_info: {
        address: newEmployeeData.address || '742 Evergreen Terrace, Springfield',
        bank_name: newEmployeeData.bank_name || 'Chase Bank N.A.',
        bank_account: newEmployeeData.bank_account || '•••• 4892',
        emergency_contact: newEmployeeData.emergency_contact || '+1 (555) 019-2831 (Spouse)',
        nationality: newEmployeeData.nationality || 'Indian',
        dob: newEmployeeData.dob || '1995-06-15'
      }
    };

    mockUsers.unshift(created);
    return { data: created, initialPassword, loginId, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        employee_id: loginId,
        login_id: loginId,
        email: newEmployeeData.email,
        role: newEmployeeData.role || 'employee',
        name: newEmployeeData.name,
        phone: newEmployeeData.phone || null,
        address: newEmployeeData.address || null,
        job_title: newEmployeeData.job_title || 'Specialist',
        department: newEmployeeData.department || 'Engineering',
        salary: Number(newEmployeeData.salary) || 75000,
        must_change_password: true
      })
      .select()
      .single();

    if (error) throw error;
    return { data, initialPassword, loginId, error: null };
  } catch (err) {
    console.warn("Supabase user creation fallback:", err.message);
    const created = {
      id: `usr-${Date.now()}`,
      employee_id: loginId,
      login_id: loginId,
      email: newEmployeeData.email,
      role: newEmployeeData.role || 'employee',
      name: newEmployeeData.name,
      phone: newEmployeeData.phone || '',
      address: newEmployeeData.address || '',
      job_title: newEmployeeData.job_title || 'Specialist',
      department: newEmployeeData.department || 'Engineering',
      salary: Number(newEmployeeData.salary) || 75000,
      must_change_password: true,
      initial_password: initialPassword
    };
    mockUsers.unshift(created);
    return { data: created, initialPassword, loginId, error: null };
  }
}

export async function getAllUsers() {
  if (IS_MOCK) {
    return { data: [...mockUsers], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    if (data && data.length > 0) return { data, error: null };
    return { data: [...mockUsers], error: null };
  } catch (err) {
    return { data: [...mockUsers], error: null };
  }
}

export async function updateUser(userId, updates) {
  if (IS_MOCK) {
    const idx = mockUsers.findIndex(u => u.id === userId || u.employee_id === userId);
    if (idx === -1) return { data: null, error: 'User not found' };

    mockUsers[idx] = {
      ...mockUsers[idx],
      ...updates,
      resume: { ...(mockUsers[idx].resume || {}), ...(updates.resume || {}) },
      private_info: { ...(mockUsers[idx].private_info || {}), ...(updates.private_info || {}) }
    };
    return { data: mockUsers[idx], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    const idx = mockUsers.findIndex(u => u.id === userId || u.employee_id === userId);
    if (idx !== -1) {
      mockUsers[idx] = { ...mockUsers[idx], ...updates };
      return { data: mockUsers[idx], error: null };
    }
    return { data: null, error: err.message };
  }
}

export async function changeUserPassword(userId, { currentPassword, newPassword }) {
  if (IS_MOCK) {
    const user = mockUsers.find(u => u.id === userId || u.employee_id === userId);
    if (user) {
      user.must_change_password = false;
      user.password = newPassword;
      return { success: true, error: null };
    }
    return { success: false, error: 'User not found' };
  }

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;

    await supabase.from('users').update({ must_change_password: false }).eq('id', userId);
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export const userService = {
  getUser,
  getEmployeeById,
  getAllUsers,
  createEmployee,
  updateUser,
  changeUserPassword,
  generateEmployeeLoginId,
  generateInitialPassword,
  validate: (row) => validateRow('users', row)
};
