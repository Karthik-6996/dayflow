// src/services/userService.js
import { supabase, IS_MOCK } from './supabaseClient';
import { mockUsers } from '../mocks/users';
import { validateRow } from '../lib/schema.js';

export async function getUser(userId) {
  if (IS_MOCK) {
    const user = mockUsers.find(u => u.id === userId);
    return { data: user || null, error: user ? null : 'User not found' };
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  return { data, error: error?.message || null };
}

export const getEmployeeById = getUser;

export async function updateUser(userId, updates) {
  if (IS_MOCK) {
    const idx = mockUsers.findIndex(u => u.id === userId);
    if (idx === -1) return { data: null, error: 'User not found' };
    
    mockUsers[idx] = {
      ...mockUsers[idx],
      ...updates
    };
    
    const currentUser = JSON.parse(localStorage.getItem('dayflow_auth_user') || '{}');
    if (currentUser.id === userId) {
      localStorage.setItem('dayflow_auth_user', JSON.stringify(mockUsers[idx]));
    }

    return { data: mockUsers[idx], error: null };
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  return { data, error: error?.message || null };
}

export async function getAllUsers(filters = {}) {
  if (IS_MOCK) {
    let result = [...mockUsers];
    if (filters.department) {
      result = result.filter(u => u.department === filters.department);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return { data: result, error: null };
  }

  let query = supabase
    .from('users')
    .select('*')
    .order('name');

  if (filters.department) {
    query = query.eq('department', filters.department);
  }
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  return { data, error: error?.message || null };
}

export const getAllEmployees = getAllUsers;

export async function getDepartments() {
  if (IS_MOCK) {
    const unique = [...new Set(mockUsers.map(u => u.department).filter(Boolean))];
    return { data: unique, error: null };
  }

  const { data, error } = await supabase
    .from('users')
    .select('department')
    .not('department', 'is', null);

  if (error) return { data: null, error: error.message };

  const unique = [...new Set(data.map((d) => d.department).filter(Boolean))];
  return { data: unique, error: null };
}

export const userService = {
  getUser,
  getEmployeeById,
  updateUser,
  getAllUsers,
  getAllEmployees,
  getDepartments,
  validate: (userData) => validateRow('users', userData)
};
