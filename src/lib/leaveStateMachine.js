/**
 * Dayflow — Leave Request State Machine
 *
 * Pure functions defining valid status transitions and authorization.
 * Zero framework/Supabase dependencies — importable by any teammate's module.
 *
 * State diagram:
 *   (new) ──submit──▶ pending ──approve──▶ approved
 *                       │  │
 *                       │  └──reject──▶ rejected
 *                       │
 *                       └──cancel──▶ cancelled
 */

import { LEAVE_STATUS, USER_ROLE } from './constants.js';

// ── Transition Table ────────────────────────────────────────────
// Maps: currentStatus → { action → nextStatus }
const TRANSITIONS = Object.freeze({
  [LEAVE_STATUS.PENDING]: {
    cancel:  LEAVE_STATUS.CANCELLED,
    approve: LEAVE_STATUS.APPROVED,
    reject:  LEAVE_STATUS.REJECTED,
  },
  // Terminal states — no outgoing transitions
  [LEAVE_STATUS.APPROVED]:  {},
  [LEAVE_STATUS.REJECTED]:  {},
  [LEAVE_STATUS.CANCELLED]: {},
});

// ── Action Authorization ────────────────────────────────────────
// Who is allowed to trigger each action
const ACTION_AUTH = Object.freeze({
  cancel:  { role: USER_ROLE.EMPLOYEE, ownerOnly: true },
  approve: { role: USER_ROLE.ADMIN,    ownerOnly: false },
  reject:  { role: USER_ROLE.ADMIN,    ownerOnly: false },
});

// ── Public API ──────────────────────────────────────────────────

/**
 * Check whether a transition is valid AND the user is authorized.
 *
 * @param {string} currentStatus - Current leave status
 * @param {string} action        - Action being attempted (cancel|approve|reject)
 * @param {string} userRole      - Role of the user attempting the action
 * @param {boolean} isOwner      - Whether the user owns this leave request
 * @returns {boolean}
 */
export function canTransition(currentStatus, action, userRole, isOwner) {
  // 1. Is the transition structurally valid?
  const transitions = TRANSITIONS[currentStatus];
  if (!transitions || !(action in transitions)) return false;

  // 2. Is the user authorized?
  const auth = ACTION_AUTH[action];
  if (!auth) return false;

  // Admins can do anything that requires 'admin' role
  if (auth.role === USER_ROLE.ADMIN && userRole !== USER_ROLE.ADMIN) return false;

  // Owner-only actions: user must own the request
  if (auth.ownerOnly && !isOwner) return false;

  return true;
}

/**
 * Get the next status for a given transition.
 * Returns null if the transition is not valid.
 *
 * @param {string} currentStatus
 * @param {string} action
 * @returns {string|null}
 */
export function nextStatus(currentStatus, action) {
  return TRANSITIONS[currentStatus]?.[action] ?? null;
}

/**
 * Get all valid actions for a leave request given the user's role and ownership.
 *
 * @param {string} currentStatus
 * @param {string} userRole
 * @param {boolean} isOwner
 * @returns {string[]} Array of valid action names
 */
export function getAvailableActions(currentStatus, userRole, isOwner) {
  const transitions = TRANSITIONS[currentStatus];
  if (!transitions) return [];

  return Object.keys(transitions).filter(
    (action) => canTransition(currentStatus, action, userRole, isOwner)
  );
}

/**
 * Determine whether a given status is terminal (no further transitions).
 *
 * @param {string} status
 * @returns {boolean}
 */
export function isTerminalStatus(status) {
  const transitions = TRANSITIONS[status];
  return !transitions || Object.keys(transitions).length === 0;
}

/**
 * Execute a transition with full validation.
 * Returns { success, nextStatus, error }.
 *
 * @param {Object} params
 * @param {string} params.currentStatus
 * @param {string} params.action
 * @param {string} params.userRole
 * @param {boolean} params.isOwner
 * @param {string} [params.comments] - Required for 'reject' action
 * @returns {{ success: boolean, nextStatus: string|null, error: string|null }}
 */
export function executeTransition({ currentStatus, action, userRole, isOwner, comments }) {
  // Validate transition
  if (!canTransition(currentStatus, action, userRole, isOwner)) {
    // Provide specific error messages
    const transitions = TRANSITIONS[currentStatus];
    if (!transitions || !(action in transitions)) {
      return {
        success: false,
        nextStatus: null,
        error: `Cannot "${action}" a request that is "${currentStatus}".`,
      };
    }
    return {
      success: false,
      nextStatus: null,
      error: `You do not have permission to "${action}" this request.`,
    };
  }

  // Reject requires comments
  if (action === 'reject' && (!comments || comments.trim().length === 0)) {
    return {
      success: false,
      nextStatus: null,
      error: 'A reason (comments) is required when rejecting a leave request.',
    };
  }

  return {
    success: true,
    nextStatus: nextStatus(currentStatus, action),
    error: null,
  };
}
