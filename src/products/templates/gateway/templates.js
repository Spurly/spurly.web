import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Message Templates API Client
 *
 * Talks to /api/message-templates — the same records the Chrome extension's
 * Templates tab reads and writes, so a template created here is immediately
 * pickable in the extension and vice versa.
 *
 * Template `type` is one of:
 *   CONNECTION_REQUEST — the note attached to a LinkedIn invitation
 *   DIRECT_MESSAGE     — a message to an existing 1st-degree connection
 *
 * Plain async functions, no try/catch: the shared apiGateway response
 * interceptor already normalizes every failure, so a gateway-level
 * try/catch here would just be a no-op wrapper.
 */

/** GET /message-templates?type=&search=&limit=&skip= */
async function list(params = {}) {
  const res = await apiGateway.get('/message-templates', { params });
  return res.data;
}

/** GET /message-templates/by-type/:type */
async function listByType(type, params = {}) {
  const res = await apiGateway.get(`/message-templates/by-type/${type}`, { params });
  return res.data;
}

/** GET /message-templates/:id */
async function get(templateId) {
  const res = await apiGateway.get(`/message-templates/${templateId}`);
  return res.data;
}

/** POST /message-templates */
async function create(payload) {
  const res = await apiGateway.post('/message-templates', payload);
  return res.data;
}

/** PUT /message-templates/:id */
async function update(templateId, payload) {
  const res = await apiGateway.put(`/message-templates/${templateId}`, payload);
  return res.data;
}

/** DELETE /message-templates/:id */
async function remove(templateId) {
  const res = await apiGateway.delete(`/message-templates/${templateId}`);
  return res.data;
}

/** POST /message-templates/:id/duplicate */
async function duplicate(templateId, newName) {
  const res = await apiGateway.post(`/message-templates/${templateId}/duplicate`, { newName });
  return res.data;
}

/** PUT /message-templates/:id/favorite — toggles */
async function toggleFavorite(templateId) {
  const res = await apiGateway.put(`/message-templates/${templateId}/favorite`, {});
  return res.data;
}

const templatesGateway = { list, listByType, get, create, update, remove, duplicate, toggleFavorite };
export default templatesGateway;
