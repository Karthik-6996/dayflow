// src/services/authService.js
import { supabase, IS_MOCK } from './supabaseClient';
import { mockUsers } from '../mocks/users';

const STORAGE_KEY = 'dayflow_auth_user';

export const authService = {
  /**
   * Sign in with email and password
   */
  async signIn({ email, password }) {
    if (IS_MOCK) {
      // In mock mode, find user by email or fallback to demo employee
      const matched = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) 
        || (email.includes('admin') ? mockUsers.find(u => u.role === 'admin') : mockUsers[0]);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(matched));
      return { user: matched, session: { user: matched, access_token: 'mock-token' }, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, session: null, error };

    // Fetch user profile from custom users table
    const { data: profile, error: profileErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    const userObj = profile || data.user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
    return { user: userObj, session: data.session, error: profileErr };
  },

  /**
   * Sign up with email, password, and profile metadata
   */
  async signUp({ email, password, name, role = 'employee', employee_id, department, job_title }) {
    if (IS_MOCK) {
      const newUser = {
        id: `usr-${Date.now()}`,
        employee_id: employee_id || `DF-${Math.floor(1000 + Math.random() * 9000)}`,
        email,
        role,
        name,
        phone: '',
        address: '',
        job_title: job_title || (role === 'admin' ? 'HR Administrator' : 'Associate Specialist'),
        department: department || (role === 'admin' ? 'Human Resources' : 'Operations'),
        salary: role === 'admin' ? 1800000 : 950000,
        profile_pic: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        bank_details: {
          bank_name: "HDFC Bank Ltd",
          account_no: "50100" + Math.floor(10000000 + Math.random() * 90000000),
          ifsc: "HDFC0001234",
          pan: "ABCDE" + Math.floor(1000 + Math.random() * 9000) + "F",
          uan: "100" + Math.floor(100000000 + Math.random() * 900000000)
        }
      };

      mockUsers.push(newUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      return { user: newUser, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role, employee_id }
      }
    });

    if (error) return { user: null, error };

    // Insert to custom users table as specified in backend data contract
    if (data.user) {
      const { error: insertErr } = await supabase.from('users').insert({
        id: data.user.id,
        employee_id: employee_id || `DF-${Math.floor(1000 + Math.random() * 9000)}`,
        email,
        role,
        name,
        job_title: job_title || 'New Hire',
        department: department || 'General',
        salary: role === 'admin' ? 1800000 : 950000,
        profile_pic: null
      });
      if (insertErr) console.error("Error creating users table profile:", insertErr);
    }

    return { user: data.user, error: null };
  },

  /**
   * Sign out current user
   */
  async signOut() {
    localStorage.removeItem(STORAGE_KEY);
    if (!IS_MOCK) {
      await supabase.auth.signOut();
    }
  },

  /**
   * Get currently active session user
   */
  getCurrentUser() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved user:", e);
    }
    // Default fallback to first employee for seamless hackathon review
    return mockUsers[0];
  },

  /**
   * Switch between predefined demo personas for live reviewer demoing
   */
  switchPersona(roleOrId) {
    let user;
    if (roleOrId === 'admin') {
      user = mockUsers.find(u => u.role === 'admin') || mockUsers[1];
    } else if (roleOrId === 'employee') {
      user = mockUsers.find(u => u.role === 'employee') || mockUsers[0];
    } else {
      user = mockUsers.find(u => u.id === roleOrId) || mockUsers[0];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  }
};
