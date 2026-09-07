import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Hub sourcing API client.
 *
 * Talks to /api/hub/searches and /api/hub/leads. A "search" is one saved
 * audience: a LinkedIn search URL the user pasted, which the server pages
 * through in the background and turns into leads.
 *
 * Importing is NOT request/response — a thousand leads is roughly a hundred
 * calls to LinkedIn. Creating a search only queues it; a worker picks it up
 * within the minute and the page polls for progress. Nothing here waits.
 */
class HubSourcingApi {
  /** POST /hub/searches — queue an import. 201 with the queued row. */
  async createSearch({ searchUrl, name }) {
    const res = await apiGateway.post('/hub/searches', { searchUrl, name });
    return res.data?.data?.search ?? null;
  }

  /** GET /hub/searches — every audience with its progress. */
  async listSearches() {
    const res = await apiGateway.get('/hub/searches');
    return res.data?.data?.searches ?? [];
  }

  /** GET /hub/searches/:id — one audience, for polling while it runs. */
  async getSearch(id) {
    const res = await apiGateway.get(`/hub/searches/${id}`);
    return res.data?.data?.search ?? null;
  }

  /**
   * POST /hub/searches/:id/run — resume or re-run.
   *
   * One audience is one row: an import that stopped part-way resumes from its
   * cursor, and a finished one starts a fresh pass to pick up people who have
   * appeared since. Leads dedupe either way, so this never doubles anyone.
   */
  async runSearch(id) {
    const res = await apiGateway.post(`/hub/searches/${id}/run`);
    return res.data?.data?.search ?? null;
  }

  /**
   * DELETE /hub/searches/:id — remove the audience.
   *
   * Leads survive by default and keep working: a lead can be in a campaign, and
   * the audience row records how the book was built rather than owning it.
   * Pass deleteLeads only where the user has been told what goes.
   */
  async deleteSearch(id, { deleteLeads = false } = {}) {
    const res = await apiGateway.delete(`/hub/searches/${id}${deleteLeads ? '?leads=delete' : ''}`);
    return res.data?.data ?? {};
  }

  /** GET /hub/leads — the contacts table. */
  async listLeads({ searchId, q, page = 1, limit = 50 } = {}) {
    const params = { page, limit };
    if (searchId) params.searchId = searchId;
    if (q) params.q = q;
    const res = await apiGateway.get('/hub/leads', { params });
    return res.data?.data ?? { leads: [], pagination: { page: 1, limit, total: 0 } };
  }
}

export const hubSourcingApi = new HubSourcingApi();
export default hubSourcingApi;
