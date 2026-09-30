import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import accountHealthController from '../controller/accountHealth.js';
import {
  ACCOUNT_HEALTH_EVENTS,
  HEALTH_POLL_INTERVAL_MS,
  HEALTH_POLL_MAX_ATTEMPTS,
} from '../constants/constants.js';

/**
 * State and orchestration for the account-health card. No try/catch or
 * async/await here: the controller reports by event.
 *
 * `enabled` is false until a LinkedIn account is connected, so a signed-in
 * user with nothing linked makes no health request at all.
 *
 * The first read of a never-checked account comes back with `checking: true`
 * and no capabilities — the server has started a slow refresh in the
 * background. The hook re-reads every few seconds until they land, at most
 * HEALTH_POLL_MAX_ATTEMPTS times.
 */
export function useAccountHealth(enabled) {
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const [health, setHealth] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const pollTimer = useRef(null);
  const attempts = useRef(0);
  const toast = useToast();

  const load = useCallback(() => {
    accountHealthController.get(eventEmitter);
  }, [eventEmitter]);

  useEffect(() => {
    const onGetSuccess = (next) => {
      setHealth(next);
      setLoaded(true);

      clearTimeout(pollTimer.current);
      const waiting = next?.checking && !next?.capabilities;
      if (!waiting) {
        setGaveUp(false);
        return;
      }
      if (attempts.current >= HEALTH_POLL_MAX_ATTEMPTS) {
        setGaveUp(true);
        return;
      }
      attempts.current += 1;
      pollTimer.current = setTimeout(load, HEALTH_POLL_INTERVAL_MS);
    };
    const onGetFailure = () => {
      // The card is secondary to the connection itself: a failed read leaves
      // it in its empty state rather than toasting over the settings page.
      setLoaded(true);
    };
    eventEmitter.on(ACCOUNT_HEALTH_EVENTS.GET_SUCCESS, onGetSuccess);
    eventEmitter.on(ACCOUNT_HEALTH_EVENTS.GET_FAILURE, onGetFailure);
    return () => {
      clearTimeout(pollTimer.current);
      eventEmitter.off(ACCOUNT_HEALTH_EVENTS.GET_SUCCESS, onGetSuccess);
      eventEmitter.off(ACCOUNT_HEALTH_EVENTS.GET_FAILURE, onGetFailure);
    };
  }, [eventEmitter, load]);

  useEffect(() => {
    if (!enabled) return;
    attempts.current = 0;
    load();
  }, [enabled, load]);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);

    // Each outcome removes BOTH listeners, so the one that did not fire cannot
    // linger and answer a later refresh with a stale closure.
    const cleanup = () => {
      eventEmitter.off(ACCOUNT_HEALTH_EVENTS.REFRESH_SUCCESS, onSuccess);
      eventEmitter.off(ACCOUNT_HEALTH_EVENTS.REFRESH_FAILURE, onFailure);
    };
    function onSuccess(next) {
      cleanup();
      setHealth(next);
      setGaveUp(false);
      setRefreshing(false);
    }
    function onFailure(err) {
      cleanup();
      setRefreshing(false);
      // apiGateway rejects with the response BODY (not the axios error), so the
      // status is gone by now; the throttle is recognised by its retryAfterMs.
      const throttled =
        err?.response?.status === 429 || Number.isFinite(err?.data?.retryAfterMs);
      if (throttled) {
        toast.error('Checked a moment ago. Try again in a few seconds.');
        return;
      }
      toast.error(getToastError(err, 'Could not check your LinkedIn account'));
    }
    eventEmitter.on(ACCOUNT_HEALTH_EVENTS.REFRESH_SUCCESS, onSuccess);
    eventEmitter.on(ACCOUNT_HEALTH_EVENTS.REFRESH_FAILURE, onFailure);
    accountHealthController.refresh(eventEmitter);
  };

  // Derived, so a card that becomes enabled later starts in its loading state
  // without a setState inside an effect.
  const loading = Boolean(enabled) && !loaded;

  return { health, loading, refreshing, gaveUp, handleRefresh };
}
