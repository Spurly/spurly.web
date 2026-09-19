import { Navigate } from 'react-router-dom';

/**
 * Where bare /dashboard sends a signed-in, subscribed user.
 *
 * The People page used to be this landing surface unconditionally; it was
 * retired (2026-09-14) in favor of Hub's lead list. The old two-tier
 * leadgen/hub entitlement split (HubGate) was removed the same day — every
 * active subscriber now has full access — so this became an unconditional
 * redirect rather than an entitlement check.
 *
 * Repointed (2026-09-19, Blue Identity v3 Phase 4b) from /hub/leads to
 * /hub/dashboard now that Hub has an actual landing/overview screen —
 * see docs/UI_REDESIGN_PLAN.md.
 *
 * Nested exactly where /dashboard/people used to render, so it inherits the
 * same guards: <ProtectedRoute><SubscribeGate><DashboardHomeRedirect /></SubscribeGate></ProtectedRoute>.
 */
export function DashboardHomeRedirect() {
  return <Navigate to="/hub/dashboard" replace />;
}
