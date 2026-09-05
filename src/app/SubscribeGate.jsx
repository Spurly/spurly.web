import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from 'src/platform/auth/useAuth';
import { useSubscription } from 'src/platform/billing/useSubscription';

/**
 * Wraps ProtectedRoute content that additionally requires an ACTIVE
 * subscription — onboarding, the extension-install step, and everything
 * under /dashboard. Nests inside ProtectedRoute (auth first, then billing):
 *   <ProtectedRoute><SubscribeGate><Page /></SubscribeGate></ProtectedRoute>
 *
 * Fails closed: anything other than status === 'active' (including 'none',
 * 'pending_authorization', 'past_due', 'cancelled', and the not-yet-loaded
 * null state) redirects to /subscribe. /subscribe itself renders different
 * copy depending on which of those it is (see SubscribePage).
 */
export function SubscribeGate({ children }) {
  const { loading: authLoading } = useAuth();
  const { status, loading: subLoading } = useSubscription();
  const location = useLocation();

  if (authLoading || subLoading) {
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
