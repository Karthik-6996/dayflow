/**
 * Dayflow — Leave Request Form
 * Employee submits a new leave request via this modal form.
 */

import { useState } from 'react';
import { LEAVE_TYPE, LEAVE_TYPE_LABELS } from '../../lib/constants.js';

export default function LeaveRequestForm({ onSubmit, onClose, isSubmitting }) {
  const [form, setForm] = useState({
    type: LEAVE_TYPE.PAID,
    startDate: '',
    endDate: '',
    remarks: '',
  });
  const [errors, setErrors] = useState([]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors([]); // Clear errors on change
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);

    // Basic client-side validation before calling the service
    const clientErrors = [];
    if (!form.type) clientErrors.push('Please select a leave type.');
    if (!form.startDate) clientErrors.push('Start date is required.');
    if (!form.endDate) clientErrors.push('End date is required.');
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      clientErrors.push('Start date must be before or equal to end date.');
    }

    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }

    const result = await onSubmit({
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      remarks: form.remarks,
    });

    if (result?.error) {
      setErrors([result.error]);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📋 New Leave Request</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {errors.length > 0 && (
          <div className="alert alert-error">
            <span>⚠️</span>
            <div>{errors.join(' ')}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="leave-type">Leave Type</label>
            <select
              id="leave-type"
              name="type"
              className="form-select"
              value={form.type}
              onChange={handleChange}
            >
              {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="start-date">Start Date</label>
              <input
                id="start-date"
                name="startDate"
                type="date"
                className="form-input"
                value={form.startDate}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="end-date">End Date</label>
              <input
                id="end-date"
                name="endDate"
                type="date"
                className="form-input"
                value={form.endDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="remarks">Remarks (optional)</label>
            <textarea
              id="remarks"
              name="remarks"
              className="form-textarea"
              value={form.remarks}
              onChange={handleChange}
              placeholder="Reason for leave..."
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-accent" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span>
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
