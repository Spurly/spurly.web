import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast, useConfirm } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import accountController from '../controller/account.js';
import { POLL_INTERVAL_MS, POLL_TIMEOUT_MS, POLL_VENDOR_CHECK_EVERY, REDIRECT_MAX_ATTEMPTS } from '../constants.js';

/**
 * All state and orchestration for the LinkedIn settings page. Moved out of
 * the page component unchanged — every effect, poll, and the two
 * "ask the vendor directly" pulls (the post-redirect retry loop and the
 * CONNECTING poll) are the same as when they lived there; see the comments
 * on each for why they exist at all.
 */
export function useLinkedInSettings() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const toast = useToast();
  const confirm = useConfirm();
  const pollRef = useRef(null);

  /**
   * Fetch and apply, with every setState confined to a promise callback rather
   * than run straight down the effect body — which is what
   * react-hooks/set-state-in-effect is asking for, and it has a point: the
   * awaited version also had no way to stop, so leaving the page mid-request
   * set state on a component that was already gone.
   *
   * `signal` is optional because the click handlers call this too, and a
   * user-initiated reload has nothing to cancel against.
   */
  const load = useCallback((signal) => {
    const live = () => !signal?.aborted;
    return accountController.get()
      .then((next) => { if (live()) setAccount(next); })
      .catch((err) => {
        if (live()) toast.error(getToastError(err, 'Could not load your LinkedIn connection'));
      })
      .finally(() => { if (live()) setLoading(false); });
  }, [toast]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

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
     * `refresh` is the pull, and the server adopts an unbound account when it
     * can prove we asked for it. Retried twice because hosted auth returns the
     * user a moment before the account is listable; bounded because a third
     * silence is a real problem and should look like one.
     *
     * Deliberately NOT cancelled on cleanup, unlike the mount load above.
     * Stripping the param changes searchParams, which re-runs this effect — so
     * a cleanup that aborted would kill the very request it just started.
     */
    if (linked !== '1') {
      load();
      return undefined;
    }

    let attempts = 0;
    let timer = null;
    const pull = () => {
      attempts += 1;
      accountController.refresh()
        .then((next) => {
          setAccount(next);
          setLoading(false);
          if (!next?.connected && attempts < REDIRECT_MAX_ATTEMPTS) timer = setTimeout(pull, POLL_INTERVAL_MS);
        })
        .catch(() => load());
    };
    pull();

    return () => clearTimeout(timer);
  }, [searchParams, setSearchParams, toast, load]);

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
        accountController.refresh().then(setAccount).catch(() => load());
      } else {
        load();
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollRef.current);
  }, [account?.status, load]);

  const handleConnect = async () => {
    if (busy) return;

    /**
     * The tab is opened NOW, synchronously, and pointed at the URL once it
     * arrives. Opening it after the await would be a popup the browser blocks,
     * because by then the click is no longer what caused it.
     */
    const tab = window.open('', '_blank');
    setBusy(true);

    try {
      const { url } = await accountController.createLink();
      if (!url) throw new Error('No connection link was returned');

      if (tab) tab.location = url;
      else window.location.assign(url);
    } catch (err) {
      tab?.close();
      toast.error(getToastError(err, 'Could not start the LinkedIn connection'));
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = async () => {
    if (busy) return;
    setBusy(true);
    try {
      setAccount(await accountController.refresh());
    } catch (err) {
      toast.error(getToastError(err, 'Could not refresh the connection'));
    } finally {
      setBusy(false);
    }
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
    try {
      await accountController.disconnect();
      toast.success('LinkedIn disconnected');
      await load();
    } catch (err) {
      toast.error(getToastError(err, 'Could not disconnect'));
    } finally {
      setBusy(false);
    }
  };

  return { account, loading, busy, handleConnect, handleRefresh, handleDisconnect };
}
