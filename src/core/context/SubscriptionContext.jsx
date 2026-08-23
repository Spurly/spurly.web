import { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from 'src/hooks/useAuth';
import subscriptionsController from 'src/core/controllers/subscriptionsController.js';

export const SubscriptionContext = createContext();

/**
 * App-wide subscription status cache. Mirrors AuthContext's shape
 * (status/loading/error + a refetch) so SubscribeGate and the /subscribe
 * pages all read from one place instead of each polling independently.
 *
 * Deliberately separate from AuthContext: this tracks the Cashfree paywall
 * (autopay mandate status), not the admin-managed Plan/credit-tier system —
 * the two are unrelated by design.
 */
export function SubscriptionProvider({ children }) {
  const { user } = useAuth();
  const [status, setStatus] = useState(null); // SubscriptionSummary | null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const summary = await subscriptionsController.getMySubscription();
      setStatus(summary);
      return summary;
    } catch (err) {
      setError(err.message || 'Could not check subscription status');
      // Deliberately do NOT clear status on a transient fetch error — a
      // stale "active" is safer to keep showing than bouncing an already
      // paying user to the paywall because one poll failed. SubscribeGate
      // still fails closed (redirects to /subscribe) the first time status
      // is null, i.e. before we've ever heard back successfully.
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refetch();
    // Re-check whenever the signed-in user changes (login/logout/signup),
    // not on every refetch identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  return (
    <SubscriptionContext.Provider value={{ status, loading, error, refetch }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
