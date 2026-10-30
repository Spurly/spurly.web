import hubInboxGateway from '../gateway/inbox.js';
import { INBOX_EVENTS } from '../constants/constants.js';

/**
 * Hub inbox controller — the one thing a page or hook is allowed to call.
 * Never the gateway directly. try/catch and async/await live here (and in
 * the gateway) only; every method takes the caller's `eventEmitter` first
 * and reports the outcome by emitting an event instead of returning or
 * throwing.
 */

/**
 * The list pane always loads its chats and its summary together — see
 * emptyStateFor in useInboxPage, which needs both to explain why the list
 * looks the way it does. Orchestrating that pairing here, in one place,
 * is exactly the kind of thing this layer exists for.
 */
async function loadInboxPage(eventEmitter, { q, unread } = {}) {
  try {
    const [list, summary] = await Promise.all([
      hubInboxGateway.listChats({ q, unread }),
      hubInboxGateway.getSummary(),
    ]);
    eventEmitter.emit(INBOX_EVENTS.PAGE_LOAD_SUCCESS, { chats: list.chats ?? [], pagination: list.pagination, summary });
  } catch (error) {
    eventEmitter.emit(INBOX_EVENTS.PAGE_LOAD_FAILURE, error);
  }
}

/**
 * The conversation list is paged. Page 1 is what `loadInboxPage` polls; later
 * pages are only fetched when the reader scrolls to the end. `sig` is echoed
 * back so the hook can discard a page that was requested under a filter the
 * reader has since changed.
 */
async function loadMoreChats(eventEmitter, { page, q, unread, sig }) {
  try {
    const list = await hubInboxGateway.listChats({ q, unread, page });
    eventEmitter.emit(INBOX_EVENTS.MORE_LOAD_SUCCESS, { chats: list.chats ?? [], page, sig });
  } catch (error) {
    eventEmitter.emit(INBOX_EVENTS.MORE_LOAD_FAILURE, error);
  }
}

async function getThread(eventEmitter, id, options) {
  try {
    const data = await hubInboxGateway.getThread(id, options);
    eventEmitter.emit(INBOX_EVENTS.THREAD_LOAD_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(INBOX_EVENTS.THREAD_LOAD_FAILURE, error);
  }
}

/** LOCAL ONLY — see gateway#markRead. Failure is silent by design: a badge
 * that stays lit is not worth a toast, and the next sync/reload clears it. */
async function markRead(eventEmitter, id) {
  try {
    await hubInboxGateway.markRead(id);
    eventEmitter.emit(INBOX_EVENTS.MARK_READ_SUCCESS, { id });
  } catch (error) {
    eventEmitter.emit(INBOX_EVENTS.MARK_READ_FAILURE, { id, error });
  }
}

async function sync(eventEmitter) {
  try {
    await hubInboxGateway.sync();
    eventEmitter.emit(INBOX_EVENTS.SYNC_SUCCESS);
  } catch (error) {
    eventEmitter.emit(INBOX_EVENTS.SYNC_FAILURE, error);
  }
}

/**
 * Emits SEND_SUCCESS, or SEND_FAILURE with `{ code, error }` — `code` is
 * 'SEND_UNCONFIRMED' when LinkedIn never answered (the message may or may
 * not have gone out), which the hook must not offer a plain retry for.
 */
async function sendReply(eventEmitter, id, text) {
  try {
    await hubInboxGateway.sendReply(id, text);
    eventEmitter.emit(INBOX_EVENTS.SEND_SUCCESS);
  } catch (error) {
    eventEmitter.emit(INBOX_EVENTS.SEND_FAILURE, { code: error?.response?.data?.code, error });
  }
}

async function reactToMessage(eventEmitter, messageId, emoji) {
  try {
    const data = await hubInboxGateway.reactToMessage(messageId, emoji);
    eventEmitter.emit(INBOX_EVENTS.REACT_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(INBOX_EVENTS.REACT_FAILURE, { code: error?.code, error });
  }
}

/** SEND_UNCONFIRMED is passed through as `code`, as for sendReply: never offer a plain retry for it. */
async function sendMedia(eventEmitter, chatId, payload) {
  try {
    await hubInboxGateway.sendMedia(chatId, payload);
    eventEmitter.emit(INBOX_EVENTS.MEDIA_SUCCESS);
  } catch (error) {
    eventEmitter.emit(INBOX_EVENTS.MEDIA_FAILURE, { code: error?.code, error });
  }
}

async function openAttachment(eventEmitter, { messageId, attachment }) {
  try {
    const blob = await hubInboxGateway.fetchAttachment(messageId, attachment.id);
    eventEmitter.emit(INBOX_EVENTS.ATTACHMENT_SUCCESS, { blob, attachment });
  } catch (error) {
    eventEmitter.emit(INBOX_EVENTS.ATTACHMENT_FAILURE, error);
  }
}

async function sendInmail(eventEmitter, leadId, payload) {
  try {
    const data = await hubInboxGateway.sendInmail(leadId, payload);
    eventEmitter.emit(INBOX_EVENTS.INMAIL_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(INBOX_EVENTS.INMAIL_FAILURE, { code: error?.code, error });
  }
}

/* ------------------------------------------------------------------ */
/* Live inbox                                                          */
/* ------------------------------------------------------------------ */

/**
 * One live connection for the whole page, however many hooks listen: the
 * conversation list and the open thread each call startLive with their own
 * emitter, and every server event is re-emitted to each as LIVE_EVENT.
 *
 * Reconnects with backoff (1s, 2s, 5s, 10s, then every 30s). Stops for good on
 * 401/402/403: signed out or no access, and retrying would only repeat it.
 * The list's 30-second poll stays on underneath, so a dropped connection makes
 * the inbox slower, never wrong.
 */
const RETRY_DELAYS_MS = [1000, 2000, 5000, 10000, 30000];
const liveEmitters = new Set();
let liveStream = null;
let liveRetryTimer = null;
let liveAttempt = 0;

function broadcast(event, payload) {
  for (const emitter of liveEmitters) emitter.emit(event, payload);
}

function connectLive() {
  liveStream = hubInboxGateway.openLiveStream({
    onOpen: () => {
      liveAttempt = 0;
      broadcast(INBOX_EVENTS.LIVE_STATUS, { connected: true });
    },
    onEvent: (name, data) => broadcast(INBOX_EVENTS.LIVE_EVENT, { name, ...data }),
    onClose: (error) => {
      liveStream = null;
      broadcast(INBOX_EVENTS.LIVE_STATUS, { connected: false });
      if (!liveEmitters.size || [401, 402, 403].includes(error?.status)) return;
      const delay = RETRY_DELAYS_MS[Math.min(liveAttempt, RETRY_DELAYS_MS.length - 1)];
      liveAttempt += 1;
      liveRetryTimer = setTimeout(() => {
        liveRetryTimer = null;
        if (liveEmitters.size && !liveStream) connectLive();
      }, delay);
    },
  });
}

function startLive(eventEmitter) {
  liveEmitters.add(eventEmitter);
  if (!liveStream && !liveRetryTimer) connectLive();
}

function stopLive(eventEmitter) {
  liveEmitters.delete(eventEmitter);
  if (liveEmitters.size) return;
  liveStream?.close();
  liveStream = null;
  clearTimeout(liveRetryTimer);
  liveRetryTimer = null;
  liveAttempt = 0;
}

const inboxController = { sendInmail, loadInboxPage, loadMoreChats, getThread, markRead, sync, sendReply, reactToMessage, sendMedia, openAttachment, startLive, stopLive };
export default inboxController;
