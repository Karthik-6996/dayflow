/**
 * Dayflow — Leave Balance Cards
 * Displays remaining leave balance per type (paid, sick, unpaid).
 */

import { LEAVE_TYPE, LEAVE_TYPE_LABELS } from '../../lib/constants.js';

export default function LeaveBalanceCard({ balances }) {
  const types = [LEAVE_TYPE.PAID, LEAVE_TYPE.SICK, LEAVE_TYPE.UNPAID];

  return (
    <div className="balance-grid">
      {types.map((type) => {
        const bal = balances[type];
        const isUnlimited = bal.available === Infinity;

        return (
          <div key={type} className={`balance-card ${type}`}>
            <div className="balance-type">{LEAVE_TYPE_LABELS[type]}</div>
            <div className="balance-value">
              {isUnlimited ? '∞' : bal.available}
            </div>
            <div className="balance-detail">
              {isUnlimited
                ? 'No limit'
                : `${bal.used} used · ${bal.pending} pending · ${bal.total} total`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
