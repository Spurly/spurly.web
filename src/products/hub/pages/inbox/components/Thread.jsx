import { useEffect, useRef } from 'react';
import { Loader2, Send, Lock } from 'lucide-react';
import { Avatar, Badge, Button } from 'src/ui/primitives';
import { absoluteTime } from 'src/shared/utils/outreach';
import { useThread } from 'src/products/hub/inbox/hooks/useThread.js';
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
        <span className="text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)] px-2 py-1">{message.text || 'Activity'}</span>
      </li>
    );
  }

  return (
    <li className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[min(68ch,78%)]">
        <div
          className={[
            'rounded-[var(--ui-radius-md)] px-3 py-2 text-[var(--ui-t-body)] leading-[1.5] whitespace-pre-wrap break-words',
            mine
              ? 'bg-[var(--ui-surface-sunken)] text-[var(--ui-text-primary)]'
              : 'bg-[var(--ui-surface-card)] border border-[var(--ui-border)] text-[var(--ui-text-primary)]',
          ].join(' ')}
        >
          {message.text || <span className="text-[var(--ui-text-tertiary)]">(no text)</span>}
        </div>
        <div className={`mt-1 text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)] tabular-nums ${mine ? 'text-right' : ''}`}>
          {absoluteTime(message.timestamp)}
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
      <div className="grid place-items-center h-full text-[var(--ui-t-body)] text-[var(--ui-text-tertiary)]">
        {t.thread.pickConversation}
      </div>
    );
  }

  if (loading && !data) {
    return <ThreadSkeleton label={t.thread.loading} />;
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <header
        className="flex items-center gap-2 shrink-0 border-b border-[var(--ui-border-hairline)] px-4"
        style={{ height: 'var(--ui-band)' }}
      >
        <Avatar src={chat?.display?.pictureUrl || null} name={chat?.display?.name || ''} size={22} />
        <span className="text-[var(--ui-t-body)] text-[var(--ui-text-primary)] truncate">
          {chat?.display?.name || 'Unnamed conversation'}
        </span>
        {DEGREE_LABEL[chat?.connectionDegree] && (
          <Badge tone="neutral" title="How you are connected on LinkedIn">
            {DEGREE_LABEL[chat.connectionDegree]}
          </Badge>
        )}
      </header>

      <div className="flex-1 min-h-0 overflow-auto px-4 py-4">
        {data?.historyPending && (
          // An un-swept conversation and a conversation with nothing in it look
          // identical, and only one of them is the truth.
          <p className="mb-3 text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)] text-center">
            {t.thread.historyPending}
          </p>
        )}

        {messages.length === 0 && !data?.historyPending ? (
          <p className="text-[var(--ui-t-body)] text-[var(--ui-text-tertiary)] text-center py-8">{t.thread.noMessages}</p>
        ) : (
          <ul className="flex flex-col gap-3">
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
                      <span className="text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)] tabular-nums">{day}</span>
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

      {readOnly ? (
        <div className="shrink-0 border-t border-[var(--ui-border-hairline)] px-4 py-3 flex items-center gap-2 text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)]">
          <Lock size={13} aria-hidden="true" />
          {/* Not a disabled composer. A box you can type into and never send
              from is worse than no box — it invites the work, then refuses it. */}
          {t.thread.readOnly}
        </div>
      ) : (
        <form onSubmit={send} className="shrink-0 border-t border-[var(--ui-border-hairline)] p-3 flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter makes a newline; Cmd/Ctrl+Enter sends. The opposite
              // pairing turns a paragraph break into an outgoing message.
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(e);
            }}
            rows={2}
            placeholder={t.thread.composerPlaceholder}
            aria-label={t.thread.composerAriaLabel}
            className="flex-1 resize-none rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] px-3 py-2 text-[var(--ui-t-body)] leading-[1.5] text-[var(--ui-text-primary)] placeholder:text-[var(--ui-text-tertiary)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]"
          />
          <Button type="submit" disabled={sending || !draft.trim()} title={t.thread.sendTitle}>
            {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          </Button>
        </form>
      )}
    </div>
  );
}

export default Thread;
