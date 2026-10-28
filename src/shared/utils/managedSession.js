/**
 * Marks this browser's session as a partner-managed one ("Open in Spurly").
 *
 * Set when the one-time link is exchanged, and read where a managed session
 * must behave differently: a lost session goes to the "session ended" page
 * instead of a login form (managed accounts have no password), and the
 * "Open in Spurly" screen knows whether a different, normal session is
 * already here. A normal sign-in clears it. It lives in shared/ because the
 * API gateway's 401 handler needs it and shared may not import from core.
 */
export const MANAGED_SESSION_KEY = 'managedSession';

export function isManagedSession() {
  // The prerender (SSR) has no localStorage, and AuthProvider asks at render time.
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(MANAGED_SESSION_KEY) === '1';
}

export function markManagedSession() {
  localStorage.setItem(MANAGED_SESSION_KEY, '1');
}

export function clearManagedSession() {
  localStorage.removeItem(MANAGED_SESSION_KEY);
}
