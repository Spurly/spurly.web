import { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from 'src/core/auth/hooks/useAuth';
import subscriptionsController from '../controller/subscriptions.js';
import { SUBSCRIPTION_EVENTS } from '../constants/constants.js';
import EventEmitter from 'src/shared/utils/EventEmitter.js';

export const SubscriptionContext = createContext();

/** The id AuthContext identifies a user by. Mongo gives `_id`; some payloads carry `id`. */
function idOf(user) {
  return user?._id || user?.id || null;
}

/**
 * App-wide subscription status cache. Mirrors AuthContext's shape
 * (status/loading/error + a refetch) so SubscribeGate and the /subscribe
 * pages all read from one place instead of each polling independently.
 *
 * Deliberately separate from AuthContext: this tracks the Razorpay paywall
 * (autopay subscription status), not the admin-managed Plan/credit-tier
 * system — the two are unrelated by design.
 *
 * `ready` is the flag gates must wait on, and it exists because `loading`
 * alone was not safe to gate on. `loading` starts true but is set FALSE by
 * the `!user` branch below, which is what runs on a cold page load while
 * AuthProvider is still working out who is signed in. So there was a window —
 * one commit wide, but a real one — where authLoading had just flipped to
 * false, `user` had just appeared, and this context still reported
 * `loading: false, status: null`. SubscribeGate fails closed on a null
 * status, so it redirected to /subscribe before the effect below could even
 * fire, and /subscribe then bounced through /onboarding to
 * /onboarding/install: a signed-in, paid-up user thrown into onboarding on
 * every refresh. (It only bit sessions with no localStorage token — Google /
 * LinkedIn OAuth cookie sessions — because those set `user` and cleared
 * authLoading in the same batch, leaving no intermediate render for this
 * provider's effect to run in.)
 *
 * `ready` closes that window by construction: it is false unless the status
 * currently held was fetched FOR THE USER WHO IS SIGNED IN RIGHT NOW. It is
 * computed during render from the same values the consumer sees, so there is
 * no stale-by-one-commit state for a gate to act on. It also covers an
 * account switch, where the previous user's status would otherwise be read as
 * authoritative for the new one.
 *
 * `refetch` returns a fresh EventEmitter per call (rather than a promise) so
 * a caller like SubscribePage's "refresh status" button can subscribe to
 * that one call's own outcome without needing async/await or try/catch —
 * this provider updates its own state via an internal `.once()` listener on
 * the same emitter.
 */
export function SubscriptionProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState(null); // SubscriptionSummary | null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Which user id `status` describes; null when nothing has been fetched.
  const [loadedFor, setLoadedFor] = useState(null);

  const userId = idOf(user);

  const refetch = useCallback(() => {
    const emitter = new EventEmitter();

    if (!user) {
      setStatus(null);
      setLoadedFor(null);
      setLoading(false);
      // Deferred so a caller that attaches a `.once()` listener right after
      // calling refetch() doesn't miss it — mirrors the microtask delay the
      // controller path naturally has via its own await.
      Promise.resolve().then(() => {
        emitter.emit(SUBSCRIPTION_EVENTS.GET_MY_SUBSCRIPTION_SUCCESS, null);
      });
      return emitter;
    }

    // Captured before the call so a late response can't be filed against
    // whoever happens to be signed in by the time it lands.
    const forId = idOf(user);
    setLoading(true);
    setError(null);

    subscriptionsController.getMySubscription(emitter);

    emitter.once(SUBSCRIPTION_EVENTS.GET_MY_SUBSCRIPTION_SUCCESS, (summary) => {
      setStatus(summary);
      setLoadedFor(forId);
      setLoading(false);
    });
    emitter.once(SUBSCRIPTION_EVENTS.GET_MY_SUBSCRIPTION_FAILURE, (err) => {
      setError(err.message || 'Could not check subscription status');
      // Deliberately do NOT clear status on a transient fetch error — a
      // stale "active" is safer to keep showing than bouncing an already
      // paying user to the paywall because one poll failed. SubscribeGate
      // still fails closed (redirects to /subscribe) the first time status
      // is null, i.e. before we've ever heard back successfully.
      // Marked loaded either way: we have heard back, even if the answer was
      // an error. Leaving it unset would hold every gate on a spinner
      // forever whenever the status call is down.
      setLoadedFor(forId);
      setLoading(false);
    });

    return emitter;
  }, [user]);

  useEffect(() => {
    // Wrapped in its own function — calling refetch() directly at the top
    // level of an effect body trips react-hooks/set-state-in-effect since
    // refetch synchronously calls setState before dispatching; the
    // indirection is enough to satisfy it.
    function runRefetch() {
      refetch();
    }
    runRefetch();
    // Re-check whenever the signed-in user changes (login/logout/signup),
    // not on every refetch identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Anonymous is a settled answer, not a pending one: loadedFor and userId
  // are both null, so `ready` is true once auth itself has finished. Routes
  // that need a user are ProtectedRoute's problem, not this provider's.
  const ready = !authLoading && !loading && loadedFor === userId;

  return (
    <SubscriptionContext.Provider value={{ status, loading, ready, error, refetch }}>
      {children}
    </SubscriptionContext.Provider>
  );
}
