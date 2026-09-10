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
  /**
   * POST /hub/searches — queue an import from EITHER a pasted URL OR (Phase 8)
   * a structured filter object. Exactly one of `searchUrl`/`filters` should
   * be set — the server 400s on both or neither, this just forwards whichever
   * the caller built.
   */
  async createSearch({ searchUrl, filters, name }) {
    const res = await apiGateway.post('/hub/searches', { searchUrl, filters, name });
    return res.data?.data?.search ?? null;
  }

  /**
   * GET /hub/audience/params — Phase 8. Free-text -> LinkedIn internal id
   * lookup, for the filter-builder's autocomplete. `type` is the vendor's
   * own vocabulary (LOCATION, INDUSTRY, COMPANY, SCHOOL, ... — SKILL exists
   * at the vendor but the backend's structured-search allow-list has no field
   * for it on Classic tier, so it is not offered here). Matching is fuzzy on
   * the vendor's side — always show `title`, never assume the first result.
   */
  async searchAudienceParams({ type, keywords, limit } = {}) {
    const params = { type };
    if (keywords) params.keywords = keywords;
    if (limit) params.limit = limit;
    const res = await apiGateway.get('/hub/audience/params', { params });
    return res.data?.data?.params ?? [];
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

  /**
   * GET /hub/leads/:id/profile — Phase 6's lazy resolve-once.
   *
   * Called when the lead drawer opens, not on a button press. The backend
   * itself decides whether that costs a real vendor call: a lead resolved
   * before comes back unchanged unless `force` is passed. Callers should
   * still show a loading state while this is in flight — an unresolved lead
   * can take the same 2-20s a full-profile fetch always has.
   */
  async resolveProfile(id, { force = false } = {}) {
    const res = await apiGateway.get(`/hub/leads/${id}/profile${force ? '?force=true' : ''}`);
    return res.data?.data?.lead ?? null;
  }

  /**
   * DELETE /hub/leads/:id/invitation — Phase 6 (1c) withdraw.
   *
   * Only meaningful when the lead carries a `pendingInvitationId` — set by
   * the server-side reconciliation job, not by anything the client does.
   * A lead nobody has reconciled yet has nothing here to withdraw; the
   * server 422s that case (NO_PENDING_INVITATION) rather than silently
   * no-opping.
   */
  async withdrawInvitation(id) {
    const res = await apiGateway.delete(`/hub/leads/${id}/invitation`);
    return res.data?.data?.lead ?? null;
  }
}

export const hubSourcingApi = new HubSourcingApi();
export default hubSourcingApi;
