/**
 * Polling while the account is CONNECTING (webhook confirmation may never
 * reach a local dev machine — see useLinkedInSettings.js for why this polls
 * at all). Also reused for the post-redirect retry loop, which shares the
 * same "ask the vendor, not just our own row" reasoning.
 */
export const POLL_INTERVAL_MS = 5000;

/** Give up polling CONNECTING after this long — something is actually wrong. */
export const POLL_TIMEOUT_MS = 120000;

/** Ask the vendor directly (not just our own row) on every Nth poll tick. */
export const POLL_VENDOR_CHECK_EVERY = 3;

/** How many times to retry pulling the account right after the hosted-auth redirect. */
export const REDIRECT_MAX_ATTEMPTS = 3;

/** Events the account controller emits and the settings hook listens for. */
export const ACCOUNT_EVENTS = {
  GET_SUCCESS: 'ACCOUNT_GET_SUCCESS',
  GET_FAILURE: 'ACCOUNT_GET_FAILURE',
  CREATE_LINK_SUCCESS: 'ACCOUNT_CREATE_LINK_SUCCESS',
  CREATE_LINK_FAILURE: 'ACCOUNT_CREATE_LINK_FAILURE',
  REFRESH_SUCCESS: 'ACCOUNT_REFRESH_SUCCESS',
  REFRESH_FAILURE: 'ACCOUNT_REFRESH_FAILURE',
  DISCONNECT_SUCCESS: 'ACCOUNT_DISCONNECT_SUCCESS',
  DISCONNECT_FAILURE: 'ACCOUNT_DISCONNECT_FAILURE',
};
