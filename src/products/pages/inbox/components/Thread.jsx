import { useEffect, useRef } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { Avatar, Badge, Button, SoonTag } from 'src/core/primitives';
import { SendIcon, SparkIcon } from 'src/core/icons';
import { absoluteTime } from 'src/shared/utils/outreach';
import { useThread } from 'src/products/inbox/hooks/useThread.js';
import { AiWriteButton } from 'src/products/personalization/AiWriteButton.jsx';
import { ThreadSkeleton } from './ThreadSkeleton.jsx';
import { inboxStrings as t } from '../strings.js';

/**
 * One conversation: header, messages, composer.
 *
 * The composer is the only thing on this page that reaches a real person, so
 * two of its behaviours are deliberate rather than incidental — see
 * useThread.js#send.
 */

const DAY = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };

/** 1 -> "1st", 2 -> "2nd", 3 -> "3rd". Only ever these three: the normaliser
 *  emits 1, 2, 3 or null, and null means "we don't know", never "not
 *  connected". */
const DEGREE_LABEL = { 1: '1st', 2: '2nd', 3: '3rd' };

/** Messages arrive ascending. A thread here spans months, so the day it was
 *  said matters more than the clock time, and a bare list of times reads as
 *  one conversation that happened all at once. */
function dayKey(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, DAY);
}

function Bubble({ message }) {
  const mine = Boolean(message.isSender);

  /**
   * LinkedIn's own system entries ("X accepted your invitation") are messages
   * to the vendor and not to a reader. Shown centred and quiet rather than
   * filtered out: they are the only in-thread evidence of some events.
   */
  if (message.isEvent) {
    return (
      <li className="flex justify-center">
        <span className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)] px-2 py-1">{message.text || 'Activity'}</span>
      </li>
    );
  }

  return (
    <li className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[min(68ch,78%)]">
        <div
          className={[
            'rounded-[var(--ui-radius-lg)] px-3.5 py-2.5 text-[length:var(--ui-t-control)] leading-[1.6] whitespace-pre-wrap break-words',
            mine
              ? 'bg-[var(--ui-accent)] text-[var(--ui-accent-on)] shadow-[var(--ui-btn-shadow)]'
              : 'bg-[var(--ui-surface-card)] border border-[var(--ui-border)] text-[var(--ui-text-primary)]',
          ].join(' ')}
        >
          {message.text || <span className="text-[var(--ui-text-tertiary)]">(no text)</span>}
        </div>
        <div className={`mt-1.5 font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)] tabular-nums ${mine ? 'text-right' : ''}`}>
          {mine ? 'You' : message.senderName || ''}{mine || message.senderName ? ' · ' : ''}{absoluteTime(message.timestamp)}
        </div>
      </div>
    </li>
  );
}

export function Thread({ chatId, onChanged }) {
  const { data, loading, draft, setDraft, sending, chat, messages, readOnly, send } = useThread({ chatId, onChanged });
  const bottomRef = useRef(null);

  // Jump to the newest message — the bottom of a conversation is where a
  // reader starts, not the top.
  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [loading, data?.messages?.length]);

  if (!chatId) {
    return (
      <div className="grid place-items-center h-full bg-[var(--ui-surface-page)] text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)]">
        {t.thread.pickConversation}
      </div>
    );
  }

  if (loading && !data) {
    return <ThreadSkeleton label={t.thread.loading} />;
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="flex items-center gap-3 shrink-0 border-b border-[var(--ui-border)] px-5 h-14">
        <Avatar src={chat?.display?.pictureUrl || null} name={chat?.display?.name || ''} size={30} />
        <div className="min-w-0 flex-1">
          <p className="text-[length:var(--ui-t-nav)] font-semibold text-[var(--ui-text-primary)] truncate leading-[1.3]">
            {chat?.display?.name || 'Unnamed conversation'}
          </p>
          {chat?.display?.headline && (
            <p className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)] truncate leading-[1.35]">{chat.display.headline}</p>
          )}
        </div>
        {DEGREE_LABEL[chat?.connectionDegree] && (
          <Badge tone={chat.connectionDegree === 1 ? 'success' : 'neutral'} dot title="How you are connected on LinkedIn">
            {DEGREE_LABEL[chat.connectionDegree]} degree
          </Badge>
        )}
        {chat?.display?.profileUrl && (
          <a
            href={chat.display.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center h-8 px-3.5 rounded-[var(--ui-radius-btn)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] text-[length:var(--ui-t-control)] font-medium text-[var(--ui-text-body)] transition-[border-color,box-shadow] duration-[var(--ui-dur-fast)] hover:border-[var(--ui-accent-border)] hover:shadow-[var(--ui-hover-ring)] hover:no-underline"
          >
            View profile
          </a>
        )}
      </header>

      <div className="flex-1 min-h-0 overflow-auto bg-[var(--ui-surface-page)]">
        <div className="max-w-[680px] mx-auto px-5 py-6">
        {data?.historyPending && (
          // An un-swept conversation and a conversation with nothing in it look
          // identical, and only one of them is the truth.
          <p className="mb-3 text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)] text-center">
            {t.thread.historyPending}
          </p>
        )}

        {messages.length === 0 && !data?.historyPending ? (
          <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-tertiary)] text-center py-8">{t.thread.noMessages}</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {messages.map((message, index) => {
              // Derived from the previous message rather than carried in a
              // variable across the map: reassigning during render is exactly
              // what the compiler rule forbids, and a memoised re-render would
              // read a stale value anyway.
              const day = dayKey(message.timestamp);
              const showDay = day && day !== (index > 0 ? dayKey(messages[index - 1].timestamp) : null);
              return (
                <div key={message._id} className="contents">
                  {showDay && (
                    <li className="flex justify-center">
                      <span className="text-[length:var(--ui-t-meta)] text-[var(--ui-text-tertiary)] tabular-nums">{day}</span>
                    </li>
                  )}
                  <Bubble message={message} />
                </div>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
        </div>
      </div>

      {readOnly ? (
        <div className="shrink-0 border-t border-[var(--ui-border)] px-5 py-3.5 flex items-center gap-2 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] bg-[var(--ui-surface-header)]">
          <Lock size={13} aria-hidden="true" />
          {/* Not a disabled composer. A box you can type into and never send
              from is worse than no box — it invites the work, then refuses it. */}
          {t.thread.readOnly}
        </div>
      ) : (
        <form onSubmit={send} className="shrink-0 border-t border-[var(--ui-border)] bg-[var(--ui-surface-card)] px-5 pt-3.5 pb-4">
          <div className="max-w-[680px] mx-auto flex flex-col gap-2.5">
            {/* The handoff's suggested-reply chips need an intent read of the
                thread (not built). The chips' place is kept, marked SOON. */}
            <div className="flex items-center gap-2 flex-wrap">
              {['Reply to their question', 'Offer two times', 'Ask who else reviews'].map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--ui-radius-pill)] border border-[var(--ui-accent-tint-strong)] text-[length:var(--ui-t-label)] text-[var(--ui-accent-fg)] opacity-60 cursor-not-allowed"
                  title="Suggested replies are coming soon"
                >
                  <SparkIcon size={11} strokeWidth={1.9} />
                  {label}
                </span>
              ))}
              <SoonTag />
            </div>
            <div className="rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] focus-within:border-[var(--ui-accent)] focus-within:shadow-[var(--ui-focus-ring)] transition-[border-color,box-shadow] duration-[var(--ui-dur-fast)] overflow-hidden">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(e);
                }}
                rows={3}
                placeholder={t.thread.composerPlaceholder}
                aria-label={t.thread.composerAriaLabel}
                className="block w-full resize-none bg-transparent px-3.5 py-3 text-[length:var(--ui-t-control)] leading-[1.6] text-[var(--ui-text-primary)] placeholder:text-[var(--ui-text-quaternary)] focus:outline-none"
              />
              <div className="flex items-center gap-2 px-3 py-2 border-t border-[var(--ui-border-hairline)] bg-[var(--ui-surface-header)]">
                <span className="flex-1 min-w-0 truncate font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)]">
                  ⌘↵ to send · edit freely
                </span>
                {/* A reply is always a DIRECT_MESSAGE to one already-open
                    thread, to one known person — recipientName tells the
                    server to write literal text, never a {{token}}. */}
                <AiWriteButton
                  content={draft}
                  type="DIRECT_MESSAGE"
                  recipientName={chat?.display?.name || ''}
                  maxLength={2000}
                  disabled={sending}
                  onApply={setDraft}
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={sending || !draft.trim()}
                  title={t.thread.sendTitle}
                  leadingIcon={sending ? <Loader2 size={13} className="animate-spin" /> : <SendIcon size={13} strokeWidth={1.9} />}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default Thread;
