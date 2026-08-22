/**
 * Dayflow — Leave Status Badge
 * Shared component: colored status pill with dot indicator.
 */

import { LEAVE_STATUS_LABELS, ATTENDANCE_STATUS_LABELS } from '../../lib/constants.js';

export default function StatusBadge({ status, type = 'leave' }) {
  const labels = type === 'leave' ? LEAVE_STATUS_LABELS : ATTENDANCE_STATUS_LABELS;
  const label = labels[status] || status;

  // Normalize class name: 'half-day' → 'half-day'
  const className = `badge badge-${status}`;

  return (
    <span className={className}>
      <span style={{ fontSize: '0.5rem' }}>●</span>
      {label}
    </span>
  );
}
