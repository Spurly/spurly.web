/**
 * Admin "login as" support.
 *
 * Swaps the browser's session to another user's token/user without ever
 * touching their password — the token comes from POST /auth/impersonate/:id
 * (admin-only, backend-gated). The admin's own session is kept under a
 * separate localStorage key so `exitImpersonation` can restore it exactly.
 *
 * Deliberately keyed differently from the normal `authToken`/`user` pair:
 * apiGateway's interceptor and AuthContext's startup check both read
 * `authToken`/`user` directly, so from their point of view an impersonated
 * session is indistinguishable from a normal login — no extra plumbing
 * needed anywhere else in the app.
 */
const ADMIN_TOKEN_KEY = 'adminAuthToken';
const ADMIN_USER_KEY = 'adminUser';

export function isImpersonating() {
  return !!localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function getImpersonatingAdmin() {
  const json = localStorage.getItem(ADMIN_USER_KEY);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('Error parsing stored admin user:', error);
    return null;
  }
}

/**
 * Switch the browser session to the target user and hard-reload into the
 * dashboard, same as every other auth transition in this app (login,
 * logout, LinkedIn OAuth) — a full navigation rebuilds every provider from
 * the new localStorage state instead of leaving stale React state behind.
 *
 * Refuses to stack a second impersonation on top of a first, so the saved
 * "admin" session is always the real admin, not a previous target user.
 *
 * @param {{ targetToken: string, targetUser: object }} params
 */
export function startImpersonation({ targetToken, targetUser }) {
  if (!targetToken || !targetUser) return;
  if (isImpersonating()) return;

  const adminToken = localStorage.getItem('authToken');
  const adminUser = localStorage.getItem('user');
  if (adminToken) localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
  if (adminUser) localStorage.setItem(ADMIN_USER_KEY, adminUser);

  localStorage.setItem('authToken', targetToken);
  localStorage.setItem('user', JSON.stringify(targetUser));

  window.location.href = '/dashboard';
}

/**
 * Restore the original admin session and return to the admin Users page.
 */
export function exitImpersonation() {
  const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
  const adminUser = localStorage.getItem(ADMIN_USER_KEY);

  if (adminToken) localStorage.setItem('authToken', adminToken);
  if (adminUser) localStorage.setItem('user', adminUser);

  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);

  window.location.href = '/admin/users';
}
