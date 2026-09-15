import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Notifications Gateway
 * Talks to /api/notifications — Phase 7's in-app feed (bell + unread badge +
 * /dashboard/notifications). See spurly.backend/src/core/notifications.
 */

/** Feed, newest first, + unread count. GET /notifications */
async function list({ limit = 30 } = {}) {
  const res = await apiGateway.get('/notifications', { params: { limit } });
  return res.data;
}

/** POST /notifications/:id/read */
async function markRead(id) {
  const res = await apiGateway.post(`/notifications/${id}/read`);
  return res.data;
}

/** POST /notifications/read-all */
async function markAllRead() {
  const res = await apiGateway.post('/notifications/read-all');
  return res.data;
}

const notificationsGateway = { list, markRead, markAllRead };
export default notificationsGateway;
