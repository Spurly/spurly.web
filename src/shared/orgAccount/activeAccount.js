import {
  ORG_ACTIVE_ACCOUNT_KEY,
  ORG_ACTIVE_ACCOUNT_EVENT,
  ORG_ACCOUNT_BOUND_PATHS,
  ORG_ACCOUNT_BODY_PATHS,
} from './constants/constants.js';

/**
 * The organization member's chosen LinkedIn account, kept in this browser. The choice belongs to one signed-in
 * member: it is ignored unless the org-session marker names the same user, so a leftover value can never leak into
 * another person's session or into a solo account. Browser storage can be unavailable, so every access is guarded.
 */

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(ORG_ACTIVE_ACCOUNT_KEY) || 'null');
  } catch {
    return null;
  }
}

/** The signed-in user (the same record the gateway's token belongs to), so it also holds for a member who signed in
 *  with a password or Google, or whom an admin opened, and not only after the org-email sign-in set its marker. */
function sessionUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return String(user?._id || user?.id || '');
  } catch {
    return '';
  }
}

/** The chosen account id, or '' when none is chosen (the server then picks the only account, or asks). */
export function getActiveAccountId() {
  const stored = readStored();
  const userId = sessionUserId();
  if (!stored || !userId || String(stored.userId) !== userId) return '';
  return String(stored.accountId || '');
}

export function setActiveAccountId(accountId) {
  const userId = sessionUserId();
  if (!userId) return;
  try {
    if (accountId) localStorage.setItem(ORG_ACTIVE_ACCOUNT_KEY, JSON.stringify({ userId, accountId: String(accountId) }));
    else localStorage.removeItem(ORG_ACTIVE_ACCOUNT_KEY);
  } catch {
    /* storage unavailable: the choice just does not persist */
  }
  window.dispatchEvent(new Event(ORG_ACTIVE_ACCOUNT_EVENT));
}

export function subscribeActiveAccount(listener) {
  window.addEventListener(ORG_ACTIVE_ACCOUNT_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(ORG_ACTIVE_ACCOUNT_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

/**
 * Request interceptor step: adds `accountId` to an account-bound request when the member has chosen one and the
 * request does not already carry its own. Returns the config (changed or not); never throws.
 */
export function withActiveAccount(config) {
  const accountId = getActiveAccountId();
  if (!accountId) return config;
  const rawUrl = String(config.url || '');
  const path = rawUrl.split('?')[0];
  if (!ORG_ACCOUNT_BOUND_PATHS.some((rule) => rule.test(path)) && !ORG_ACCOUNT_BODY_PATHS.some((rule) => rule.test(path))) return config;
  if (/[?&]accountId=/.test(rawUrl) || config.params?.accountId) return config;

  const method = String(config.method || 'get').toLowerCase();
  if (method === 'post' && ORG_ACCOUNT_BODY_PATHS.some((rule) => rule.test(path))) {
    if (isPlainObject(config.data) && !config.data.accountId) config.data = { ...config.data, accountId };
    return config;
  }
  config.params = { ...(config.params || {}), accountId };
  return config;
}
