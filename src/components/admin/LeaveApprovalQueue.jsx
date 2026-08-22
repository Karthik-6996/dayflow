/**
 * Dayflow — Leave Approval Queue (Admin)
 * Shows all leave requests with approve/reject actions.
 */

import { useState } from 'react';
import StatusBadge from '../leave/LeaveStatusBadge.jsx';
import { LEAVE_TYPE_LABELS, LEAVE_STATUS } from '../../lib/constants.js';
import { calculateDays } from '../../lib/leaveValidation.js';
import { getAvailableActions } from '../../lib/leaveStateMachine.js';

export default function LeaveApprovalQueue({ leaves, onTransition, loading }) {
  const [activeComment, setActiveComment] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? leaves
    : leaves.filter((l) => l.status === filter);

  async function handleAction(leaveId, action) {
    if (action === 'reject' && !commentText && activeComment !== leaveId) {
      setActiveComment(leaveId);
      return;
    }

    setProcessingId(leaveId);
    await onTransition(leaveId, action, commentText || undefined);
    setProcessingId(null);
    setActiveComment(null);
    setCommentText('');
  }

  const pendingCount = leaves.filter((l) => l.status === LEAVE_STATUS.PENDING).length;

  if (loading) {
    return <div className="loading-container"><span className="loading-spinner"></span></div>;
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div className="filter-bar">
        <div className="tabs" style={{ marginBottom: 0, flex: 1 }}>
          {[
            { key: 'all', label: `All (${leaves.length})` },
            { key: 'pending', label: `Pending (${pendingCount})` },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`tab ${filter === tab.key ? 'active' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leave Cards */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No {filter !== 'all' ? filter : ''} leave requests</h3>
          <p>
            {filter === 'pending'
              ? "All caught up! No pending requests to review."
              : "No leave requests match this filter."}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map((leave) => {
            const days = calculateDays(leave.start_date, leave.end_date);
            const actions = getAvailableActions(leave.status, 'admin', false);
            const userName = leave.users?.name || 'Unknown Employee';
            const dept = leave.users?.department || '';
            const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2);
            const isProcessing = processingId === leave.id;

            return (
              <div key={leave.id} className="leave-card">
                <div className="leave-card-header">
                  <div className="leave-card-user">
                    <div className="avatar">{initials}</div>
                    <div className="leave-card-user-info">
                      <h4>{userName}</h4>
                      <p>{dept}{leave.users?.job_title ? ` · ${leave.users.job_title}` : ''}</p>
                    </div>
                  </div>
                  <StatusBadge status={leave.status} />
                </div>

                <div className="leave-card-body">
                  <div className="leave-card-field">
                    <span className="leave-card-field-label">Type</span>
                    <span className="leave-card-field-value">
                      {LEAVE_TYPE_LABELS[leave.type] || leave.type}
                    </span>
                  </div>
                  <div className="leave-card-field">
                    <span className="leave-card-field-label">From</span>
                    <span className="leave-card-field-value">{formatDate(leave.start_date)}</span>
                  </div>
                  <div className="leave-card-field">
                    <span className="leave-card-field-label">To</span>
                    <span className="leave-card-field-value">{formatDate(leave.end_date)}</span>
                  </div>
                  <div className="leave-card-field">
                    <span className="leave-card-field-label">Duration</span>
                    <span className="leave-card-field-value">{days} day{days !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {leave.remarks && (
                  <div className="leave-card-remarks">
                    "{leave.remarks}"
                  </div>
                )}

                {leave.comments && leave.status !== LEAVE_STATUS.PENDING && (
                  <div className="alert alert-warning" style={{ marginBottom: 12 }}>
                    <span>💬</span> Admin: {leave.comments}
                  </div>
                )}

                {/* Action buttons */}
                {actions.length > 0 && (
                  <div className="leave-card-actions">
                    {actions.includes('approve') && (
                      <button
                        className="btn btn-accent btn-sm"
                        onClick={() => handleAction(leave.id, 'approve')}
                        disabled={isProcessing}
                      >
                        {isProcessing ? '...' : '✓ Approve'}
                      </button>
                    )}
                    {actions.includes('reject') && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleAction(leave.id, 'reject')}
                        disabled={isProcessing}
                      >
                        {isProcessing ? '...' : '✕ Reject'}
                      </button>
                    )}
                  </div>
                )}

                {/* Comment input for reject */}
                {activeComment === leave.id && (
                  <div className="comment-inline">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Reason for rejection (required)..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      autoFocus
                    />
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleAction(leave.id, 'reject')}
                      disabled={!commentText.trim() || isProcessing}
                    >
                      Confirm Reject
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setActiveComment(null); setCommentText(''); }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}
