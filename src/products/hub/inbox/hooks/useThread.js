import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import inboxController from '../controller/inbox.js';

/**
 * State for one open conversation: loading its messages, marking it read,
 * and sending a reply. Moved out of the Thread component unchanged —
 * including the onChanged-in-a-ref trick below, which is load-bearing (see
 * the comment on it) and not incidental style.
 */
export function useThread({ chatId, onChanged }) {
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
   * `loading` starts true and is only ever turned OFF here, in an async
   * callback. Setting it true synchronously from the mount effect would be a
   * cascading render — and pointless, since the initial state already says so.
   */
  const load = useCallback(() => {
    if (!chatId) return Promise.resolve();
    return inboxController.getThread(chatId)
      .then((next) => { if (mountedRef.current) setData(next); })
      .catch((err) => { if (mountedRef.current) toast.error(getToastError(err, 'Could not load that conversation')); })
      .finally(() => { if (mountedRef.current) setLoading(false); });
  }, [chatId, toast]);

  useEffect(() => { load(); }, [load]);

  /**
   * Opening a conversation is what reads it. Local only — see
   * gateway#markRead.
   *
   * 🔴 `onChanged` IS KEPT IN A REF AND OUT OF THE DEPENDENCIES, and that is
   * load-bearing rather than tidiness. The parent passes `onChanged={() =>
   * load()}` — a new function identity on every one of its renders. With it in
   * the dependency array this effect ran, called markRead, called onChanged,
   * which reloaded the list, which re-rendered the parent, which produced a
   * new onChanged, which re-ran this effect… An infinite request loop bounded
   * only by network latency: three requests every few hundred milliseconds,
   * for as long as a conversation was open. Visible in the Network tab as
   * read / chats / inbox repeating for ever.
   *
   * `chatId` alone is the honest dependency: opening a conversation reads it,
   * once. The component is keyed by chat id and remounts per conversation
   * anyway, so this fires exactly when it should.
   */
  const onChangedRef = useRef(onChanged);
  useEffect(() => { onChangedRef.current = onChanged; });

  useEffect(() => {
    if (!chatId) return;
    inboxController.markRead(chatId).then(() => onChangedRef.current?.()).catch(() => {
      // A badge that stays lit is not worth a toast over. The next sync or
      // reload clears it, and nothing the user did failed.
    });
  }, [chatId]);

  const chat = data?.chat;
  const messages = data?.messages ?? [];
  const readOnly = Boolean(chat?.readOnly);

  const send = async (event) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      await inboxController.sendReply(chatId, text);
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

  return { data, loading, draft, setDraft, sending, chat, messages, readOnly, send };
}
