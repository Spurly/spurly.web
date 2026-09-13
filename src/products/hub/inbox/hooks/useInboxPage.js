import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import inboxController from '../controller/inbox.js';
import { POLL_MS } from '../constants.js';

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
   * `loading` starts true and is only ever turned OFF here, in an async
   * callback. Setting it true synchronously from the mount effect would be a
   * cascading render, and the initial state already says "loading" — so a
   * filter change swaps rows in place instead of blanking the list, which is
   * what you want when the query is served from our own database in
   * milliseconds.
   */
  const load = useCallback(() => {
    return Promise.all([
      inboxController.listChats({ q: debouncedQuery, unread: unreadOnly }),
      inboxController.getSummary(),
    ])
      .then(([list, next]) => {
        if (!mountedRef.current) return;
        setChats(list.chats ?? []);
        setSummary(next);
      })
      .catch((err) => { if (mountedRef.current) toast.error(getToastError(err, 'Could not load your inbox')); })
      .finally(() => { if (mountedRef.current) setLoading(false); });
  }, [debouncedQuery, unreadOnly, toast]);

  useEffect(() => { load(); }, [load]);

  /**
   * Poll slowly, and always — a message can arrive at any time, and the live
   * feed is not proven yet, so this is the only thing that makes a new
   * conversation appear on its own.
   *
   * The tick carries NO abort signal, deliberately. The leads page's
   * "stale until reload" bug came from a tick aborted by its own teardown, on
   * exactly the render that first had data.
   */
  useEffect(() => {
    const t = setInterval(() => load(), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  };

  const startSync = async () => {
    try {
      await inboxController.sync();
      toast.success('Sync started. Conversations appear as they are fetched.');
      await load();
    } catch (err) {
      toast.error(getToastError(err, 'Could not start a sync'));
    }
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
