import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import profileController from '../controller/profile.js';
import {
  PROFILE_EVENTS,
  PROFILE_POLL_INTERVAL_MS,
  PROFILE_POLL_MAX_ATTEMPTS,
} from '../constants/constants.js';

const EMPTY_ICP = { roles: [], industries: [], locations: [], companySizes: [], notes: '' };

/** True when the user has put nothing in any field -- nothing worth saving. */
export function isIcpEmpty(icp) {
  return (
    !icp.roles.length && !icp.industries.length && !icp.locations.length &&
    !icp.companySizes.length && !icp.notes.trim()
  );
}

/**
 * State and orchestration for the onboarding "this is you" step. No try/catch
 * or async/await here: the controller reports by event.
 *
 * The first read of a just-connected account comes back with `checking: true`
 * and no snapshot -- the server is reading LinkedIn in the background. The hook
 * re-reads every few seconds until it lands, at most PROFILE_POLL_MAX_ATTEMPTS
 * times, then sets `gaveUp` so the page can offer Try again / Continue.
 *
 * `icp` is the user's editable draft. It is seeded ONCE, from whatever ICP is
 * already saved, so a later poll or refresh never overwrites what they typed.
 */
export function useProfileReview(enabled) {
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const [profile, setProfile] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [icp, setIcp] = useState(EMPTY_ICP);
  const seeded = useRef(false);
  const pollTimer = useRef(null);
  const attempts = useRef(0);
  const toast = useToast();

  const load = useCallback(() => {
    profileController.get(eventEmitter);
  }, [eventEmitter]);

  const seedDraft = useCallback((next) => {
    if (seeded.current || !next) return;
    seeded.current = true;
    setIcp({ ...EMPTY_ICP, ...next.icp });
  }, []);

  useEffect(() => {
    const onGetSuccess = (next) => {
      setProfile(next);
      setLoaded(true);
      setLoadFailed(false);
      seedDraft(next);

      clearTimeout(pollTimer.current);
      const waiting = Boolean(next?.connected) && !next?.snapshot && !next?.error;
      if (!waiting) {
        setGaveUp(false);
        return;
      }
      if (attempts.current >= PROFILE_POLL_MAX_ATTEMPTS) {
        setGaveUp(true);
        return;
      }
      attempts.current += 1;
      pollTimer.current = setTimeout(load, PROFILE_POLL_INTERVAL_MS);
    };
    const onGetFailure = () => {
      // The step is secondary to the connection itself: a failed read leaves
      // the page in its "couldn't read it" state with a way forward, rather
      // than a toast over an otherwise-working onboarding flow.
      setLoaded(true);
      setLoadFailed(true);
    };
    eventEmitter.on(PROFILE_EVENTS.GET_SUCCESS, onGetSuccess);
    eventEmitter.on(PROFILE_EVENTS.GET_FAILURE, onGetFailure);
    return () => {
      clearTimeout(pollTimer.current);
      eventEmitter.off(PROFILE_EVENTS.GET_SUCCESS, onGetSuccess);
      eventEmitter.off(PROFILE_EVENTS.GET_FAILURE, onGetFailure);
    };
  }, [eventEmitter, load, seedDraft]);

  useEffect(() => {
    if (!enabled) return;
    attempts.current = 0;
    load();
  }, [enabled, load]);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setGaveUp(false);
    setLoadFailed(false);

    // Each outcome removes BOTH listeners, so the one that did not fire cannot
    // linger and answer a later refresh with a stale closure.
    const cleanup = () => {
      eventEmitter.off(PROFILE_EVENTS.REFRESH_SUCCESS, onSuccess);
      eventEmitter.off(PROFILE_EVENTS.REFRESH_FAILURE, onFailure);
    };
    function onSuccess(next) {
      cleanup();
      setProfile(next);
      seedDraft(next);
      setRefreshing(false);
    }
    function onFailure(err) {
      cleanup();
      setRefreshing(false);
      setGaveUp(true);
      // apiGateway rejects with the response BODY, so the status is gone by
      // now; the throttle is recognised by its retryAfterMs.
      const throttled = Number.isFinite(err?.data?.retryAfterMs);
      toast.error(
        throttled
          ? 'Checked a moment ago. Try again in a few seconds.'
          : getToastError(err, 'Could not read your LinkedIn profile'),
      );
    }
    eventEmitter.on(PROFILE_EVENTS.REFRESH_SUCCESS, onSuccess);
    eventEmitter.on(PROFILE_EVENTS.REFRESH_FAILURE, onFailure);
    profileController.refresh(eventEmitter);
  };

  /** Edit one field of the draft. */
  const updateIcp = useCallback((field, value) => {
    setIcp((prev) => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Save the draft. An empty draft is not sent at all (nothing to keep), and
   * `onSaved` still runs so "continue" works the same either way.
   */
  const saveIcp = (onSaved) => {
    if (saving) return;
    if (isIcpEmpty(icp)) {
      onSaved();
      return;
    }
    setSaving(true);

    const cleanup = () => {
      eventEmitter.off(PROFILE_EVENTS.SAVE_ICP_SUCCESS, onSuccess);
      eventEmitter.off(PROFILE_EVENTS.SAVE_ICP_FAILURE, onFailure);
    };
    function onSuccess() {
      cleanup();
      setSaving(false);
      onSaved();
    }
    function onFailure(err) {
      cleanup();
      setSaving(false);
      toast.error(getToastError(err, 'Could not save who you want to reach'));
    }
    eventEmitter.on(PROFILE_EVENTS.SAVE_ICP_SUCCESS, onSuccess);
    eventEmitter.on(PROFILE_EVENTS.SAVE_ICP_FAILURE, onFailure);
    profileController.saveIcp(eventEmitter, icp);
  };

  // Derived, so a page that becomes enabled later starts in its loading state
  // without a setState inside an effect.
  const loading = Boolean(enabled) && !loaded;
  const waiting = !loading && !gaveUp && !refreshing && Boolean(profile?.connected) && !profile?.snapshot && !profile?.error;

  return { profile, loading, waiting, loadFailed, gaveUp, refreshing, saving, icp, updateIcp, saveIcp, handleRefresh };
}
