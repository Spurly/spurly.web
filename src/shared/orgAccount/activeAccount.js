import {
  ORG_ACTIVE_ACCOUNT_KEY,
  ORG_ACTIVE_ACCOUNT_EVENT,
  ORG_KNOWN_ACCOUNTS_KEY,
  ORG_ACCOUNT_BOUND_PATHS,
  ORG_ACCOUNT_BODY_PATHS,
  ORG_ALL_VIEW_PAGES,
  ORG_ALL_VIEW_READS,
  ORG_LEAD_PATH,
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

/** The usable accounts last seen for this member (so the default is known before the first request). */
export function getKnownAccounts() {
  const userId = sessionUserId();
  try {
    const seen = JSON.parse(localStorage.getItem(ORG_KNOWN_ACCOUNTS_KEY) || 'null');
    if (!seen || !userId || String(seen.userId) !== userId) return { orgId: '', accounts: [] };
    return { orgId: String(seen.orgId || ''), accounts: Array.isArray(seen.accounts) ? seen.accounts : [] };
  } catch {
    return { orgId: '', accounts: [] };
  }
}

export function rememberAccounts(orgId, accounts) {
  const userId = sessionUserId();
  if (!userId) return;
  const slim = accounts.map((a) => ({ id: String(a.id), name: a.name, publicIdentifier: a.publicIdentifier }));
  try {
    localStorage.setItem(ORG_KNOWN_ACCOUNTS_KEY, JSON.stringify({ userId, orgId: String(orgId), accounts: slim }));
  } catch {
    /* storage unavailable: the list is simply fetched again next time */
  }
}

/**
 * The account requests act through, or '' when the server should pick (one account) or nothing is known yet.
 * With several accounts one is ALWAYS in effect: the member's choice if it is still valid, otherwise the first one.
 * Pure and synchronous, so a request fired before any component has mounted still carries the right account.
 */
export function getActiveAccountId() {
  const stored = readStored();
  const userId = sessionUserId();
  if (!userId) return '';
  const chosen = stored && String(stored.userId) === userId ? String(stored.accountId || '') : '';
  const { accounts } = getKnownAccounts();
  if (accounts.length < 2) return chosen;
  if (chosen && accounts.some((a) => String(a.id) === chosen)) return chosen;
  return String(accounts[0].id);
}

/**
 * Choose one account. This leaves the "All accounts" view, unless `keepAll` is set (the New audience dialog picks the
 * account to fetch from without leaving the all-accounts list behind it).
 */
export function setActiveAccountId(accountId, { keepAll = false } = {}) {
  const userId = sessionUserId();
  if (!userId) return;
  try {
    const all = keepAll && readStored()?.all === true;
    if (accountId) localStorage.setItem(ORG_ACTIVE_ACCOUNT_KEY, JSON.stringify({ userId, accountId: String(accountId), ...(all ? { all: true } : {}) }));
    else localStorage.removeItem(ORG_ACTIVE_ACCOUNT_KEY);
  } catch {
    /* storage unavailable: the choice just does not persist */
  }
  window.dispatchEvent(new Event(ORG_ACTIVE_ACCOUNT_EVENT));
}

/** The member asked to see every account's leads (kept next to the account choice, so the last single account stays known). */
export function wantsAllAccounts() {
  const stored = readStored();
  const userId = sessionUserId();
  return Boolean(userId && stored && String(stored.userId) === userId && stored.all === true && getKnownAccounts().accounts.length >= 2);
}

export function setAllAccountsView(on) {
  const userId = sessionUserId();
  if (!userId) return;
  const accountId = getActiveAccountId();
  try {
    localStorage.setItem(ORG_ACTIVE_ACCOUNT_KEY, JSON.stringify({ userId, accountId: String(accountId || ''), ...(on ? { all: true } : {}) }));
  } catch {
    /* storage unavailable: the choice just does not persist */
  }
  window.dispatchEvent(new Event(ORG_ACTIVE_ACCOUNT_EVENT));
}

const onAllViewPage = () => ORG_ALL_VIEW_PAGES.some((p) => window.location.pathname === p || window.location.pathname.startsWith(`${p}/`));

/** True when the all-accounts view is chosen AND the current page supports it. */
export function isAllAccountsView() {
  return wantsAllAccounts() && onAllViewPage();
}

// Which accounts hold each lead currently on screen (from the all-accounts list), so opening or acting on one lead goes
// through an account that actually holds it. Browser memory only; filled by the leads list.
const leadAccounts = new Map();
export function rememberLeadAccounts(leads = []) {
  for (const l of leads) if (l?._id && Array.isArray(l.orgAccountIds) && l.orgAccountIds.length) leadAccounts.set(String(l._id), l.orgAccountIds.map(String));
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
  let accountId = getActiveAccountId();
  if (!accountId) return config;
  const rawUrl = String(config.url || '');
  const path = rawUrl.split('?')[0];
  if (isAllAccountsView()) {
    const isGet = String(config.method || 'get').toLowerCase() === 'get';
    // Every account's rows: the list reads carry no account at all.
    if (isGet && ORG_ALL_VIEW_READS.some((rule) => rule.test(path))) return config;
    // One lead's own calls: use the current account if it holds the lead, otherwise the first account that does.
    const m = ORG_LEAD_PATH.exec(path);
    const holders = m ? leadAccounts.get(m[1]) : null;
    if (holders && holders.length && !holders.includes(String(accountId))) accountId = holders[0];
  }
  if (!ORG_ACCOUNT_BOUND_PATHS.some((rule) => rule.test(path)) && !ORG_ACCOUNT_BODY_PATHS.some((rule) => rule.test(path))) return config;
  if (/[?&]accountId=/.test(rawUrl) || config.params?.accountId) return config;

  const method = String(config.method || 'get').toLowerCase();
  if (method === 'post' && ORG_ACCOUNT_BODY_PATHS.some((rule) => rule.test(path))) {
    // A body that names several accounts (`accountIds`, a pool) already says who sends: never add a single one.
    if (isPlainObject(config.data) && !config.data.accountId && !Array.isArray(config.data.accountIds)) config.data = { ...config.data, accountId };
    return config;
  }
  config.params = { ...(config.params || {}), accountId };
  return config;
}
