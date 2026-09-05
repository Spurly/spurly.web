import { useState, useEffect, useCallback, useRef } from 'react';
import {
  startConnectionsSync,
  getConnectionsSyncState,
  onExtensionEvent,
  SYNC_EVENTS,
  isExtensionPresent,
} from 'src/shared/extension/extensionBridge.js';

/** How often to re-ask the extension whether the sweep has finished. */
const POLL_MS = 2000;

/**
 * Manual "Sync now" for the Connections tab.
 *
 * The web app can't read LinkedIn — only the extension can — so this asks the
 * extension to run the sweep it normally runs once a day. It exists because the
 * daily run can simply not have happened: the browser was closed, a campaign
 * was mid-send, or LinkedIn returned a checkpoint.
 *
 * The run is fire-and-forget by necessity (a full sweep takes minutes, longer
 * than any request timeout), so the outcome arrives one of two ways:
 *
 *   1. a completion EVENT pushed from the extension — fast, but delivered to a
 *      content script, which is the flakiest hop in the system; and
 *   2. POLLING the extension for state + last result — slower, but it cannot
 *      be missed.
 *
 * Both are wired up. This button's whole purpose is to work when something else
 * didn't, so it must not depend on a push arriving to stop spinning.
 *
 * @param {Object} [opts]
 * @param {Function} [opts.onComplete] Called after a successful sweep — the
 *   caller refreshes its table, since degrees and the roster may have changed.
 */
export function useConnectionsSync({ onComplete } = {}) {
  const [running, setRunning] = useState(false);
  // { ok, newConnections?, degreesUpdated?, error? }
  //
  // Both counts are carried, because they answer different questions and only
  // one of them used to arrive. `newConnections` is anyone new in the roster;
  // `degreesUpdated` is the subset who got there by accepting a Spurly invite.
  const [result, setResult] = useState(null);
  const [installed, setInstalled] = useState(true);

  // Held in refs so the effects below never re-subscribe or restart their timer
  // just because the caller passed a new inline closure.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  /*
   * True from the moment Sync now is pressed until the extension has answered
   * that the sweep began.
   *
   * The poll below treats "worker idle, no new result" as a failed run, and it
   * starts ticking the instant `running` goes true. Starting is not always
   * instant: waking a sleeping service worker, and — when the extension turns
   * out to be signed out — handing it this page's session and asking again,
   * can outlast a 2s tick. Without this the button reports "Sync stopped
   * unexpectedly" and stops spinning, seconds before the sweep it is describing
   * actually starts and runs for minutes.
   */
  const startingRef = useRef(false);

  // Timestamp of the newest result we've already shown. Anything older than
  // this belongs to a previous run and must not be rendered as fresh.
  const seenAtRef = useRef(0);

  const applyResult = useCallback((payload) => {
    if (!payload) return false;
    const at = payload.completedAt || 0;
    if (at && at <= seenAtRef.current) return false; // already shown
    seenAtRef.current = at || Date.now();

    setRunning(false);
    setResult(
      payload.success
        ? {
            ok: true,
            newConnections: payload.newConnections ?? 0,
            degreesUpdated: payload.degreesUpdated ?? 0,
          }
        : { ok: false, error: payload.error || 'Sync failed' },
    );
    if (payload.success) onCompleteRef.current?.();
    return true;
  }, []);

  // On mount: a sweep started before this page loaded (or before a navigation)
  // is still going in the worker — reflect that rather than showing an idle
  // button. Any past result is treated as already seen, so a week-old outcome
  // doesn't pop up on arrival.
  useEffect(() => {
    let cancelled = false;
    setInstalled(isExtensionPresent());
    getConnectionsSyncState().then((state) => {
      if (cancelled || !state) return;
      if (state.lastResult?.completedAt) {
        seenAtRef.current = state.lastResult.completedAt;
      }
      if (state.running) setRunning(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fast path: the pushed completion event.
  useEffect(() => {
    return onExtensionEvent((event) => {
      if (event?.action !== SYNC_EVENTS.COMPLETE) return;
      applyResult(event.payload);
    });
  }, [applyResult]);

  // Reliable path: poll while a sweep is in flight.
  useEffect(() => {
    if (!running) return undefined;

    let cancelled = false;
    const timer = setInterval(async () => {
      const state = await getConnectionsSyncState();
      if (cancelled || !state) return;

      if (state.lastResult && applyResult(state.lastResult)) return;

      // Worker says idle but produced no newer result — it was torn down, or
      // the run never really started. Stop spinning and say so. Not while the
      // start is still in flight, though: "not started yet" is not "stopped".
      if (!state.running && !startingRef.current) {
        setRunning(false);
        setResult((prev) =>
          prev || { ok: false, error: 'Sync stopped unexpectedly — try again' },
        );
      }
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [running, applyResult]);

  const sync = useCallback(async () => {
    if (running) return;
    setResult(null);

    if (!isExtensionPresent()) {
      setInstalled(false);
      setResult({ ok: false, error: 'Spurly extension not detected in this browser' });
      return;
    }

    setRunning(true);
    startingRef.current = true;

    let res;
    try {
      res = await startConnectionsSync();
    } finally {
      startingRef.current = false;
    }

    // `alreadyRunning` counts as started: a sweep IS in progress and the poll
    // above will pick up its result. Anything else means it never began, so the
    // button must not sit spinning forever.
    if (!res.started && !res.alreadyRunning) {
      setRunning(false);
      setResult({ ok: false, error: res.error || 'Could not start the sync' });
    }
  }, [running]);

  const dismissResult = useCallback(() => setResult(null), []);

  return { sync, running, result, installed, dismissResult };
}
