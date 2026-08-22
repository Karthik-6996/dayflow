/**
 * Dayflow — Leave Request List
 * Employee view: shows own leave history with cancel action for pending requests.
 */

import { useState } from 'react';
import StatusBadge from './LeaveStatusBadge.jsx';
import { LEAVE_TYPE_LABELS, LEAVE_STATUS } from '../../lib/constants.js';
import { calculateDays } from '../../lib/leaveValidation.js';
import { getAvailableActions } from '../../lib/leaveStateMachine.js';

export default function LeaveRequestList({ leaves, onCancel, userRole }) {
  const [cancellingId, setCancellingId] = useState(null);

  async function handleCancel(leaveId) {
    setCancellingId(leaveId);
    await onCancel(leaveId);
    setCancellingId(null);
  }

  if (!leaves || leaves.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <h3>No leave requests yet</h3>
        <p>Submit your first leave request using the button above.</p>
      </div>
    );
  }

  return (
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
            <th>Comments</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaves.map((leave) => {
            const days = calculateDays(leave.start_date, leave.end_date);
            const actions = getAvailableActions(leave.status, userRole, true);

            return (
              <tr key={leave.id} className="animate-in">
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {LEAVE_TYPE_LABELS[leave.type] || leave.type}
                  </span>
                </td>
                <td>{formatDate(leave.start_date)}</td>
                <td>{formatDate(leave.end_date)}</td>
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {days}
                  </span>
                </td>
                <td><StatusBadge status={leave.status} /></td>
                <td>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {leave.remarks || '—'}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {leave.comments || '—'}
                  </span>
                </td>
                <td>
                  {actions.includes('cancel') && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleCancel(leave.id)}
                      disabled={cancellingId === leave.id}
                    >
                      {cancellingId === leave.id ? '...' : '✕ Cancel'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
