// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const user = await authService.getCurrentUser();
      if (!mounted) return;
      setCurrentUser(user);
      setLoading(false);
    }

    initAuth();

    const subscription = authService.onAuthStateChange((user) => {
      if (mounted) setCurrentUser(user);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password, requiredRole = null) => {
    setLoading(true);
    try {
      const { user, error } = await authService.signIn({ email, password, requiredRole });
      if (error) throw error;
      setCurrentUser(user);
      return user;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (formData) => {
    setLoading(true);
    try {
      const result = await authService.signUp(formData);
      const { user, error } = result;
      if (error) throw error;
      if (user && !result.needsEmailVerification) setCurrentUser(user);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await authService.signOut();
    setCurrentUser(null);
  };

  const switchPersona = (roleOrId) => {
    const user = authService.switchPersona(roleOrId);
    if (user) setCurrentUser({ ...user });
  };

  const updateCurrentUserProfile = (updatedFields) => {
    setCurrentUser(prev => prev ? { ...prev, ...updatedFields } : prev);
  };

  const resetPassword = async (email) => {
    return await authService.resetPassword(email);
  };

  const value = {
    currentUser,
    role: currentUser?.role || 'employee',
    isAdmin: currentUser?.role === 'admin',
    isEmployee: currentUser?.role === 'employee',
    isMockMode: authService.isMockMode(),
    loading,
    login,
    signup,
    register: signup,
    resetPassword,
    logout,
    switchPersona,
    updateCurrentUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
