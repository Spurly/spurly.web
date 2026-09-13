import notificationsGateway from '../gateway/notifications.js';

/**
 * Notifications Controller
 * Unwraps the { success, message, data } envelope so hooks and components
 * never touch the transport shape. Components/hooks call this, never the API.
 */
class NotificationsController {
  /** @returns {Promise<{ items: Array, unreadCount: number }>} */
  async list({ limit } = {}) {
    const res = await notificationsGateway.list({ limit });
    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load notifications');
    }
    return { items: res.data?.items || [], unreadCount: res.data?.unreadCount || 0 };
  }

  async markRead(id) {
    const res = await notificationsGateway.markRead(id);
    if (!res?.success) throw new Error(res?.message || 'Failed to mark notification read');
    return res.data;
  }

  async markAllRead() {
    const res = await notificationsGateway.markAllRead();
    if (!res?.success) throw new Error(res?.message || 'Failed to mark notifications read');
    return res.data;
  }
}

export const notificationsController = new NotificationsController();
export default notificationsController;
