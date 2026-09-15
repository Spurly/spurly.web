import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import inboxController from '../controller/inbox.js';
import { INBOX_EVENTS } from '../constants/constants.js';

/**
 * State for one open conversation: loading its messages, marking it read,
 * and sending a reply. Moved out of the Thread component unchanged —
 * including the onChanged-in-a-ref trick below, which is load-bearing (see
 * the comment on it) and not incidental style.
 *
 * The component that renders this is keyed by chatId (remounts per
 * conversation), so this hook — and its eventEmitter — mount fresh once per
 * conversation. Nothing here has to worry about a chatId changing out from
 * under an in-flight call.
 */
export function useThread({ chatId, onChanged }) {
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const toast = useToast();

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
   * 🔴 `onChanged` IS KEPT IN A REF, for the same reason it always was: the
   * parent passes `onChanged={() => load()}` — a new function identity on
   * every one of its renders — and reacting to that identity rather than to
   * `chatId` caused an infinite request loop (see the old effect-dependency
   * postmortem this file used to carry). Read through the ref, never put it
   * in a dependency array.
   */
  const onChangedRef = useRef(onChanged);
  useEffect(() => { onChangedRef.current = onChanged; });

  /**
   * `loading` starts true and is only ever turned OFF in the THREAD_LOAD_*
   * handlers below. Setting it true synchronously from the mount effect
   * would be a cascading render — and pointless, since the initial state
   * already says so.
   */
  const load = useCallback(() => {
    if (!chatId) return;
    inboxController.getThread(eventEmitter, chatId);
  }, [chatId, eventEmitter]);

  // Every controller call reports back through this one subscription — no
  // .then()/.catch() and nothing awaited here.
  useEffect(() => {
    const onThreadLoadSuccess = (next) => {
      if (!mountedRef.current) return;
      setData(next);
      setLoading(false);
    };
    const onThreadLoadFailure = (err) => {
      if (!mountedRef.current) return;
      toast.error(getToastError(err, 'Could not load that conversation'));
      setLoading(false);
    };
    const onMarkReadSuccess = () => { onChangedRef.current?.(); };
    // A badge that stays lit is not worth a toast over. The next sync or
    // reload clears it, and nothing the user did failed.
    const onMarkReadFailure = () => {};
    const onSendSuccess = () => {
      if (mountedRef.current) setDraft('');
      if (mountedRef.current) setSending(false);
      load();
      onChangedRef.current?.();
    };
    /**
     * 🔴 THE DRAFT IS NOT CLEARED ON FAILURE, and `SEND_UNCONFIRMED` is not
     * offered a retry.
     *
     * That code means LinkedIn never answered — the message may have gone out
     * or may not, and the two are indistinguishable from here. A "try again"
     * button on that is a coin flip on sending the same message to a real
     * person twice, so the page says to go and look instead.
     */
    const onSendFailure = ({ code, error }) => {
      if (mountedRef.current) setSending(false);
      if (code === 'SEND_UNCONFIRMED') {
        toast.error('LinkedIn did not confirm that. Check the conversation there before sending again — it may have gone out.');
      } else {
        toast.error(getToastError(error, 'Could not send that message'));
      }
    };

    eventEmitter.on(INBOX_EVENTS.THREAD_LOAD_SUCCESS, onThreadLoadSuccess);
    eventEmitter.on(INBOX_EVENTS.THREAD_LOAD_FAILURE, onThreadLoadFailure);
    eventEmitter.on(INBOX_EVENTS.MARK_READ_SUCCESS, onMarkReadSuccess);
    eventEmitter.on(INBOX_EVENTS.MARK_READ_FAILURE, onMarkReadFailure);
    eventEmitter.on(INBOX_EVENTS.SEND_SUCCESS, onSendSuccess);
    eventEmitter.on(INBOX_EVENTS.SEND_FAILURE, onSendFailure);
    return () => {
      eventEmitter.off(INBOX_EVENTS.THREAD_LOAD_SUCCESS, onThreadLoadSuccess);
      eventEmitter.off(INBOX_EVENTS.THREAD_LOAD_FAILURE, onThreadLoadFailure);
      eventEmitter.off(INBOX_EVENTS.MARK_READ_SUCCESS, onMarkReadSuccess);
      eventEmitter.off(INBOX_EVENTS.MARK_READ_FAILURE, onMarkReadFailure);
      eventEmitter.off(INBOX_EVENTS.SEND_SUCCESS, onSendSuccess);
      eventEmitter.off(INBOX_EVENTS.SEND_FAILURE, onSendFailure);
    };
  }, [eventEmitter, toast, load]);

  useEffect(() => { load(); }, [load]);

  /**
   * Opening a conversation is what reads it. Local only — see
   * gateway#markRead. `chatId` alone is the dependency: opening a
   * conversation reads it once, and this hook remounts per conversation
   * anyway, so this fires exactly when it should.
   */
  useEffect(() => {
    if (!chatId) return;
    inboxController.markRead(eventEmitter, chatId);
  }, [chatId, eventEmitter]);

  const chat = data?.chat;
  const messages = data?.messages ?? [];
  const readOnly = Boolean(chat?.readOnly);

  const send = (event) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    inboxController.sendReply(eventEmitter, chatId, text);
  };

  return { data, loading, draft, setDraft, sending, chat, messages, readOnly, send };
}
