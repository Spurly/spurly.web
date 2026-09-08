import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Inbox, RefreshCw, Search, Loader2 } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { Avatar, Button, EmptyState, Input, useToast } from 'src/ui/primitives';
import { relativeTime } from 'src/shared/utils/outreach';
import { getToastError } from 'src/shared/utils/apiError';
import { hubInboxApi } from './api.js';
import { Thread } from './Thread.jsx';

/**
 * Hub inbox — conversations on the left, the open one on the right.
 *
 * A mail-client shape rather than a table with a detail route, because the
 * thing people do here is read one conversation, answer it, and move to the
 * next. A round trip back to a list between every reply is the whole cost of
 * the alternative.
 *
 * The open conversation lives in the URL (`?chat=`), so a thread is linkable
 * and the back button does what it looks like it does.
 */

const POLL_MS = 30000;

/**
 * 🔴 AN EMPTY INBOX HAS FOUR CAUSES AND THEY LOOK IDENTICAL.
 *
 * No LinkedIn connected; a sweep that has never been queued; a sweep still
 * running; and an account that genuinely has no conversations. The list can
 * distinguish none of them, and a blank screen with no explanation is read as
 * broken software — which is a support conversation that costs more than this
 * function.
 */
function emptyStateFor(summary) {
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
 * A row is a LINK, not a button.
 *
 * Opening a conversation changes the URL, so the element that does it should be
 * an anchor: cmd-click opens a thread in a new tab, the browser shows where it
 * goes, and screen readers announce it as navigation. `replace` keeps ten
 * conversations from becoming ten entries in the back stack.
 */
function ChatRow({ chat, active }) {
  const unread = (chat.unreadCount ?? 0) > 0;

  return (
    <Link
      to={`/hub/inbox?chat=${chat._id}`}
      replace
      aria-current={active ? 'true' : undefined}
      className={[
        'w-full text-left flex gap-2.5 px-3 py-2.5 border-b border-[var(--ui-border-hairline)] transition-colors',
        active ? 'bg-[var(--ui-surface-sunken)]' : 'hover:bg-[var(--ui-surface-rail-hover)]',
      ].join(' ')}
    >
      <Avatar src={chat.display?.pictureUrl || null} name={chat.display?.name || ''} size={26} />

      <span className="flex-1 min-w-0">
        <span className="flex items-baseline gap-2">
          <span className={`flex-1 min-w-0 truncate text-[13px] ${unread ? 'text-[var(--ui-text-primary)]' : 'text-[var(--ui-text-primary)]'}`}>
            {chat.display?.name || 'Unnamed conversation'}
          </span>
          <span className="shrink-0 text-[11px] text-[var(--ui-text-tertiary)] tabular-nums">
            {relativeTime(chat.lastMessageAt)}
          </span>
        </span>

        <span className="flex items-center gap-2 mt-0.5">
          <span className="flex-1 min-w-0 truncate text-[12px] text-[var(--ui-text-secondary)]">
            {/* "you:" is the only thing that tells a glance whether the ball is
                in their court or ours — the single most useful bit in a row. */}
            {chat.lastMessageIsSender && <span className="text-[var(--ui-text-tertiary)]">you: </span>}
            {chat.lastMessageText || (chat.backfilledAt === null ? 'Fetching history…' : 'No messages')}
          </span>
          {unread && (
            <span
              className="shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--ui-accent)]"
              aria-label={`${chat.unreadCount} unread`}
            />
          )}
        </span>
      </span>
    </Link>
  );
}

export function HubInboxPage() {
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
      hubInboxApi.listChats({ q: debouncedQuery, unread: unreadOnly }),
      hubInboxApi.getSummary(),
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
      await hubInboxApi.sync();
      toast.success('Sync started. Conversations appear as they are fetched.');
      await load();
    } catch (err) {
      toast.error(getToastError(err, 'Could not start a sync'));
    }
  };

  const empty = useMemo(() => emptyStateFor(summary), [summary]);
  const nothingAtAll = !loading && chats.length === 0 && !debouncedQuery && !unreadOnly;

  const subtitle = summary
    ? `${summary.chats.toLocaleString()} conversation${summary.chats === 1 ? '' : 's'}${summary.unread ? ` · ${summary.unread} unread` : ''}`
    : '';

  return (
    <DashboardLayout
      title="Inbox"
      subtitle={subtitle}
      actions={
        <Button size="sm" variant="ghost" onClick={refresh} disabled={refreshing} title="Check for new messages">
          {refreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        </Button>
      }
    >
      {nothingAtAll ? (
        <EmptyState
          icon={<Inbox size={20} />}
          title={empty.title}
          hint={empty.hint}
          action={
            empty.cta ? <Button onClick={() => navigate(empty.cta.to)}>{empty.cta.label}</Button>
              : empty.sync ? <Button onClick={startSync}>Sync now</Button>
                : null
          }
        />
      ) : (
        <div className="flex h-full min-h-0">
          <aside className="w-[320px] shrink-0 flex flex-col min-h-0 border-r border-[var(--ui-border)]">
            <div
              className="flex items-center gap-2 shrink-0 border-b border-[var(--ui-border-hairline)] px-3"
              style={{ height: 'var(--ui-band)' }}
            >
              <Search size={13} className="text-[var(--ui-text-tertiary)] shrink-0" aria-hidden="true" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search conversations"
                className="flex-1"
              />
              <Button
                size="sm"
                variant={unreadOnly ? 'secondary' : 'ghost'}
                onClick={() => setUnreadOnly((v) => !v)}
                title="Show only conversations with unread messages"
                aria-pressed={unreadOnly}
              >
                Unread
              </Button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              {loading ? (
                <p className="px-3 py-6 text-[13px] text-[var(--ui-text-tertiary)]">Loading…</p>
              ) : chats.length === 0 ? (
                // A filtered empty is a different sentence from an empty inbox,
                // and offering "Sync now" here would be answering the wrong
                // question.
                <p className="px-3 py-6 text-[13px] text-[var(--ui-text-tertiary)]">
                  {unreadOnly && !debouncedQuery ? 'Nothing unread.' : 'No conversations match that.'}
                </p>
              ) : (
                chats.map((chat) => (
                  <ChatRow key={chat._id} chat={chat} active={chat._id === openId} />
                ))
              )}
            </div>
          </aside>

          <section className="flex-1 min-w-0 min-h-0">
            {/* Keyed on the id so switching conversations REMOUNTS rather than
                reconciling — the draft, the scroll position and the loading
                state all belong to one thread and none of them should survive
                into the next. */}
            <Thread key={openId || 'none'} chatId={openId} onChanged={() => load()} />
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

export default HubInboxPage;
