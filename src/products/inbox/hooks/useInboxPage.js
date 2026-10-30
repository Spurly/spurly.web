import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import inboxController from '../controller/inbox.js';
import { POLL_MS, INBOX_EVENTS, LIVE_RELOAD_DEBOUNCE_MS } from '../constants/constants.js';

/**
 * 🔴 AN EMPTY INBOX HAS FOUR CAUSES AND THEY LOOK IDENTICAL.
 *
 * No LinkedIn connected; a sweep that has never been queued; a sweep still
 * running; and an account that genuinely has no conversations. The list can
 * distinguish none of them, and a blank screen with no explanation is read as
 * broken software — which is a support conversation that costs more than this
 * function.
 */
export function emptyStateFor(summary) {
  if (!summary || summary.connected === false) {
    return {
      title: 'LinkedIn is not connected',
      hint: summary?.accountStatus
        ? 'Your LinkedIn connection needs attention before conversations can sync.'
        : 'Connect your LinkedIn account and your conversations will appear here.',
      cta: { label: 'Go to settings', to: '/dashboard/settings/linkedin' },
    };
  }
  if (!summary.sync) {
    // No button: the worker queues a sweep for every connected account on its
    // own, so there is nothing for the reader to press.
    return {
      title: 'Nothing synced yet',
      hint: 'Your conversations are being set up. They start fetching on their own within a minute and will appear here.',
    };
  }
  if (summary.sync.status === 'failed') {
    return {
      title: 'The last sync did not finish',
      hint: summary.sync.error || 'Something went wrong fetching your conversations.',
      sync: true,
    };
  }
  // Queued and never run is a different state from "working": nothing has
  // started, and a minute or two of that is normal but ten is not. Saying so
  // beats a spinner that implies progress.
  if (summary.sync.waitingSince && Date.now() - new Date(summary.sync.waitingSince).getTime() > 90 * 1000) {
    return {
      title: 'Waiting for your sync to start',
      hint: 'Your conversations are queued and will start fetching shortly. You can leave this page — they will be here when it finishes.',
    };
  }
  if (summary.sync.status !== 'done') {
    return {
      title: 'Fetching your conversations',
      hint: 'The list fills in first, then each conversation’s history. This takes a few minutes the first time.',
    };
  }
  return {
    title: 'No conversations',
    hint: 'This LinkedIn account has no messages we can see.',
  };
}

/**
 * All state for the inbox list pane: the conversation list, its filters,
 * the summary that drives the empty state, and background polling. Moved
 * out of the page component unchanged. The open conversation id itself
 * stays read from the URL here too, since the list needs it to mark the
 * active row.
 */
export function useInboxPage() {
  const [params] = useSearchParams();
  const openId = params.get('chat');

  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const [summary, setSummary] = useState(null);
  const [head, setHead] = useState([]);
  const [listTotal, setListTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  // Pages after the first. Keyed on the filters they were fetched under, so a
  // new search or the Unread pill discards them without an effect to reset.
  const [more, setMore] = useState({ sig: '', rows: [], page: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  /** Set on every mount, not only cleared on unmount — see the same note in
   *  Thread.jsx. StrictMode's throwaway unmount otherwise discards every
   *  response for the life of the real mount. */
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Debounced so typing a name is one request at the end rather than one per
  // keystroke against a regex query.
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  /**
   * `loading` starts true and is only ever turned OFF in the PAGE_LOAD_*
   * handlers below. Setting it true synchronously from the mount effect
   * would be a cascading render, and the initial state already says
   * "loading" — so a filter change swaps rows in place instead of blanking
   * the list, which is what you want when the query is served from our own
   * database in milliseconds.
   */
  const sig = `${debouncedQuery}|${unreadOnly ? 1 : 0}`;
  const sigRef = useRef(sig);
  useEffect(() => { sigRef.current = sig; });
  const loadedPage = more.sig === sig ? more.page : 1;

  // Page 1 is re-polled and replaces the head; rows the reader has scrolled to
  // stay below it. A conversation that moved up into the head is dropped from
  // the tail by id.
  const chats = useMemo(() => {
    const tailRows = more.sig === sig ? more.rows : [];
    const ids = new Set(head.map((c) => c._id));
    return [...head, ...tailRows.filter((c) => !ids.has(c._id))];
  }, [head, more, sig]);
  const hasMore = head.length > 0 && chats.length < listTotal;

  const load = useCallback(() => {
    inboxController.loadInboxPage(eventEmitter, { q: debouncedQuery, unread: unreadOnly });
  }, [eventEmitter, debouncedQuery, unreadOnly]);

  // Every controller call reports back through this one subscription — no
  // .then()/.catch() and nothing awaited here.
  useEffect(() => {
    const onPageLoadSuccess = ({ chats: nextChats, pagination, summary: nextSummary }) => {
      if (!mountedRef.current) return;
      setHead(nextChats);
      setListTotal(pagination?.total ?? nextChats.length);
      setSummary(nextSummary);
      setLoading(false);
      setRefreshing(false);
    };
    const onPageLoadFailure = (err) => {
      if (!mountedRef.current) return;
      toast.error(getToastError(err, 'Could not load your inbox'));
      setLoading(false);
      setRefreshing(false);
    };
    const onMoreSuccess = ({ chats: rows, page, sig: forSig }) => {
      if (!mountedRef.current) return;
      setLoadingMore(false);
      // Requested under filters the reader has since changed — drop it.
      if (forSig !== sigRef.current) return;
      setMore((prev) => {
        const base = prev.sig === forSig ? prev.rows : [];
        const seen = new Set(base.map((c) => c._id));
        return { sig: forSig, rows: [...base, ...rows.filter((c) => !seen.has(c._id))], page };
      });
    };
    const onMoreFailure = (err) => {
      if (!mountedRef.current) return;
      setLoadingMore(false);
      toast.error(getToastError(err, 'Could not load more conversations'));
    };
    const onSyncSuccess = () => {
      toast.success('Sync started. Conversations appear as they are fetched.');
      load();
    };
    const onSyncFailure = (err) => {
      toast.error(getToastError(err, 'Could not start a sync'));
    };

    eventEmitter.on(INBOX_EVENTS.PAGE_LOAD_SUCCESS, onPageLoadSuccess);
    eventEmitter.on(INBOX_EVENTS.PAGE_LOAD_FAILURE, onPageLoadFailure);
    eventEmitter.on(INBOX_EVENTS.MORE_LOAD_SUCCESS, onMoreSuccess);
    eventEmitter.on(INBOX_EVENTS.MORE_LOAD_FAILURE, onMoreFailure);
    eventEmitter.on(INBOX_EVENTS.SYNC_SUCCESS, onSyncSuccess);
    eventEmitter.on(INBOX_EVENTS.SYNC_FAILURE, onSyncFailure);
    return () => {
      eventEmitter.off(INBOX_EVENTS.PAGE_LOAD_SUCCESS, onPageLoadSuccess);
      eventEmitter.off(INBOX_EVENTS.PAGE_LOAD_FAILURE, onPageLoadFailure);
      eventEmitter.off(INBOX_EVENTS.MORE_LOAD_SUCCESS, onMoreSuccess);
      eventEmitter.off(INBOX_EVENTS.MORE_LOAD_FAILURE, onMoreFailure);
      eventEmitter.off(INBOX_EVENTS.SYNC_SUCCESS, onSyncSuccess);
      eventEmitter.off(INBOX_EVENTS.SYNC_FAILURE, onSyncFailure);
    };
  }, [eventEmitter, toast, load]);

  useEffect(() => { load(); }, [load]);

  /**
   * Poll slowly, and always — a message can arrive at any time, and the live
   * feed is not proven yet, so this is the only thing that makes a new
   * conversation appear on its own.
   *
   * No abort signal on the tick, deliberately — see hub_phase4_web's note on
   * the leads-page "stale until reload" bug from a tick aborted by its own
   * teardown on the render that first had data.
   */
  useEffect(() => {
    const t = setInterval(() => load(), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  /**
   * Live: the server pushes "this conversation changed" the moment a message
   * arrives (controller#startLive), and the list reloads within a second. A
   * burst (a message, then its read receipt) is one reload. `load` is read
   * through a ref so a filter change does not drop and reopen the connection.
   * The poll above stays as the fallback for a dropped connection.
   */
  const [live, setLive] = useState(false);
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; });
  useEffect(() => {
    let timer = null;
    const onLive = () => {
      clearTimeout(timer);
      timer = setTimeout(() => loadRef.current(), LIVE_RELOAD_DEBOUNCE_MS);
    };
    const onLiveStatus = ({ connected }) => {
      if (mountedRef.current) setLive(connected);
    };
    eventEmitter.on(INBOX_EVENTS.LIVE_EVENT, onLive);
    eventEmitter.on(INBOX_EVENTS.LIVE_STATUS, onLiveStatus);
    inboxController.startLive(eventEmitter);
    return () => {
      clearTimeout(timer);
      eventEmitter.off(INBOX_EVENTS.LIVE_EVENT, onLive);
      eventEmitter.off(INBOX_EVENTS.LIVE_STATUS, onLiveStatus);
      inboxController.stopLive(eventEmitter);
    };
  }, [eventEmitter]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    inboxController.loadMoreChats(eventEmitter, { page: loadedPage + 1, q: debouncedQuery, unread: unreadOnly, sig });
  }, [loadingMore, hasMore, eventEmitter, loadedPage, debouncedQuery, unreadOnly, sig]);

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  const startSync = () => {
    inboxController.sync(eventEmitter);
  };

  const empty = useMemo(() => emptyStateFor(summary), [summary]);
  // Still catching up — the first sweep, a wider re-sweep, or history yet to
  // download. Said quietly above the list so the reader knows more is coming.
  const syncing = Boolean(summary?.sync)
    && summary.sync.status !== 'failed'
    && (summary.sync.phase !== 'done' || (summary.historyPending ?? 0) > 0);
  const nothingAtAll = !loading && chats.length === 0 && !debouncedQuery && !unreadOnly;

  return {
    openId,
    summary,
    chats,
    hasMore,
    loadingMore,
    loadMore,
    syncing,
    loading,
    refreshing,
    live,
    query,
    setQuery,
    unreadOnly,
    setUnreadOnly,
    debouncedQuery,
    load,
    refresh,
    startSync,
    empty,
    nothingAtAll,
    navigate,
  };
}
