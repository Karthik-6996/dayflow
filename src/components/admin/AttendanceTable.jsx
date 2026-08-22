/**
 * Dayflow — Attendance Table (Admin)
 * Filterable attendance records with date range and status filters.
 */

import { useState } from 'react';
import StatusBadge from '../leave/LeaveStatusBadge.jsx';

export default function AttendanceTable({ records, loading }) {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = records.filter((rec) => {
    if (statusFilter !== 'all' && rec.status !== statusFilter) return false;
    if (dateRange.start && rec.date < dateRange.start) return false;
    if (dateRange.end && rec.date > dateRange.end) return false;
    return true;
  });

  // Summary stats
  const stats = {
    total: filtered.length,
    present: filtered.filter((r) => r.status === 'present').length,
    absent: filtered.filter((r) => r.status === 'absent').length,
    halfDay: filtered.filter((r) => r.status === 'half-day').length,
    onLeave: filtered.filter((r) => r.status === 'leave').length,
  };

  if (loading) {
    return <div className="loading-container"><span className="loading-spinner"></span></div>;
  }

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Records</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Present</div>
          <div className="stat-value" style={{ color: 'var(--color-approved-text)' }}>{stats.present}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Absent</div>
          <div className="stat-value" style={{ color: 'var(--color-rejected-text)' }}>{stats.absent}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Half Day</div>
          <div className="stat-value" style={{ color: 'var(--color-pending-text)' }}>{stats.halfDay}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <input
          type="date"
          className="form-input"
          value={dateRange.start}
          onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
          style={{ width: 'auto' }}
          placeholder="From"
        />
        <span style={{ color: 'var(--color-text-muted)' }}>to</span>
        <input
          type="date"
          className="form-input"
          value={dateRange.end}
          onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
          style={{ width: 'auto' }}
          placeholder="To"
        />
        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 140 }}
        >
          <option value="all">All Statuses</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="half-day">Half Day</option>
          <option value="leave">On Leave</option>
        </select>
        {(dateRange.start || dateRange.end || statusFilter !== 'all') && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setDateRange({ start: '', end: '' }); setStatusFilter('all'); }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No attendance records</h3>
          <p>Try adjusting your date range or status filter.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec) => {
                const empName = rec.users?.name || 'Unknown';
                const initials = empName.split(' ').map(n => n[0]).join('').slice(0, 2);

                return (
                  <tr key={rec.id} className="animate-in">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 30, height: 30, fontSize: '0.7rem' }}>{initials}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{empName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{rec.users?.department || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(rec.date)}</td>
                    <td style={{ fontFamily: 'monospace' }}>{formatTime(rec.check_in_time) || '—'}</td>
                    <td style={{ fontFamily: 'monospace' }}>{formatTime(rec.check_out_time) || '—'}</td>
                    <td><StatusBadge status={rec.status} type="attendance" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function formatTime(timeStr) {
  if (!timeStr) return null;
  // Handle both "HH:MM:SS" and full datetime strings
  try {
    if (timeStr.includes('T')) {
      return new Date(timeStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return timeStr.slice(0, 5); // "HH:MM"
  } catch {
    return timeStr;
  }
}
