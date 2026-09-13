import { Link } from 'react-router-dom';
import { Inbox, RefreshCw, Search, Loader2 } from 'lucide-react';
import { DashboardLayout } from 'src/platform/layout/DashboardLayout';
import { Avatar, Button, EmptyState, Input } from 'src/ui/primitives';
import { relativeTime } from 'src/shared/utils/outreach';
import { useInboxPage } from 'src/products/hub/inbox/hooks/useInboxPage.js';
import { Thread } from './components/Thread.jsx';
import { inboxStrings as t } from './strings.js';

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
          <span className={`flex-1 min-w-0 truncate text-[var(--ui-t-body)] ${unread ? 'text-[var(--ui-text-primary)]' : 'text-[var(--ui-text-primary)]'}`}>
            {chat.display?.name || 'Unnamed conversation'}
          </span>
          <span className="shrink-0 text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)] tabular-nums">
            {relativeTime(chat.lastMessageAt)}
          </span>
        </span>

        <span className="flex items-center gap-2 mt-0.5">
          <span className="flex-1 min-w-0 truncate text-[var(--ui-t-label)] text-[var(--ui-text-secondary)]">
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
  const {
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
  } = useInboxPage();

  const subtitle = summary
    ? `${summary.chats.toLocaleString()} conversation${summary.chats === 1 ? '' : 's'}${summary.unread ? ` · ${summary.unread} unread` : ''}`
    : '';

  return (
    <DashboardLayout
      title={t.pageTitle}
      subtitle={subtitle}
      actions={
        <Button size="sm" variant="ghost" onClick={refresh} disabled={refreshing} title={t.refreshTitle}>
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
              : empty.sync ? <Button onClick={startSync}>{t.syncNow}</Button>
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
                placeholder={t.search.placeholder}
                aria-label={t.search.ariaLabel}
                className="flex-1"
              />
              <Button
                size="sm"
                variant={unreadOnly ? 'secondary' : 'ghost'}
                onClick={() => setUnreadOnly((v) => !v)}
                title={t.search.unreadTitle}
                aria-pressed={unreadOnly}
              >
                {t.search.unread}
              </Button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              {loading ? (
                <p className="px-3 py-6 text-[var(--ui-t-body)] text-[var(--ui-text-tertiary)]">{t.list.loading}</p>
              ) : chats.length === 0 ? (
                // A filtered empty is a different sentence from an empty inbox,
                // and offering "Sync now" here would be answering the wrong
                // question.
                <p className="px-3 py-6 text-[var(--ui-t-body)] text-[var(--ui-text-tertiary)]">
                  {unreadOnly && !debouncedQuery ? t.list.noneUnread : t.list.noMatch}
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
            {/* `load` is already a useCallback, so passing it directly gives
                Thread a stable identity instead of a fresh arrow per render.
                Thread no longer depends on it either — see the note there —
                but handing it a new function 30 times a minute was what made
                that bug possible in the first place. */}
            <Thread key={openId || 'none'} chatId={openId} onChanged={load} />
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

export default HubInboxPage;
