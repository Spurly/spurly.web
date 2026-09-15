import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import notificationsController from '../controller/notifications.js';
import { NOTIFICATION_EVENTS } from '../constants/constants.js';

/**
 * Polled, not pushed — same shape as the hub inbox (see hub_phase4_web) and
 * per the Phase 7 plan ("In-app delivery is polled ... not pushed"). 30s is
 * the inbox's own interval; a notification is even less time-sensitive than
 * a message, so there's no reason to poll faster.
 */
const POLL_MS = 30000;
const EMPTY = { items: [], unreadCount: 0 };

export function useNotifications({ limit = 30 } = {}) {
  const eventEmitter = useMemo(() => new EventEmitter(), []);
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

  // Every controller call reports back through this one subscription —
  // no .then()/.catch() and nothing awaited here, same as LinkedInSettings'
  // and the leads page's own state updates, just routed through the
  // eventEmitter instead of a promise chain.
  useEffect(() => {
    const onListSuccess = (next) => {
      if (!mountedRef.current) return;
      setState(next);
      setError(null);
      setLoading(false);
    };
    const onListFailure = (message) => {
      if (!mountedRef.current) return;
      // Non-fatal, same reasoning as useOutreachSummary: keep the last-known
      // feed on screen rather than blanking it over a transient failure.
      setError(message || 'Failed to load notifications');
      setLoading(false);
    };
    // Mark-read/mark-all-read are applied optimistically before the call is
    // even made (see markRead/markAllRead below); a failure is silently
    // reconciled by the next poll tick, so there is nothing to do here for
    // either event beyond letting them exist so a future caller has
    // somewhere to hook in without touching the controller.
    eventEmitter.on(NOTIFICATION_EVENTS.LIST_SUCCESS, onListSuccess);
    eventEmitter.on(NOTIFICATION_EVENTS.LIST_FAILURE, onListFailure);

    return () => {
      eventEmitter.off(NOTIFICATION_EVENTS.LIST_SUCCESS, onListSuccess);
      eventEmitter.off(NOTIFICATION_EVENTS.LIST_FAILURE, onListFailure);
    };
  }, [eventEmitter]);

  const load = useCallback(() => {
    notificationsController.list(eventEmitter, { limit });
  }, [eventEmitter, limit]);

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

  const markRead = useCallback((id) => {
    // Optimistic: the bell should clear the instant someone opens an item,
    // not after a round trip. A failure is reconciled by the next poll.
    setState((prev) => ({
      items: prev.items.map((n) => (n._id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)),
      unreadCount: Math.max(0, prev.unreadCount - (prev.items.find((n) => n._id === id && !n.readAt) ? 1 : 0)),
    }));
    notificationsController.markRead(eventEmitter, id);
  }, [eventEmitter]);

  const markAllRead = useCallback(() => {
    setState((prev) => ({
      items: prev.items.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })),
      unreadCount: 0,
    }));
    notificationsController.markAllRead(eventEmitter);
  }, [eventEmitter]);

  return { items: state.items, unreadCount: state.unreadCount, loading, error, refresh: load, markRead, markAllRead };
}
