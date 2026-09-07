import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from 'src/platform/billing/useSubscription';

/**
 * Wraps ProtectedRoute content that additionally requires an ACTIVE
 * subscription — onboarding, the extension-install step, and everything
 * under /dashboard. Nests inside ProtectedRoute (auth first, then billing):
 *   <ProtectedRoute><SubscribeGate><Page /></SubscribeGate></ProtectedRoute>
 *
 * Fails closed: anything other than status === 'active' (including 'none',
 * 'pending_authorization', 'past_due', 'cancelled', and a null status we have
 * actually heard back about) redirects to /subscribe. /subscribe itself
 * renders different copy depending on which of those it is (see
 * SubscribePage).
 *
 * "Failing closed" is about the ANSWER, not about not having asked yet. The
 * gate waits on `ready` rather than on `!loading`, because a not-yet-fetched
 * status is indistinguishable from "no subscription" when you only look at
 * `status` — and treating the former as the latter is what used to throw a
 * paid-up user back into onboarding on every page refresh. See the long note
 * in SubscriptionContext for the exact ordering. `ready` also covers auth's
 * own loading state, so this gate no longer reads AuthContext directly.
 */
export function SubscribeGate({ children }) {
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

  if (!status?.isActive()) {
    return <Navigate to="/subscribe" replace state={{ from: location.pathname }} />;
  }

  return children;
}
