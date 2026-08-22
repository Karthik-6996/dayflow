// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize session from storage or mock
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { user, error } = await authService.signIn({ email, password });
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
      const { user, error } = await authService.signUp(formData);
      if (error) throw error;
      setCurrentUser(user);
      return user;
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
    setCurrentUser({ ...user });
  };

  const updateCurrentUserProfile = (updatedFields) => {
    setCurrentUser(prev => prev ? { ...prev, ...updatedFields } : prev);
  };

  const value = {
    currentUser,
    role: currentUser?.role || 'employee',
    isAdmin: currentUser?.role === 'admin',
    isEmployee: currentUser?.role === 'employee',
    loading,
    login,
    signup,
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
