/**
 * Dayflow — Auth Context
 *
 * Provides the current user and role across the app.
 * This is a placeholder that your team's auth module should replace
 * or integrate with. Supports both real Supabase auth and mock mode.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient.js';

const AuthContext = createContext(null);

// ── Mock user for development (no Supabase project needed) ──────
const MOCK_USERS = {
  admin: {
    id: 'mock-admin-001',
    email: 'admin@dayflow.dev',
    name: 'Sarah Chen',
    role: 'admin',
    department: 'Human Resources',
    job_title: 'HR Manager',
  },
  employee: {
    id: 'mock-emp-001',
    email: 'john@dayflow.dev',
    name: 'John Doe',
    role: 'employee',
    department: 'Engineering',
    job_title: 'Software Engineer',
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mockRole, setMockRole] = useState('admin'); // Toggle for dev

  useEffect(() => {
    initAuth();
  }, []);

  async function initAuth() {
    try {
      // Try real Supabase auth first
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Fetch the full user profile from users table
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser(profile || { id: session.user.id, email: session.user.email, role: 'employee' });
      } else {
        // Fall back to mock user for development
        setUser(MOCK_USERS[mockRole]);
      }
    } catch {
      // Supabase not configured — use mock
      setUser(MOCK_USERS[mockRole]);
    } finally {
      setLoading(false);
    }
  }

  // Dev-only: switch between admin and employee mock users
  function switchMockRole(role) {
    setMockRole(role);
    setUser(MOCK_USERS[role]);
  }

  const value = {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    isEmployee: user?.role === 'employee',
    switchMockRole, // Exposed for dev toolbar
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
