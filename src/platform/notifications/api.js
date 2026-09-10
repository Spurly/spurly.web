import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Notifications API Client
 * Talks to /api/notifications — Phase 7's in-app feed (bell + unread badge +
 * /dashboard/notifications). See spurly.backend/src/platform/notifications.
 */
class NotificationsApi {
  /** Feed, newest first, + unread count. GET /notifications */
  async list({ limit = 30 } = {}) {
    const res = await apiGateway.get('/notifications', { params: { limit } });
    return res.data;
  }

  /** POST /notifications/:id/read */
  async markRead(id) {
    const res = await apiGateway.post(`/notifications/${id}/read`);
    return res.data;
  }

  /** POST /notifications/read-all */
  async markAllRead() {
    const res = await apiGateway.post('/notifications/read-all');
    return res.data;
  }
}

export default new NotificationsApi();
