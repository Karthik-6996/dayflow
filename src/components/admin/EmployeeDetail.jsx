/**
 * Dayflow — Employee Detail (Admin)
 * Drill-down view for a single employee: profile, attendance summary, and leave history.
 */

import StatusBadge from '../leave/LeaveStatusBadge.jsx';
import { LEAVE_TYPE_LABELS } from '../../lib/constants.js';
import { calculateDays } from '../../lib/leaveValidation.js';

export default function EmployeeDetail({ employee, leaves, attendanceSummary, onBack }) {
  if (!employee) return null;

  const initials = (employee.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  const empLeaves = leaves?.filter((l) => l.user_id === employee.id) || [];

  return (
    <div className="animate-in">
      {/* Back button */}
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 20 }}>
        ← Back to Employees
      </button>

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="avatar avatar-lg">{initials}</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: 4 }}>{employee.name}</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              {employee.job_title || 'No title'} · {employee.department || 'No department'}
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              <InfoPill icon="📧" label="Email" value={employee.email} />
              <InfoPill icon="📞" label="Phone" value={employee.phone || 'N/A'} />
              <InfoPill icon="🏷️" label="Employee ID" value={employee.employee_id || 'N/A'} />
              <InfoPill icon="👤" label="Role" value={employee.role} />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      {attendanceSummary && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12 }}>📅 Attendance Summary (This Year)</h4>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Days</div>
              <div className="stat-value">{attendanceSummary.total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Present</div>
              <div className="stat-value" style={{ color: 'var(--color-approved-text)' }}>
                {attendanceSummary.present}
              </div>
              <div className="stat-sub">
                {attendanceSummary.total > 0
                  ? `${Math.round((attendanceSummary.present / attendanceSummary.total) * 100)}%`
                  : '0%'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Absent</div>
              <div className="stat-value" style={{ color: 'var(--color-rejected-text)' }}>
                {attendanceSummary.absent}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">On Leave</div>
              <div className="stat-value" style={{ color: 'var(--color-onleave-text)' }}>
                {attendanceSummary.onLeave}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave History */}
      <div>
        <h4 style={{ marginBottom: 12 }}>📋 Leave History ({empLeaves.length})</h4>
        {empLeaves.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-icon">📭</div>
            <h3>No leave requests</h3>
            <p>This employee has no leave requests on record.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {empLeaves.map((leave) => (
                  <tr key={leave.id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {LEAVE_TYPE_LABELS[leave.type] || leave.type}
                    </td>
                    <td>{formatDate(leave.start_date)}</td>
                    <td>{formatDate(leave.end_date)}</td>
                    <td style={{ fontWeight: 600 }}>
                      {calculateDays(leave.start_date, leave.end_date)}
                    </td>
                    <td><StatusBadge status={leave.status} /></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {leave.remarks || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoPill({ icon, label, value }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 12px',
      background: 'var(--color-bg)',
      borderRadius: 'var(--radius-md)',
      fontSize: '0.82rem',
    }}>
      <span>{icon}</span>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}:</span>
      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
