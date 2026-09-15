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
    eventEmitter.emit(INBOX_EVENTS.PAGE_LOAD_SUCCESS, { chats: list.chats ?? [], summary });
  } catch (error) {
    eventEmitter.emit(INBOX_EVENTS.PAGE_LOAD_FAILURE, error);
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

const inboxController = { loadInboxPage, getThread, markRead, sync, sendReply };
export default inboxController;
