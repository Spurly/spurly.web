import notificationsGateway from "../gateway/notifications.js";
import { NOTIFICATION_EVENTS } from "../constants/constants.js";

/**
 * Notifications Controller
 *
 * try/catch and async/await live here (and in the gateway) only — nothing
 * else in this feature awaits a promise or catches an error. Every method
 * takes the caller's `eventEmitter` as its first argument and reports the
 * outcome by emitting an event instead of returning/throwing; the hook
 * subscribes with `eventEmitter.on(...)` and never touches the raw
 * gateway response shape.
 */

/** Emits LIST_SUCCESS with { items, unreadCount }, or LIST_FAILURE with a
 * message. */
async function list(eventEmitter, { limit } = {}) {
  try {
    const res = await notificationsGateway.list({ limit });
    if (!res?.success)
      throw new Error(res?.message || "Failed to load notifications");
    eventEmitter.emit(NOTIFICATION_EVENTS.LIST_SUCCESS, {
      items: res.data?.items || [],
      unreadCount: res.data?.unreadCount || 0,
    });
  } catch (error) {
    eventEmitter.emit(
      NOTIFICATION_EVENTS.LIST_FAILURE,
      error?.message || "Failed to load notifications",
    );
  }
}

/** Emits MARK_READ_SUCCESS/_FAILURE with { id }. The hook already updates
 * the bell optimistically, so both sides just carry the id — a failure is
 * silently reconciled by the next poll, same as before. */
async function markRead(eventEmitter, id) {
  try {
    const res = await notificationsGateway.markRead(id);
    if (!res?.success)
      throw new Error(res?.message || "Failed to mark notification read");
    eventEmitter.emit(NOTIFICATION_EVENTS.MARK_READ_SUCCESS, { id });
  } catch (error) {
    eventEmitter.emit(NOTIFICATION_EVENTS.MARK_READ_FAILURE, {
      id,
      message: error?.message,
    });
  }
}

/** Emits MARK_ALL_READ_SUCCESS/_FAILURE. Same reconcile-by-poll reasoning
 * as markRead. */
async function markAllRead(eventEmitter) {
  try {
    const res = await notificationsGateway.markAllRead();
    if (!res?.success)
      throw new Error(res?.message || "Failed to mark notifications read");
    eventEmitter.emit(NOTIFICATION_EVENTS.MARK_ALL_READ_SUCCESS);
  } catch (error) {
    eventEmitter.emit(
      NOTIFICATION_EVENTS.MARK_ALL_READ_FAILURE,
      error?.message,
    );
  }
}

const notificationsController = { list, markRead, markAllRead };
export default notificationsController;
