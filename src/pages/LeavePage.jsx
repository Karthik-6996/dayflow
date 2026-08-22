/**
 * Dayflow — Leave Page (Employee View)
 * Balance cards + leave request form + leave history table.
 */

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useMyLeaves } from '../../hooks/useLeaveRequests.js';
import LeaveBalanceCard from '../../components/leave/LeaveBalanceCard.jsx';
import LeaveRequestForm from '../../components/leave/LeaveRequestForm.jsx';
import LeaveRequestList from '../../components/leave/LeaveRequestList.jsx';

export default function LeavePage() {
  const { user } = useAuth();
  const { leaves, balances, loading, submit, cancel, refresh } = useMyLeaves(user?.id);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function handleSubmit(request) {
    setIsSubmitting(true);
    const result = await submit(request);
    setIsSubmitting(false);

    if (result.error) {
      setFeedback({ type: 'error', message: result.error });
      return result;
    }

    setFeedback({ type: 'success', message: 'Leave request submitted successfully!' });
    setShowForm(false);
    setTimeout(() => setFeedback(null), 4000);
    return result;
  }

  async function handleCancel(leaveId) {
    const result = await cancel(leaveId);
    if (result.error) {
      setFeedback({ type: 'error', message: result.error });
    } else {
      setFeedback({ type: 'success', message: 'Leave request cancelled.' });
      setTimeout(() => setFeedback(null), 4000);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Leave Management</h2>
          <p>View your balances, submit requests, and track status</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" onClick={refresh}>↻ Refresh</button>
          <button className="btn btn-accent" onClick={() => setShowForm(true)}>
            + New Request
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className={`alert alert-${feedback.type}`}>
          <span>{feedback.type === 'success' ? '✓' : '⚠️'}</span>
          {feedback.message}
        </div>
      )}

      {/* Balance Cards */}
      <LeaveBalanceCard balances={balances} />

      {/* Leave History */}
      <div className="card">
        <div className="card-header">
          <h3>Leave History</h3>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            {leaves.length} request{leaves.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="loading-container">
            <span className="loading-spinner"></span>
          </div>
        ) : (
          <LeaveRequestList
            leaves={leaves}
            onCancel={handleCancel}
            userRole={user?.role || 'employee'}
          />
        )}
      </div>

      {/* Request Form Modal */}
      {showForm && (
        <LeaveRequestForm
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
