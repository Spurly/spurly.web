/**
 * Marks this browser's session as an organization member's (signed in with the
 * org email + code). Settings shows its Organization tab only while the marker
 * names the signed-in user, so a leftover marker from someone else can never
 * show the tab (and never trigger a request that would sign them out).
 */
export const ORG_SESSION_KEY = 'orgSessionUser';

export function markOrgSession(userId) {
  if (userId) localStorage.setItem(ORG_SESSION_KEY, String(userId));
}

export function clearOrgSession() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(ORG_SESSION_KEY);
}

/** True when the stored marker belongs to this user. */
export function isOrgSessionFor(user) {
  if (typeof localStorage === 'undefined') return false;
  const id = user?._id || user?.id;
  return Boolean(id) && localStorage.getItem(ORG_SESSION_KEY) === String(id);
}
