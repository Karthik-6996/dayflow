// src/services/authService.js
import { supabase, IS_MOCK } from './supabaseClient';
import { mockUsers } from '../mocks/users';

const STORAGE_KEY = 'dayflow_auth_user';

async function getProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  return { profile: data, error };
}

export const authService = {
  isMockMode() {
    return IS_MOCK;
  },

  async getCurrentUser() {
    if (IS_MOCK) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved user:", e);
      }
      return mockUsers[0];
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const { profile } = await getProfile(session.user.id);
    const userObj = profile || {
      id: session.user.id,
      email: session.user.email,
      role: 'employee',
      name: session.user.user_metadata?.name || session.user.email,
      employee_id: session.user.user_metadata?.employee_id || 'DF-1001',
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
    return userObj;
  },

  async getUserFromSession(session) {
    if (!session?.user) return null;

    const { profile } = await getProfile(session.user.id);
    const userObj = profile || {
      id: session.user.id,
      email: session.user.email,
      role: 'employee',
      name: session.user.user_metadata?.name || session.user.email,
      employee_id: session.user.user_metadata?.employee_id || 'DF-1001',
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
    return userObj;
  },

  onAuthStateChange(callback) {
    if (IS_MOCK) return { unsubscribe: () => {} };

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session ? await this.getUserFromSession(session) : null;
      if (!user) localStorage.removeItem(STORAGE_KEY);
      callback(user);
    });

    return data.subscription;
  },

  /**
   * Sign in with email and password, with optional requiredRole validation
   */
  async signIn({ email, password, requiredRole = null }) {
    if (IS_MOCK) {
      let matched = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!matched) {
        if (requiredRole === 'admin' || email.toLowerCase().includes('admin')) {
          matched = mockUsers.find(u => u.role === 'admin') || mockUsers[1];
        } else {
          matched = mockUsers.find(u => u.role === 'employee') || mockUsers[0];
        }
      }

      if (requiredRole && matched.role !== requiredRole) {
        if (requiredRole === 'admin') {
          return {
            user: null,
            session: null,
            error: new Error('Access denied: Administrator privileges are required for this portal.')
          };
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(matched));
      return { user: matched, session: { user: matched, access_token: 'mock-token' }, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, session: null, error };

    const { profile, error: profileErr } = await getProfile(data.user.id);

    if (profileErr) {
      console.warn('Signed in, but profile lookup warning:', profileErr.message);
    }

    const userObj = profile || {
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role || 'employee',
      name: data.user.user_metadata?.name || data.user.email,
      employee_id: data.user.user_metadata?.employee_id || 'DF-1001',
    };

    if (requiredRole && userObj.role !== requiredRole) {
      await supabase.auth.signOut();
      localStorage.removeItem(STORAGE_KEY);
      return {
        user: null,
        session: null,
        error: new Error(
          requiredRole === 'admin'
            ? 'Access denied: You do not have Administrator/HR privileges.'
            : 'Access restricted to standard Employee accounts.'
        )
      };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(userObj));
    return { user: userObj, session: data.session, error: null };
  },

  /**
   * Sign up with email, password, and profile metadata
   */
  async signUp({ email, password, name, employee_id, role = 'employee', department, job_title }) {
    const employeeId = employee_id?.trim() || `DF-${Math.floor(1000 + Math.random() * 9000)}`;

    if (IS_MOCK) {
      const newUser = {
        id: `usr-${Date.now()}`,
        employee_id: employeeId,
        email,
        role: role || 'employee',
        name: name || email.split('@')[0],
        phone: '',
        address: '',
        job_title: job_title || (role === 'admin' ? 'HR Administrator' : 'Staff Member'),
        department: department || (role === 'admin' ? 'Human Resources' : 'General'),
        salary: role === 'admin' ? 1800000 : 900000,
        profile_pic: null
      };

      mockUsers.push(newUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      return { user: newUser, error: null, needsEmailVerification: false };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
          employee_id: employeeId,
          role: role || 'employee'
        },
        emailRedirectTo: `${window.location.origin}/login`,
      }
    });

    if (error) return { user: null, error };

    // Insert to custom users table if profile created
    if (data.user) {
      const { error: insertErr } = await supabase.from('users').insert({
        id: data.user.id,
        employee_id: employeeId,
        email,
        role: role || 'employee',
        name: name || email.split('@')[0],
        job_title: job_title || (role === 'admin' ? 'HR Administrator' : 'Staff Member'),
        department: department || (role === 'admin' ? 'Human Resources' : 'General'),
        salary: role === 'admin' ? 1800000 : 900000,
        profile_pic: null
      });
      if (insertErr) console.error("Error creating users table profile:", insertErr);
    }

    if (data.session?.user) {
      const user = await this.getUserFromSession(data.session);
      return { user, session: data.session, error: null, needsEmailVerification: false };
    }

    return { user: data.user, session: null, error: null, needsEmailVerification: true };
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
   * Switch between predefined demo personas for live reviewer demoing
   */
  switchPersona(roleOrId) {
    if (!IS_MOCK) return null;

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
