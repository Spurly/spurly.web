import { Navigate } from 'react-router-dom';
import { useOrgState } from '../hooks/useOrgState.js';

/**
 * Keeps an organization member off a page whose workspace feature is off (for example the Inbox of
 * a partner-managed organization, D50). It reads the same server answer the sidebar uses, so there
 * is one source of truth. Solo users and a not-yet-loaded answer always pass through; the server
 * still answers 403 for the data, this only removes the dead page.
 */
export function OrgFeatureGate({ feature, children }) {
  const org = useOrgState();
  if (org.loaded && org.isMember && org.features[feature] !== true) return <Navigate to="/dashboard/settings" replace />;
  return children;
}
