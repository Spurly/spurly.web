import { useState, useEffect, useCallback, useRef } from 'react';
import notificationsController from 'src/platform/notifications/controller.js';

/**
 * Polled, not pushed — same shape as the hub inbox (see hub_phase4_web) and
 * per the Phase 7 plan ("In-app delivery is polled ... not pushed"). 30s is
 * the inbox's own interval; a notification is even less time-sensitive than
 * a message, so there's no reason to poll faster.
 */
const POLL_MS = 30000;
const EMPTY = { items: [], unreadCount: 0 };

export function useNotifications({ limit = 30 } = {}) {
  const [state, setState] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Every setState confined to a .then()/.catch()/.finally() callback rather
   * than an awaited statement in the function body — same fix as
   * LinkedInSettingsPage's load(), for the same react-hooks/set-state-in-effect
   * warning: calling load() from the effect below must not itself synchronously
   * touch state.
   */
  const load = useCallback(() => {
    return notificationsController
      .list({ limit })
      .then((next) => {
        if (!mountedRef.current) return;
        setState(next);
        setError(null);
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        // Non-fatal, same reasoning as useOutreachSummary: keep the last-known
        // feed on screen rather than blanking it over a transient failure.
        setError(err.message || 'Failed to load notifications');
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
  }, [limit]);

  useEffect(() => {
    load();
  }, [load]);

  // No abort signal on the tick, deliberately — see hub_phase4_web's note on
  // the leads-page "stale until reload" bug from a tick aborted by its own
  // teardown on the render that first had data.
  useEffect(() => {
    const t = setInterval(() => load(), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const markRead = useCallback(async (id) => {
    // Optimistic: the bell should clear the instant someone opens an item,
    // not after a round trip. A failed request is reconciled by the next poll.
    setState((prev) => ({
      items: prev.items.map((n) => (n._id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)),
      unreadCount: Math.max(0, prev.unreadCount - (prev.items.find((n) => n._id === id && !n.readAt) ? 1 : 0)),
    }));
    try {
      await notificationsController.markRead(id);
    } catch {
      // Reconciled by the next poll tick — no toast, this is not worth
      // interrupting anyone for.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setState((prev) => ({
      items: prev.items.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })),
      unreadCount: 0,
    }));
    try {
      await notificationsController.markAllRead();
    } catch {
      // Reconciled by the next poll tick.
    }
  }, []);

  return { items: state.items, unreadCount: state.unreadCount, loading, error, refresh: load, markRead, markAllRead };
}
