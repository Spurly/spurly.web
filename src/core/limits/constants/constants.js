/**
 * Event names the limits controller emits and useLimits listens for.
 * Centralized so the two sides can never drift — same reasoning as
 * core/sidebarSummary/constants/constants.js.
 */
export const LIMITS_EVENTS = {
  LOAD_SUCCESS: 'LIMITS_LOAD_SUCCESS',
  LOAD_FAILURE: 'LIMITS_LOAD_FAILURE',
  SAVE_SUCCESS: 'LIMITS_SAVE_SUCCESS',
  SAVE_FAILURE: 'LIMITS_SAVE_FAILURE',
};

/** How often the tracker refreshes while the Sending hours tab is open. */
export const LIMITS_POLL_MS = 60 * 1000;
