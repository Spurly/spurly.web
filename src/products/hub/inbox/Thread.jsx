import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Send, Lock } from 'lucide-react';
import { Avatar, Badge, Button, useToast } from 'src/ui/primitives';
import { absoluteTime } from 'src/shared/utils/outreach';
import { getToastError } from 'src/shared/utils/apiError';
import { hubInboxApi } from './api.js';

/**
 * One conversation: header, messages, composer.
 *
 * The composer is the only thing on this page that reaches a real person, so
 * two of its behaviours are deliberate rather than incidental — see `send`.
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
        <span className="text-[11px] text-[var(--ui-text-tertiary)] px-2 py-1">{message.text || 'Activity'}</span>
      </li>
    );
  }

  return (
    <li className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[min(68ch,78%)]">
        <div
          className={[
            'rounded-[var(--ui-radius-md)] px-3 py-2 text-[13px] leading-[1.5] whitespace-pre-wrap break-words',
            mine
              ? 'bg-[var(--ui-surface-sunken)] text-[var(--ui-text-primary)]'
              : 'bg-[var(--ui-surface-card)] border border-[var(--ui-border)] text-[var(--ui-text-primary)]',
          ].join(' ')}
        >
          {message.text || <span className="text-[var(--ui-text-tertiary)]">(no text)</span>}
        </div>
        <div className={`mt-1 text-[11px] text-[var(--ui-text-tertiary)] tabular-nums ${mine ? 'text-right' : ''}`}>
          {absoluteTime(message.timestamp)}
        </div>
      </div>
    </li>
  );
}

export function Thread({ chatId, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const toast = useToast();
  const bottomRef = useRef(null);

  /**
   * Set on every mount, not only cleared on unmount. StrictMode mounts,
   * unmounts and remounts in development; a cleanup-only version leaves this
   * false for the life of the real mount, so every response is discarded and
   * the pane sits on "Loading…" over requests that plainly succeeded. It cost
   * an afternoon in Phase 3 — invisible in production, which is what makes it
   * worth the comment.
   */
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  /**
   * `loading` starts true and is only ever turned OFF here, in an async
   * callback. Setting it true synchronously from the mount effect would be a
   * cascading render — and pointless, since the initial state already says so.
   */
  const load = useCallback(() => {
    if (!chatId) return Promise.resolve();
    return hubInboxApi.getThread(chatId)
      .then((next) => { if (mountedRef.current) setData(next); })
      .catch((err) => { if (mountedRef.current) toast.error(getToastError(err, 'Could not load that conversation')); })
      .finally(() => { if (mountedRef.current) setLoading(false); });
  }, [chatId, toast]);

  useEffect(() => { load(); }, [load]);

  /** Opening a conversation is what reads it. Local only — see api#markRead. */
  useEffect(() => {
    if (!chatId) return;
    hubInboxApi.markRead(chatId).then(onChanged).catch(() => {
      // A badge that stays lit is not worth a toast over. The next sync or
      // reload clears it, and nothing the user did failed.
    });
  }, [chatId, onChanged]);

  // Jump to the newest message — the bottom of a conversation is where a
  // reader starts, not the top.
  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [loading, data?.messages?.length]);

  if (!chatId) {
    return (
      <div className="grid place-items-center h-full text-[13px] text-[var(--ui-text-tertiary)]">
        Pick a conversation
      </div>
    );
  }

  if (loading && !data) {
    return <div className="grid place-items-center h-full text-[13px] text-[var(--ui-text-tertiary)]">Loading…</div>;
  }

  const chat = data?.chat;
  const messages = data?.messages ?? [];
  const readOnly = Boolean(chat?.readOnly);

  const send = async (event) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      await hubInboxApi.sendReply(chatId, text);
      if (mountedRef.current) setDraft('');
      await load();
      onChanged?.();
    } catch (err) {
      /**
       * 🔴 THE DRAFT IS NOT CLEARED ON FAILURE, and `SEND_UNCONFIRMED` is not
       * offered a retry.
       *
       * That code means LinkedIn never answered — the message may have gone out
       * or may not, and the two are indistinguishable from here. A "try again"
       * button on that is a coin flip on sending the same message to a real
       * person twice, so the page says to go and look instead.
       */
      const code = err?.response?.data?.code;
      if (code === 'SEND_UNCONFIRMED') {
        toast.error('LinkedIn did not confirm that. Check the conversation there before sending again — it may have gone out.');
      } else {
        toast.error(getToastError(err, 'Could not send that message'));
      }
    } finally {
      if (mountedRef.current) setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <header
        className="flex items-center gap-2 shrink-0 border-b border-[var(--ui-border-hairline)] px-4"
        style={{ height: 'var(--ui-band)' }}
      >
        <Avatar src={chat?.display?.pictureUrl || null} name={chat?.display?.name || ''} size={22} />
        <span className="text-[13px] text-[var(--ui-text-primary)] truncate">
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
          <p className="mb-3 text-[11px] text-[var(--ui-text-tertiary)] text-center">
            Still fetching this conversation's history — there may be more above.
          </p>
        )}

        {messages.length === 0 && !data?.historyPending ? (
          <p className="text-[13px] text-[var(--ui-text-tertiary)] text-center py-8">No messages in this conversation.</p>
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
                      <span className="text-[11px] text-[var(--ui-text-tertiary)] tabular-nums">{day}</span>
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
        <div className="shrink-0 border-t border-[var(--ui-border-hairline)] px-4 py-3 flex items-center gap-2 text-[12px] text-[var(--ui-text-tertiary)]">
          <Lock size={13} aria-hidden="true" />
          {/* Not a disabled composer. A box you can type into and never send
              from is worse than no box — it invites the work, then refuses it. */}
          LinkedIn has this conversation as read-only, so it cannot be replied to.
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
            placeholder="Write a reply…  (⌘↵ to send)"
            aria-label="Reply"
            className="flex-1 resize-none rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] px-3 py-2 text-[13px] leading-[1.5] text-[var(--ui-text-primary)] placeholder:text-[var(--ui-text-tertiary)] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]"
          />
          <Button type="submit" disabled={sending || !draft.trim()} title="Send now">
            {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          </Button>
        </form>
      )}
    </div>
  );
}

export default Thread;
