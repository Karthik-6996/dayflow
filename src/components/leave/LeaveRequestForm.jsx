/**
 * Dayflow — Leave Request Form
 * Employee submits a new leave request via this modal form.
 */

import { useState } from 'react';
import { LEAVE_TYPE, LEAVE_TYPE_LABELS } from '../../lib/constants.js';
import { calculateWorkingDays } from '../../lib/leaveValidation.js';

export default function LeaveRequestForm({ onSubmit, onClose, isSubmitting }) {
  const [form, setForm] = useState({
    type: LEAVE_TYPE.PAID,
    startDate: '',
    endDate: '',
    isHalfDay: false,
    halfDaySession: 'first_half',
    remarks: '',
    documentName: null,
    documentUrl: null
  });
  const [errors, setErrors] = useState([]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setErrors([]);

    if (name === 'isHalfDay') {
      setForm((prev) => ({
        ...prev,
        isHalfDay: checked,
        endDate: checked && prev.startDate ? prev.startDate : prev.endDate
      }));
      return;
    }

    if (name === 'startDate') {
      setForm((prev) => ({
        ...prev,
        startDate: value,
        endDate: prev.isHalfDay ? value : (prev.endDate && prev.endDate < value ? value : prev.endDate)
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({
        ...prev,
        documentName: file.name,
        documentUrl: reader.result
      }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);

    // Basic client-side validation
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
      isHalfDay: form.isHalfDay,
      halfDaySession: form.halfDaySession,
      remarks: form.remarks,
      documentName: form.documentName,
      documentUrl: form.documentUrl
    });

    if (result?.error) {
      setErrors([result.error]);
    }
  }

  const daysCount = form.startDate && form.endDate
    ? calculateWorkingDays(form.startDate, form.endDate, form.isHalfDay)
    : 0;

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

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="isHalfDay"
                checked={form.isHalfDay}
                onChange={handleChange}
              />
              <span>Half-Day Leave (0.5 Day)</span>
            </label>

            {form.isHalfDay && (
              <div style={{ display: 'flex', gap: 16, marginTop: 6, marginLeft: 24, fontSize: '0.85rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="halfDaySession"
                    value="first_half"
                    checked={form.halfDaySession === 'first_half'}
                    onChange={handleChange}
                  />
                  <span>First Half</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="halfDaySession"
                    value="second_half"
                    checked={form.halfDaySession === 'second_half'}
                    onChange={handleChange}
                  />
                  <span>Second Half</span>
                </label>
              </div>
            )}
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
                disabled={form.isHalfDay}
              />
            </div>
          </div>

          {form.startDate && form.endDate && (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>
              Working Days: <strong>{daysCount}</strong> (Weekends & gazetted holidays excluded)
            </div>
          )}

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

          <div className="form-group">
            <label className="form-label">Supporting Document (optional)</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              style={{ fontSize: '0.85rem' }}
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

