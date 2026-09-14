import { Navigate } from 'react-router-dom';
import { useSubscription } from 'src/platform/billing/hooks/useSubscription';

/**
 * Where bare /dashboard sends a signed-in, subscribed user.
 *
 * The People page used to be this landing surface unconditionally — any
 * active subscriber could open it. It was retired (2026-09-14), and its
 * natural replacement, Hub's lead list, is NOT unconditional: it sits behind
 * HubGate, which every leadgen-only (non-hub) subscriber fails.
 *
 * Sending everyone to /hub/leads would have silently turned bare /dashboard
 * — the target every login, signup, password reset, onboarding step and the
 * marketing nav redirect to — into a one-way trip to /hub/upgrade for any
 * non-hub subscriber, with no way back to the product they're actually
 * paying for. This checks entitlement first so each subscriber lands
 * somewhere they can actually use: Hub's lead list if they have hub,
 * otherwise Import (first item under Prospect in the leadgen nav).
 *
 * Nested exactly where /dashboard/people used to render, so it inherits the
 * same guards: <ProtectedRoute><SubscribeGate><DashboardHomeRedirect /></SubscribeGate></ProtectedRoute>.
 */
export function DashboardHomeRedirect() {
  const { status, ready } = useSubscription();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ui-surface-page)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--ui-accent)] mx-auto mb-4"></div>
          <p className="text-[var(--ui-text-secondary)] text-[var(--ui-t-body)]">Loading...</p>
        </div>
      </div>
    );
  }

  return <Navigate to={status?.hasHub() ? '/hub/leads' : '/dashboard/import'} replace />;
}
