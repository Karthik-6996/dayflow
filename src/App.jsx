// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { AdminRoute } from './components/guards/AdminRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';

// Main Application Pages (Odoo Wireframe Modules)
import { DashboardHome } from './pages/employee/DashboardHome';
import { EmployeeDirectory } from './pages/admin/EmployeeDirectory';
import { AttendancePage } from './pages/employee/AttendancePage';
import { LeavesPage } from './pages/employee/LeavesPage';
import { ProfilePage } from './pages/employee/ProfilePage';
import { PayrollPage } from './pages/employee/PayrollPage';
import { PayrollManagementPage } from './pages/admin/PayrollManagementPage';
import { AllAttendancePage } from './pages/admin/AllAttendancePage';
import { LeaveApprovalsPage } from './pages/admin/LeaveApprovalsPage';
import { ReportsPage } from './pages/shared/ReportsPage';

import { Toaster } from 'sonner';
import { useAuth } from './contexts/AuthContext';

function DashboardRedirect() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Navigate to="/dashboard/employees" replace /> : <DashboardHome />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster position="top-right" richColors closeButton />
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Protected Workspace Layout (Odoo HRMS Architecture) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Role-based default landing module */}
              <Route index element={<DashboardRedirect />} />
              <Route
                path="employees"
                element={
                  <AdminRoute>
                    <EmployeeDirectory />
                  </AdminRoute>
                }
              />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="leaves" element={<LeavesPage />} />
              <Route path="payroll" element={<PayrollPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="profile" element={<ProfilePage />} />

              {/* Admin Privileged Routes */}
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
              <Route
                path="admin/reports"
                element={
                  <AdminRoute>
                    <ReportsPage />
                  </AdminRoute>
                }
              />
            </Route>

            {/* Root Fallback */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
