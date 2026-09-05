import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Campaigns API Client
 * Talks to /api/campaigns. Campaigns are outreach lists built from People;
 * the extension performs the actual sending.
 */
class CampaignsApi {
  /** Create a campaign from selected people. POST /campaigns */
  async create({ name, timeZone, personIds, excludeContacted = false }) {
    const res = await apiGateway.post('/campaigns', {
      name,
      timeZone,
      personIds,
      excludeContacted,
    });
    return res.data;
  }

  /**
   * Create a MESSAGE campaign from the Connections page.
   * POST /campaigns/from-connections
   *
   * Separate from create() because it takes connection ids rather than person
   * ids, and has no actionType to choose — everyone on the connections page is
   * already connected, so a connection request would skip every row.
   */
  async createFromConnections({
    name,
    timeZone,
    connectionIds,
    messageSubject = '',
    messageBody = '',
  }) {
    const res = await apiGateway.post('/campaigns/from-connections', {
      name,
      timeZone,
      connectionIds,
      messageSubject,
      messageBody,
    });
    return res.data;
  }

  /** List the user's campaigns. GET /campaigns */
  async list() {
    const res = await apiGateway.get('/campaigns');
    return res.data;
  }

  /** Get one campaign + its members. GET /campaigns/:id */
  async get(campaignId) {
    const res = await apiGateway.get(`/campaigns/${campaignId}`);
    return res.data;
  }

  /** Update name/status/actionType/connectionNote. PUT /campaigns/:id */
  async update(campaignId, update) {
    const res = await apiGateway.put(`/campaigns/${campaignId}`, update);
    return res.data;
  }

  /** Launch (flip to active so the extension processes it). POST /campaigns/:id/launch */
  async launch(campaignId) {
    const res = await apiGateway.post(`/campaigns/${campaignId}/launch`, {});
    return res.data;
  }

  /** Reset failed members to pending so a relaunch retries them. POST /campaigns/:id/retry */
  async retryFailed(campaignId) {
    const res = await apiGateway.post(`/campaigns/${campaignId}/retry`, {});
    return res.data;
  }

  /** Delete a campaign. DELETE /campaigns/:id */
  async remove(campaignId) {
    const res = await apiGateway.delete(`/campaigns/${campaignId}`);
    return res.data;
  }
}

export default new CampaignsApi();
