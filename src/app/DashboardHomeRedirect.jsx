import { Navigate } from 'react-router-dom';

/**
 * Where bare /dashboard sends a signed-in, subscribed user.
 *
 * The People page used to be this landing surface unconditionally; it was
 * retired (2026-09-14) in favor of Hub's lead list. The old two-tier
 * leadgen/hub entitlement split (HubGate) was removed the same day — every
 * active subscriber now has full access — so this is now an unconditional
 * redirect rather than an entitlement check.
 *
 * Nested exactly where /dashboard/people used to render, so it inherits the
 * same guards: <ProtectedRoute><SubscribeGate><DashboardHomeRedirect /></SubscribeGate></ProtectedRoute>.
 */
export function DashboardHomeRedirect() {
  return <Navigate to="/hub/leads" replace />;
}
