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

/**
 * Events the account-health controller emits and useAccountHealth listens for.
 * Separate from ACCOUNT_EVENTS: health is read and refreshed independently of
 * the connection itself.
 */
export const ACCOUNT_HEALTH_EVENTS = {
  GET_SUCCESS: 'ACCOUNT_HEALTH_GET_SUCCESS',
  GET_FAILURE: 'ACCOUNT_HEALTH_GET_FAILURE',
  REFRESH_SUCCESS: 'ACCOUNT_HEALTH_REFRESH_SUCCESS',
  REFRESH_FAILURE: 'ACCOUNT_HEALTH_REFRESH_FAILURE',
};

/**
 * The first read of a never-checked account makes the server start a
 * background refresh (it calls LinkedIn's slow own-profile endpoint, 3-6s), so
 * the card re-reads a few times until the stored data lands. Bounded: if it has
 * not arrived after this, the card says so and offers Refresh instead of
 * polling for ever.
 */
export const HEALTH_POLL_INTERVAL_MS = 4000;
export const HEALTH_POLL_MAX_ATTEMPTS = 5;

/** Events for the native (own-form) LinkedIn sign-in. See useLinkedInConnect.js. */
export const NATIVE_CONNECT_EVENTS = {
  STEP_SUCCESS: 'NATIVE_CONNECT_STEP_SUCCESS',
  STEP_FAILURE: 'NATIVE_CONNECT_STEP_FAILURE',
  POLL_SUCCESS: 'NATIVE_CONNECT_POLL_SUCCESS',
  POLL_FAILURE: 'NATIVE_CONNECT_POLL_FAILURE',
  RESEND_SUCCESS: 'NATIVE_CONNECT_RESEND_SUCCESS',
  RESEND_FAILURE: 'NATIVE_CONNECT_RESEND_FAILURE',
  OPTIONS_SUCCESS: 'NATIVE_CONNECT_OPTIONS_SUCCESS',
  OPTIONS_FAILURE: 'NATIVE_CONNECT_OPTIONS_FAILURE',
};

/**
 * While waiting for the user to approve the sign-in in the LinkedIn app (or a
 * "Yes, it's me" email), ask the server this often. Bounded by the provider's
 * own 5-minute sign-in window, plus a little slack.
 */
export const APPROVAL_POLL_INTERVAL_MS = 3000;
export const APPROVAL_POLL_TIMEOUT_MS = 5.5 * 60 * 1000;

/** Checkpoint types the native form can render. Anything else -> hosted page. */
export const CHECKPOINT_TYPES = {
  TWO_FA: '2FA',
  OTP: 'OTP',
  IN_APP: 'IN_APP_VALIDATION',
  PHONE: 'PHONE_REGISTER',
};

/**
 * Headline for each native sign-in failure. The server writes the detail
 * (what happened, what to do); this is the one-line title above it, so the
 * user can tell at a glance whether to retype, wait, or try something else.
 */
export const CONNECT_ERROR_TITLES = {
  INVALID_CREDENTIALS: 'Wrong email or password',
  INVALID_COOKIE: 'That cookie didn’t work',
  INVALID_CODE: 'That code didn’t work',
  INVALID_FIELD: 'Check this field',
  MISSING_FIELD: 'Something’s missing',
  EXPIRED: 'Sign-in expired',
  RATE_LIMITED: 'Too many attempts',
  IN_PROGRESS: 'A sign-in is already running',
  ACCOUNT_RESTRICTED: 'LinkedIn has restricted this account',
  PROXY_INVALID: 'Proxy problem',
  TIMEOUT: 'LinkedIn is slow to respond',
  PROVIDER_ERROR: 'Couldn’t reach LinkedIn',
  UNSUPPORTED_CHECKPOINT: 'LinkedIn needs an extra check',
  NO_ALTERNATIVE: 'No other way to verify',
  ALREADY_CONNECTED: 'Already connected',
  ALREADY_BOUND: 'Account in use',
  NOT_CONFIGURED: 'Unavailable right now',
};

/**
 * Countries offered for the sign-in proxy. ISO 3166-1 alpha-2, which is what
 * the provider takes. "Automatic" (the user's own location) is the default and
 * the right choice for almost everyone; this list is for people who travel or
 * use LinkedIn from a different country than they browse from.
 */
export const PROXY_COUNTRIES = [
  ['IN', 'India'], ['US', 'United States'], ['GB', 'United Kingdom'], ['CA', 'Canada'],
  ['AU', 'Australia'], ['AE', 'United Arab Emirates'], ['SG', 'Singapore'], ['DE', 'Germany'],
  ['FR', 'France'], ['NL', 'Netherlands'], ['ES', 'Spain'], ['IT', 'Italy'], ['IE', 'Ireland'],
  ['SE', 'Sweden'], ['CH', 'Switzerland'], ['BE', 'Belgium'], ['PL', 'Poland'], ['PT', 'Portugal'],
  ['BR', 'Brazil'], ['MX', 'Mexico'], ['ZA', 'South Africa'], ['SA', 'Saudi Arabia'],
  ['IL', 'Israel'], ['JP', 'Japan'], ['NZ', 'New Zealand'], ['PH', 'Philippines'],
  ['ID', 'Indonesia'], ['MY', 'Malaysia'], ['PK', 'Pakistan'], ['BD', 'Bangladesh'],
  ['NG', 'Nigeria'], ['KE', 'Kenya'], ['EG', 'Egypt'], ['TR', 'Turkey'],
].map(([code, name]) => ({ code, name }));

/** Display name for an ISO-2 code, including ones not in PROXY_COUNTRIES. */
export function countryName(code) {
  if (!code) return '';
  const listed = PROXY_COUNTRIES.find((c) => c.code === code)?.name;
  if (listed) return listed;
  return typeof Intl !== 'undefined' && Intl.DisplayNames
    ? new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code
    : code;
}
