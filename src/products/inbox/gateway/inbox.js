import apiGateway from 'src/shared/gateway/apiGateway.js';
import { Chat } from '../entities/chat.js';
import { Message } from '../entities/message.js';

/**
 * Hub inbox API client.
 *
 * Two things here are worth knowing before reading the page.
 *
 * The inbox is a MIRROR, not a proxy. Conversations and messages live in our
 * database because the vendor's real-time feed does not replay history — a
 * message that arrives while nobody is looking exists only in the payload the
 * server was handed, so it is written down or it is gone. Every read below hits
 * our own store and is fast; nothing here waits on LinkedIn.
 *
 * The one exception is `sendReply`, which goes out to the provider inline and
 * can take a couple of seconds. It is also the only call on this page that
 * does something to a real person.
 */

/**
 * GET /hub/inbox — counts, sweep state, and whether the live feed has fired.
 *
 * This is what lets the page explain its own emptiness. An empty inbox has
 * four causes — no LinkedIn connected, no sweep queued yet, a sweep still
 * running, and a genuinely empty account — and the conversation list cannot
 * tell them apart. A screen that cannot explain why it is blank gets read as
 * broken.
 */
async function getSummary() {
  const res = await apiGateway.get('/hub/inbox');
  return res.data?.data ?? null;
}

/** GET /hub/inbox/chats — the conversation list, newest activity first. */
async function listChats({ q, unread, page = 1, limit = 30 } = {}) {
  const params = { page, limit };
  if (q) params.q = q;
  if (unread) params.unread = 'true';
  const res = await apiGateway.get('/hub/inbox/chats', { params });
  const data = res.data?.data ?? { chats: [], pagination: { page: 1, limit, total: 0 } };
  return { ...data, chats: Chat.fromList(data.chats ?? []) };
}

/**
 * GET /hub/inbox/chats/:id — one conversation, oldest message first.
 *
 * Carries `historyPending`, which the thread has to honour: a conversation
 * the sweep has not reached yet is empty for a reason that is not "nobody
 * said anything", and rendering those two identically is a lie the user acts
 * on.
 */
async function getThread(id, { page = 1, limit = 50 } = {}) {
  const res = await apiGateway.get(`/hub/inbox/chats/${id}`, { params: { page, limit } });
  const data = res.data?.data ?? null;
  if (!data) return null;
  return { ...data, chat: Chat.fromResponse(data.chat), messages: Message.fromList(data.messages ?? []) };
}

/**
 * POST /hub/inbox/chats/:id/read — clear the unread badge.
 *
 * LOCAL ONLY. This does not mark the conversation read on LinkedIn, and
 * deliberately so: opening a thread here must not fire a read receipt at the
 * other person from an account the user is not sitting in front of.
 */
async function markRead(id) {
  const res = await apiGateway.post(`/hub/inbox/chats/${id}/read`);
  return res.data?.data ?? { ok: true };
}

/** POST /hub/inbox/sync — queue a history sweep. Runs in the background. */
async function sync() {
  const res = await apiGateway.post('/hub/inbox/sync');
  return res.data?.data ?? null;
}

/**
 * POST /hub/inbox/chats/:id/messages — send a reply, now.
 *
 * No pacing, no queue: a reply is a person answering someone who wrote to
 * them, not a campaign contacting strangers on a schedule. It can still fail,
 * and one failure matters more than the rest — `SEND_UNCONFIRMED` means
 * LinkedIn never answered, so the message may or may not have gone out. The
 * page must not offer a cheerful retry for that one.
 */
async function sendReply(id, text) {
  const res = await apiGateway.post(`/hub/inbox/chats/${id}/messages`, { text });
  return res.data?.data ?? null;
}

/** POST /hub/inbox/messages/:id/reaction. Counts against the account's daily action budget. */
async function reactToMessage(messageId, emoji) {
  const res = await apiGateway.post(`/hub/inbox/messages/${messageId}/reaction`, { emoji });
  return res.data?.data ?? null;
}

/**
 * POST /hub/inbox/chats/:id/media. The request body IS the file (not multipart):
 * the server validates type and size from the headers before reading a byte.
 * A long timeout, because this is an upload and not an API call.
 */
async function sendMedia(chatId, { kind, file, text = '' }) {
  const params = { kind, filename: file.name };
  if (text) params.text = text;
  const res = await apiGateway.post(`/hub/inbox/chats/${chatId}/media`, file, {
    params,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    timeout: 180000,
  });
  return res.data?.data ?? null;
}

/** GET a received attachment as a Blob (the route is authenticated, so an <a href> cannot be used). */
async function fetchAttachment(messageId, attachmentId) {
  const res = await apiGateway.get(`/hub/inbox/messages/${messageId}/attachments/${encodeURIComponent(attachmentId)}`, { responseType: 'blob', timeout: 60000 });
  return res.data;
}

/** POST /hub/leads/:id/inmail: costs an InMail credit; only for people you are not connected to. */
async function sendInmail(leadId, { subject, text }) {
  const res = await apiGateway.post(`/hub/leads/${leadId}/inmail`, { subject, text }, { timeout: 60000 });
  return res.data?.data ?? null;
}

const hubInboxGateway = { sendInmail, getSummary, listChats, getThread, markRead, sync, sendReply, reactToMessage, sendMedia, fetchAttachment };
export default hubInboxGateway;
