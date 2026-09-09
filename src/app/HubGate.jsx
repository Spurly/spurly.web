import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from 'src/platform/billing/useSubscription';

/**
 * Entitlement gate for /hub/*, nested inside SubscribeGate:
 *   <ProtectedRoute><SubscribeGate><HubGate><Page /></HubGate></SubscribeGate></ProtectedRoute>
 *
 * The nesting IS the ordering: signed in, then paid up, then entitled. An
 * unpaid account must reach /subscribe, not an upgrade page for a tier it
 * cannot buy without paying first - which is the same reason requireHubAccess
 * sits after requireActiveSubscription on the server.
 *
 * It redirects to /hub/upgrade rather than rendering the upgrade view in
 * place, so there is one URL for "you do not have this" and the browser's back
 * button behaves. `from` is carried for whenever hub becomes self-serve and
 * the page can return someone to what they were reaching for.
 *
 * Like SubscribeGate, it waits on `ready` and never on `!loading`: a status we
 * have not fetched yet is not the same answer as no entitlement, and treating
 * it as one is what used to bounce paid users out of the app on every refresh.
 *
 * This gate is a courtesy to the user, not the boundary. The API refuses hub
 * requests with 403 HUB_ACCESS_REQUIRED whatever this component renders.
 */
export function HubGate({ children }) {
  const { status, ready } = useSubscription();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ui-surface-page)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--ui-accent)] mx-auto mb-4"></div>
          <p className="text-[var(--ui-text-secondary)] text-[13px]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!status?.hasHub()) {
    return <Navigate to="/hub/upgrade" replace state={{ from: location.pathname }} />;
  }

  return children;
}
