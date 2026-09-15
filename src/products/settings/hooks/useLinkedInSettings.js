import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast, useConfirm } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import accountController from '../controller/account.js';
import {
  ACCOUNT_EVENTS,
  POLL_INTERVAL_MS,
  POLL_TIMEOUT_MS,
  POLL_VENDOR_CHECK_EVERY,
  REDIRECT_MAX_ATTEMPTS,
} from '../constants/constants.js';

/**
 * All state and orchestration for the LinkedIn settings page. Moved out of
 * the page component unchanged — every effect, poll, and the two
 * "ask the vendor directly" pulls (the post-redirect retry loop and the
 * CONNECTING poll) are the same as when they lived there; see the comments
 * on each for why they exist at all.
 *
 * try/catch and async/await live in the controller+gateway only. The one
 * exception in this file is `handleDisconnect`'s `await confirm(...)` —
 * that awaits a UI dialog promise, not a network call, so it carries no
 * try/catch and nothing about its result reaches the controller as
 * anything other than a plain boolean.
 */
export function useLinkedInSettings() {
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const toast = useToast();
  const confirm = useConfirm();
  const pollRef = useRef(null);

  /**
   * Fires the GET call; the outcome always lands in the same place (the
   * subscription effect right below), which is what lets every caller below
   * just call `load()` and move on rather than each handling its own
   * success/failure.
   */
  const load = useCallback(() => {
    accountController.get(eventEmitter);
  }, [eventEmitter]);

  useEffect(() => {
    const onGetSuccess = (next) => {
      setAccount(next);
      setLoading(false);
    };
    const onGetFailure = (err) => {
      toast.error(getToastError(err, 'Could not load your LinkedIn connection'));
      setLoading(false);
    };
    eventEmitter.on(ACCOUNT_EVENTS.GET_SUCCESS, onGetSuccess);
    eventEmitter.on(ACCOUNT_EVENTS.GET_FAILURE, onGetFailure);
    return () => {
      eventEmitter.off(ACCOUNT_EVENTS.GET_SUCCESS, onGetSuccess);
      eventEmitter.off(ACCOUNT_EVENTS.GET_FAILURE, onGetFailure);
    };
  }, [eventEmitter, toast]);

  useEffect(() => { load(); }, [load]);

  /**
   * The hosted flow redirects back here with ?linked=1 or ?linked=0. Read it
   * once, then strip it — otherwise a refresh replays the toast, and a shared
   * or bookmarked URL claims a success that never happened.
   */
  useEffect(() => {
    const linked = searchParams.get('linked');
    if (linked === null) return undefined;

    if (linked === '1') toast.success('LinkedIn connected');
    else toast.error('LinkedIn was not connected');

    setSearchParams({}, { replace: true });

    if (linked !== '1') {
      load();
      return undefined;
    }

    /**
     * 🔴 ASK THE VENDOR, don't just re-read our own row.
     *
     * We have just come back from hosted auth, so an account may exist at the
     * vendor that our database has never heard of — the binding callback goes
     * to BACKEND_PUBLIC_URL, and on a developer machine the vendor cannot
     * reach that at all, so it NEVER arrives. Reading our own row here is how
     * the page ended up saying "Not connected" over an account the vendor
     * showed as Running, for ever, every single time.
     *
     * Retried twice because hosted auth returns the user a moment before the
     * account is listable; bounded because a third silence is a real problem
     * and should look like one.
     */
    let attempts = 0;
    let timer = null;
    let cancelled = false;

    const onPullSuccess = (next) => {
      if (cancelled) return;
      setAccount(next);
      setLoading(false);
      if (!next?.connected && attempts < REDIRECT_MAX_ATTEMPTS) {
        timer = setTimeout(pull, POLL_INTERVAL_MS);
      }
    };
    const onPullFailure = () => {
      if (cancelled) return;
      load();
    };
    function pull() {
      attempts += 1;
      eventEmitter.once(ACCOUNT_EVENTS.REFRESH_SUCCESS, onPullSuccess);
      eventEmitter.once(ACCOUNT_EVENTS.REFRESH_FAILURE, onPullFailure);
      accountController.refresh(eventEmitter);
    }
    pull();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      eventEmitter.off(ACCOUNT_EVENTS.REFRESH_SUCCESS, onPullSuccess);
      eventEmitter.off(ACCOUNT_EVENTS.REFRESH_FAILURE, onPullFailure);
    };
  }, [searchParams, setSearchParams, toast, load, eventEmitter]);

  /**
   * While CONNECTING, poll — and every third tick ask the vendor directly
   * rather than reading our own database.
   *
   * Our database only advances when the vendor's webhook arrives. In
   * production that is near-instant; on a developer machine there is usually no
   * webhook reaching localhost at all, so a poll that only re-read our own
   * status would sit on "Setting up" forever and look broken. Asking the vendor
   * every 15s costs one request and makes the page correct in both places — and
   * in production it doubles as a safety net for a webhook that never lands.
   *
   * Capped rather than indefinite: if it has not settled in two minutes,
   * something is actually wrong and quietly retrying forever hides that.
   */
  useEffect(() => {
    clearInterval(pollRef.current);
    if (account?.status !== 'CONNECTING') return undefined;

    let elapsed = 0;
    let ticks = 0;

    pollRef.current = setInterval(() => {
      elapsed += POLL_INTERVAL_MS;
      ticks += 1;

      if (elapsed >= POLL_TIMEOUT_MS) {
        clearInterval(pollRef.current);
        return;
      }
      // Cheap read most ticks; ask the vendor every third one.
      if (ticks % POLL_VENDOR_CHECK_EVERY === 0) {
        eventEmitter.once(ACCOUNT_EVENTS.REFRESH_SUCCESS, setAccount);
        eventEmitter.once(ACCOUNT_EVENTS.REFRESH_FAILURE, load);
        accountController.refresh(eventEmitter);
      } else {
        load();
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollRef.current);
  }, [account?.status, load, eventEmitter]);

  const handleConnect = () => {
    if (busy) return;

    /**
     * The tab is opened NOW, synchronously, and pointed at the URL once it
     * arrives. Opening it after the response would be a popup the browser
     * blocks, because by then the click is no longer what caused it.
     */
    const tab = window.open('', '_blank');
    setBusy(true);

    eventEmitter.once(ACCOUNT_EVENTS.CREATE_LINK_SUCCESS, (data) => {
      setBusy(false);
      const url = data?.url;
      if (!url) {
        tab?.close();
        toast.error('No connection link was returned');
        return;
      }
      if (tab) tab.location = url;
      else window.location.assign(url);
    });
    eventEmitter.once(ACCOUNT_EVENTS.CREATE_LINK_FAILURE, (err) => {
      setBusy(false);
      tab?.close();
      toast.error(getToastError(err, 'Could not start the LinkedIn connection'));
    });
    accountController.createLink(eventEmitter);
  };

  const handleRefresh = () => {
    if (busy) return;
    setBusy(true);
    eventEmitter.once(ACCOUNT_EVENTS.REFRESH_SUCCESS, (next) => {
      setAccount(next);
      setBusy(false);
    });
    eventEmitter.once(ACCOUNT_EVENTS.REFRESH_FAILURE, (err) => {
      setBusy(false);
      toast.error(getToastError(err, 'Could not refresh the connection'));
    });
    accountController.refresh(eventEmitter);
  };

  const handleDisconnect = async () => {
    const ok = await confirm({
      title: 'Disconnect LinkedIn?',
      // Say what survives, not just what stops. The fear is losing work.
      message:
        'Spurly will stop sending on your behalf and any running campaigns will pause. '
        + 'Your leads, campaigns and history are kept, and you can reconnect at any time.',
      confirmLabel: 'Disconnect',
      destructive: true,
    });
    if (!ok) return;

    setBusy(true);
    eventEmitter.once(ACCOUNT_EVENTS.DISCONNECT_SUCCESS, () => {
      toast.success('LinkedIn disconnected');
      setBusy(false);
      load();
    });
    eventEmitter.once(ACCOUNT_EVENTS.DISCONNECT_FAILURE, (err) => {
      setBusy(false);
      toast.error(getToastError(err, 'Could not disconnect'));
    });
    accountController.disconnect(eventEmitter);
  };

  return { account, loading, busy, handleConnect, handleRefresh, handleDisconnect };
}
