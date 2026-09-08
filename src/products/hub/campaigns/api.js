import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Hub campaigns API client.
 *
 * A campaign is a list of hub's own leads and one connection request. Creating
 * one sends nothing: the server queues members and a paced worker sends them
 * over hours, inside the user's working hours, well under LinkedIn's weekly
 * cap. Every call here is about the QUEUE — none of them makes anything happen
 * to a real person, which is why the only irreversible-feeling button on the
 * page is "Start".
 */
class HubCampaignsApi {
  /**
   * POST /hub/campaigns — create, optionally from a selection.
   *
   * Returns { campaign, enrolled }: the row plus how many leads actually
   * joined. Those differ whenever a lead was already enrolled, and the page
   * says so rather than implying every selected row was added.
   */
  async createCampaign({ name, note, leadIds, searchId } = {}) {
    const res = await apiGateway.post('/hub/campaigns', { name, note, leadIds, searchId });
    return res.data?.data ?? { campaign: null, enrolled: 0 };
  }

  /** GET /hub/campaigns — the list, each with its member status counts. */
  async listCampaigns() {
    const res = await apiGateway.get('/hub/campaigns');
    return res.data?.data?.campaigns ?? [];
  }

  /**
   * GET /hub/campaigns/:id — the campaign, its counts, the account, and the
   * live pacing verdict.
   *
   * `pacing` is the answer to "it says running, why has nothing sent?" — a
   * correctly-paced campaign is idle most of the day, and without this the
   * page could only show a count that does not move.
   */
  async getCampaign(id) {
    const res = await apiGateway.get(`/hub/campaigns/${id}`);
    return res.data?.data ?? null;
  }

  /** GET /hub/campaigns/:id/members — the members table. */
  async listMembers(id, { status, page = 1, limit = 50 } = {}) {
    const params = { page, limit };
    if (status) params.status = status;
    const res = await apiGateway.get(`/hub/campaigns/${id}/members`, { params });
    return res.data?.data ?? { members: [], pagination: { page: 1, limit, total: 0 } };
  }

  /** POST /hub/campaigns/:id/members — add more leads to an existing campaign. */
  async addLeads(id, { leadIds, searchId } = {}) {
    const res = await apiGateway.post(`/hub/campaigns/${id}/members`, { leadIds, searchId });
    return res.data?.data ?? { enrolled: 0 };
  }

  /** PATCH /hub/campaigns/:id — rename, or edit the note while stopped. */
  async updateCampaign(id, { name, note } = {}) {
    const body = {};
    if (name !== undefined) body.name = name;
    // Sent even when empty: clearing the note is a real edit, and `undefined`
    // would be indistinguishable from "leave it alone".
    if (note !== undefined) body.note = note;
    const res = await apiGateway.patch(`/hub/campaigns/${id}`, body);
    return res.data?.data?.campaign ?? null;
  }

  /** POST /hub/campaigns/:id/start — begin or resume sending. */
  async startCampaign(id) {
    const res = await apiGateway.post(`/hub/campaigns/${id}/start`);
    return res.data?.data?.campaign ?? null;
  }

  /** POST /hub/campaigns/:id/pause — stop sending, keep the queue. */
  async pauseCampaign(id) {
    const res = await apiGateway.post(`/hub/campaigns/${id}/pause`);
    return res.data?.data?.campaign ?? null;
  }

  /**
   * POST /hub/campaigns/:id/retry — put failed members back in the queue.
   *
   * Returns { requeued, leftAlone }. `leftAlone` is the honest half: a send
   * that got no answer from LinkedIn may already have reached someone, so
   * those rows are never retried and the page has to say so.
   */
  async retryFailed(id) {
    const res = await apiGateway.post(`/hub/campaigns/${id}/retry`);
    return res.data?.data ?? { requeued: 0, leftAlone: 0 };
  }

  /**
   * DELETE /hub/campaigns/:id — remove the campaign and its members.
   *
   * Invitations already sent are NOT undone and stay in the outreach log:
   * they happened, and they still count against LinkedIn's weekly allowance.
   */
  async deleteCampaign(id) {
    const res = await apiGateway.delete(`/hub/campaigns/${id}`);
    return res.data?.data ?? {};
  }
}

export const hubCampaignsApi = new HubCampaignsApi();
export default hubCampaignsApi;
