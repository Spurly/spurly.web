import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { InboxIcon, SearchIcon } from 'src/core/icons';
import { DashboardLayout } from 'src/core/layout/DashboardLayout';
import { Avatar, Button, EmptyState, FilterPills, IconButton, Input } from 'src/core/primitives';
import { relativeTime } from 'src/shared/utils/outreach';
import { useInboxPage } from 'src/products/inbox/hooks/useInboxPage.js';
import { Thread } from './components/Thread.jsx';
import { ChatRowsSkeleton } from './components/ChatRowsSkeleton.jsx';
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
const DEGREE_LABEL = { 1: '1st', 2: '2nd', 3: '3rd' };

function ChatRow({ chat, active }) {
  const unread = (chat.unreadCount ?? 0) > 0;
  const degree = DEGREE_LABEL[chat.connectionDegree];

  return (
    <Link
      to={`/hub/inbox?chat=${chat._id}`}
      replace
      aria-current={active ? 'true' : undefined}
      className={[
        'relative w-full text-left flex gap-3 px-4 py-3.5 border-b border-[var(--ui-border-hairline)] transition-colors duration-[140ms] hover:no-underline',
        active
          ? 'bg-[var(--ui-accent-wash)] shadow-[inset_2px_0_0_var(--ui-accent)]'
          : 'hover:bg-[var(--ui-surface-hover)]',
      ].join(' ')}
    >
      <Avatar src={chat.display?.pictureUrl || null} name={chat.display?.name || ''} size={30} />

      <span className="flex-1 min-w-0">
        <span className="flex items-baseline gap-2">
          <span
            className={`flex-1 min-w-0 truncate text-[length:var(--ui-t-nav)] text-[var(--ui-text-primary)] ${
              unread ? 'font-semibold' : 'font-medium'
            }`}
          >
            {chat.display?.name || 'Unnamed conversation'}
          </span>
          <span className="shrink-0 font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)] tabular-nums">
            {relativeTime(chat.lastMessageAt)}
          </span>
        </span>

        <span className="block mt-0.5 truncate text-[length:var(--ui-t-control)] leading-[1.45] text-[var(--ui-text-body)]">
          {/* "you:" is the only thing that tells a glance whether the ball is
              in their court or ours — the single most useful bit in a row. */}
          {chat.lastMessageIsSender && <span className="text-[var(--ui-text-quaternary)]">You: </span>}
          {chat.lastMessageText || (chat.backfilledAt === null ? 'Fetching history…' : 'No messages')}
        </span>

        {(unread || degree || chat.display?.headline) && (
          <span className="flex items-center gap-2 mt-2 min-w-0">
            {unread && (
              <span className="inline-flex shrink-0 whitespace-nowrap items-center h-5 px-1.5 rounded-[var(--ui-radius-xs)] bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)] text-[length:var(--ui-t-meta)] font-medium">
                {chat.unreadCount} new
              </span>
            )}
            {degree && (
              <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-text-secondary)]">{degree}</span>
            )}
            {chat.display?.headline && (
              <span className="min-w-0 truncate font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)]">
                {chat.display.headline}
              </span>
            )}
          </span>
        )}
      </span>
    </Link>
  );
}

/**
 * Inbox — the handoff's Inbox screen: no page header band; the list column
 * carries its own title, description and pills, the thread fills the rest.
 */
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

  const total = summary?.chats ?? chats.length;
  const unreadTotal = summary?.unread ?? chats.filter((c) => (c.unreadCount ?? 0) > 0).length;

  return (
    <DashboardLayout header={false} layout="bare" title={t.pageTitle}>
      {nothingAtAll ? (
        <div className="flex-1 grid place-items-center">
          <EmptyState
            icon={<InboxIcon size={22} strokeWidth={1.6} />}
            title={empty.title}
            hint={empty.hint}
            action={
              empty.cta ? (
                <Button variant="primary" onClick={() => navigate(empty.cta.to)}>{empty.cta.label}</Button>
              ) : empty.sync ? (
                <Button variant="primary" onClick={startSync}>{t.syncNow}</Button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="flex h-full min-h-0">
          <aside className="w-[322px] shrink-0 flex flex-col min-h-0 border-r border-[var(--ui-border)] bg-[var(--ui-surface-card)]">
            <div className="shrink-0 px-4 pt-5 pb-3 border-b border-[var(--ui-border-hairline)]">
              <div className="flex items-center gap-2">
                <h1 className="flex-1 text-[length:var(--ui-t-heading)] font-semibold tracking-[var(--ui-track-tight)] text-[var(--ui-text-primary)]">
                  {t.pageTitle}
                </h1>
                <IconButton
                  size="sm"
                  variant="ghost"
                  label={t.refreshTitle}
                  onClick={refresh}
                  disabled={refreshing}
                  icon={<RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />}
                  className="!w-7 !h-7"
                />
              </div>
              <p className="mt-1 text-[length:var(--ui-t-label)] leading-[1.45] text-[var(--ui-text-secondary)]">{t.pageSubtitle}</p>
              <Input
                size="sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.search.placeholder}
                aria-label={t.search.ariaLabel}
                leadingIcon={<SearchIcon size={13} strokeWidth={2} />}
                className="w-full mt-3 [&>input]:w-full"
              />
              <FilterPills
                size="sm"
                className="mt-2.5"
                ariaLabel="Filter conversations"
                value={unreadOnly ? 'unread' : 'all'}
                onChange={(v) => setUnreadOnly(v === 'unread')}
                options={[
                  { id: 'all', label: 'All', count: total },
                  { id: 'unread', label: t.search.unread, count: unreadTotal },
                ]}
              />
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              {loading ? (
                <ChatRowsSkeleton label={t.list.loading} />
              ) : chats.length === 0 ? (
                // A filtered empty is a different sentence from an empty inbox,
                // and offering "Sync now" here would be answering the wrong
                // question.
                <p className="px-4 py-6 text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)]">
                  {unreadOnly && !debouncedQuery ? t.list.noneUnread : t.list.noMatch}
                </p>
              ) : (
                chats.map((chat) => <ChatRow key={chat._id} chat={chat} active={chat._id === openId} />)
              )}
            </div>
          </aside>

          <section className="flex-1 min-w-0 min-h-0 bg-[var(--ui-surface-card)]">
            {/* Keyed on the id so switching conversations REMOUNTS rather than
                reconciling — the draft, the scroll position and the loading
                state all belong to one thread. */}
            <Thread key={openId || 'none'} chatId={openId} onChanged={load} />
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

export default HubInboxPage;
