/**
 * Dayflow — Main Application Entry
 *
 * Sidebar navigation + page routing (client-side, no React Router dependency).
 * Role-based nav items: employees see Leave, admins see Admin Dashboard.
 * Includes a dev-mode role switcher for testing.
 */

import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import LeavePage from './pages/LeavePage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import './index.css';

function AppContent() {
  const { user, isAdmin, loading, switchMockRole } = useAuth();
  const [page, setPage] = useState(isAdmin ? 'admin' : 'leave');

  // Update page when role changes
  if (isAdmin && page !== 'admin' && page !== 'leave') {
    setPage('admin');
  }

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <span className="loading-spinner"></span>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <h1>Dayflow</h1>
          <p>Human Resource Management</p>
        </div>

        <nav className="sidebar-nav">
          {/* Show user info */}
          <div style={{
            padding: '12px 16px',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
              {(user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                {user?.role === 'admin' ? '🛡️ Admin' : '👤 Employee'}
              </div>
            </div>
          </div>

          <div className="nav-section-label">Navigation</div>

          {/* Leave Management — visible to all */}
          <button
            className={`nav-item ${page === 'leave' ? 'active' : ''}`}
            onClick={() => setPage('leave')}
          >
            <span className="nav-icon">📋</span>
            Leave Management
          </button>

          {/* Admin Dashboard — admin only */}
          {isAdmin && (
            <button
              className={`nav-item ${page === 'admin' ? 'active' : ''}`}
              onClick={() => setPage('admin')}
            >
              <span className="nav-icon">📊</span>
              Admin Dashboard
            </button>
          )}

          {/* Placeholder items (teammates' modules) */}
          <div className="nav-section-label">Other Modules</div>
          <button className="nav-item" disabled style={{ opacity: 0.4 }}>
            <span className="nav-icon">⏰</span>
            Attendance
          </button>
          <button className="nav-item" disabled style={{ opacity: 0.4 }}>
            <span className="nav-icon">💰</span>
            Payroll
          </button>
          <button className="nav-item" disabled style={{ opacity: 0.4 }}>
            <span className="nav-icon">👤</span>
            Profile
          </button>
        </nav>

        {/* Dev-mode Role Switcher */}
        <div className="sidebar-footer">
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Dev Mode — Switch Role
          </div>
          <div className="role-switcher">
            <button
              className={`role-btn ${user?.role === 'admin' ? 'active' : ''}`}
              onClick={() => { switchMockRole('admin'); setPage('admin'); }}
            >
              Admin
            </button>
            <button
              className={`role-btn ${user?.role === 'employee' ? 'active' : ''}`}
              onClick={() => { switchMockRole('employee'); setPage('leave'); }}
            >
              Employee
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="app-main">
        {page === 'leave' && <LeavePage />}
        {page === 'admin' && isAdmin && <AdminPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
