// src/services/userService.js
import { supabase, IS_MOCK } from './supabaseClient';
import { mockUsers } from '../mocks/users';
import { validateRow } from '../lib/schema.js';

export const userService = {
  /**
   * Fetch single user profile by ID
   * Query: supabase.from('users').select('*').eq('id', userId)
   */
  async getUser(userId) {
    if (IS_MOCK) {
      const user = mockUsers.find(u => u.id === userId);
      return { data: user || null, error: user ? null : 'User not found' };
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    return { data, error };
  },

  /**
   * Update profile fields (phone, address, profile_pic)
   * Query: supabase.from('users').update({phone, address, profile_pic}).eq('id', userId)
   */
  async updateUser(userId, updates) {
    if (IS_MOCK) {
      const idx = mockUsers.findIndex(u => u.id === userId);
      if (idx === -1) return { data: null, error: 'User not found' };
      
      mockUsers[idx] = {
        ...mockUsers[idx],
        ...updates
      };
      
      // Update local storage if updating currently logged in user
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

    return { data, error };
  },

  /**
   * Get all users (Admin view)
   * Query: supabase.from('users').select('*')
   */
  async getAllUsers() {
    if (IS_MOCK) {
      return { data: [...mockUsers], error: null };
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    return { data, error };
  },

  /**
   * Validate user object against schema
   */
  validate(userData) {
    return validateRow('users', userData);
  }
};
