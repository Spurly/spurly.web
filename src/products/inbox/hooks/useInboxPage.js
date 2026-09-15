import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import inboxController from '../controller/inbox.js';
import { POLL_MS, INBOX_EVENTS } from '../constants/constants.js';

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
    return {
      title: 'Nothing synced yet',
      hint: 'Your conversations have not been fetched yet. This starts on its own within a minute, or you can start it now.',
      sync: true,
    };
  }
  if (summary.sync.status === 'failed') {
    return {
      title: 'The last sync did not finish',
      hint: summary.sync.error || 'Something went wrong fetching your conversations.',
      sync: true,
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
  const [chats, setChats] = useState([]);
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
  const load = useCallback(() => {
    inboxController.loadInboxPage(eventEmitter, { q: debouncedQuery, unread: unreadOnly });
  }, [eventEmitter, debouncedQuery, unreadOnly]);

  // Every controller call reports back through this one subscription — no
  // .then()/.catch() and nothing awaited here.
  useEffect(() => {
    const onPageLoadSuccess = ({ chats: nextChats, summary: nextSummary }) => {
      if (!mountedRef.current) return;
      setChats(nextChats);
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
    const onSyncSuccess = () => {
      toast.success('Sync started. Conversations appear as they are fetched.');
      load();
    };
    const onSyncFailure = (err) => {
      toast.error(getToastError(err, 'Could not start a sync'));
    };

    eventEmitter.on(INBOX_EVENTS.PAGE_LOAD_SUCCESS, onPageLoadSuccess);
    eventEmitter.on(INBOX_EVENTS.PAGE_LOAD_FAILURE, onPageLoadFailure);
    eventEmitter.on(INBOX_EVENTS.SYNC_SUCCESS, onSyncSuccess);
    eventEmitter.on(INBOX_EVENTS.SYNC_FAILURE, onSyncFailure);
    return () => {
      eventEmitter.off(INBOX_EVENTS.PAGE_LOAD_SUCCESS, onPageLoadSuccess);
      eventEmitter.off(INBOX_EVENTS.PAGE_LOAD_FAILURE, onPageLoadFailure);
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

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  const startSync = () => {
    inboxController.sync(eventEmitter);
  };

  const empty = useMemo(() => emptyStateFor(summary), [summary]);
  const nothingAtAll = !loading && chats.length === 0 && !debouncedQuery && !unreadOnly;

  return {
    openId,
    summary,
    chats,
    loading,
    refreshing,
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
