// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { AdminRoute } from './components/guards/AdminRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';

// Employee Pages
import { DashboardHome } from './pages/employee/DashboardHome';
import { AttendancePage } from './pages/employee/AttendancePage';
import { LeavesPage } from './pages/employee/LeavesPage';
import { PayrollPage } from './pages/employee/PayrollPage';
import { ProfilePage } from './pages/employee/ProfilePage';

// Admin Pages
import { EmployeeDirectory } from './pages/admin/EmployeeDirectory';
import { AllAttendancePage } from './pages/admin/AllAttendancePage';
import { LeaveApprovalsPage } from './pages/admin/LeaveApprovalsPage';
import { PayrollManagementPage } from './pages/admin/PayrollManagementPage';

import { Toaster } from 'sonner';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Protected Main Workspace */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Employee Self-Service Routes */}
            <Route index element={<DashboardHome />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="leaves" element={<LeavesPage />} />
            <Route path="payroll" element={<PayrollPage />} />
            <Route path="profile" element={<ProfilePage />} />

            {/* Admin / HR Operations Routes (Guarded by AdminRoute) */}
            <Route
              path="admin/employees"
              element={
                <AdminRoute>
                  <EmployeeDirectory />
                </AdminRoute>
              }
            />
            <Route
              path="admin/attendance"
              element={
                <AdminRoute>
                  <AllAttendancePage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/leaves"
              element={
                <AdminRoute>
                  <LeaveApprovalsPage />
                </AdminRoute>
              }
            />
            <Route
              path="admin/payroll"
              element={
                <AdminRoute>
                  <PayrollManagementPage />
                </AdminRoute>
              }
            />
          </Route>

          {/* Fallback Root Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
