import campaignsApi from 'src/products/leadgen/campaigns/api.js';

/**
 * The browser's IANA zone, sent with every create.
 *
 * Campaign names are generated server-side and carry a timestamp, but the
 * server runs in UTC — without this a 3:40 PM IST campaign is named "10:10 AM"
 * for the only person who will ever read it. Resolved once; a tab that outlives
 * a DST change is not worth a per-call lookup.
 */
const BROWSER_TIME_ZONE = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch (_) {
    return undefined;
  }
})();

/**
 * Campaigns Controller
 * Thin orchestration over the campaigns API. Unwraps the { success, data }
 * envelope and throws a readable error so hooks/pages can rely on the payload.
 */
class CampaignsController {
  /**
   * @param {Object} params
   * @param {string} [params.name] - Optional. Campaigns are auto-named by the
   *   server; nothing in the UI asks for a name at creation time any more, and
   *   the user renames from the campaign detail page instead.
   * @returns {Promise<{ campaign, memberCount, skippedContacted }>}
   * `skippedContacted` is the authoritative count of already-contacted people
   * the server dropped — the modal's own preview only sees the loaded page.
   */
  async createCampaign({ name, personIds, excludeContacted = false }) {
    const res = await campaignsApi.create({
      name,
      timeZone: BROWSER_TIME_ZONE,
      personIds,
      excludeContacted,
    });
    if (!res?.success) throw new Error(res?.message || 'Failed to create campaign');
    return {
      campaign: res.data.campaign,
      memberCount: res.data.memberCount ?? res.data.campaign?.stats?.total ?? 0,
      skippedContacted: res.data.skippedContacted ?? 0,
    };
  }

  /**
   * Create a message campaign from selected connections.
   *
   * The server promotes those connections into People first, so the resulting
   * campaign behaves exactly like one started from the People page.
   *
   * @returns {Promise<{ campaign, memberCount, promoted, skipped }>}
   */
  async createCampaignFromConnections({ name, connectionIds, messageSubject, messageBody }) {
    const res = await campaignsApi.createFromConnections({
      name,
      timeZone: BROWSER_TIME_ZONE,
      connectionIds,
      messageSubject,
      messageBody,
    });
    if (!res?.success) throw new Error(res?.message || 'Failed to create campaign');
    return {
      campaign: res.data.campaign,
      memberCount: res.data.memberCount ?? res.data.campaign?.stats?.total ?? 0,
      promoted: res.data.promoted ?? 0,
      skipped: res.data.skipped ?? 0,
    };
  }

  async listCampaigns() {
    const res = await campaignsApi.list();
    if (!res?.success) throw new Error(res?.message || 'Failed to list campaigns');
    return res.data.campaigns || [];
  }

  async getCampaign(campaignId) {
    const res = await campaignsApi.get(campaignId);
    if (!res?.success) throw new Error(res?.message || 'Failed to load campaign');
    return { campaign: res.data.campaign, members: res.data.members || [] };
  }

  async updateCampaign(campaignId, update) {
    const res = await campaignsApi.update(campaignId, update);
    if (!res?.success) throw new Error(res?.message || 'Failed to update campaign');
    return res.data.campaign;
  }

  /** @returns {Promise<{ campaign, budget }>} budget is null for message campaigns */
  async launchCampaign(campaignId) {
    const res = await campaignsApi.launch(campaignId);
    if (!res?.success) throw new Error(res?.message || 'Failed to launch campaign');
    return { campaign: res.data.campaign, budget: res.data.budget ?? null };
  }

  /** @returns {Promise<{ retried, campaign }>} */
  async retryFailedMembers(campaignId) {
    const res = await campaignsApi.retryFailed(campaignId);
    if (!res?.success) throw new Error(res?.message || 'Failed to retry members');
    return { retried: res.data.retried ?? 0, campaign: res.data.campaign };
  }

  async deleteCampaign(campaignId) {
    const res = await campaignsApi.remove(campaignId);
    if (!res?.success) throw new Error(res?.message || 'Failed to delete campaign');
    return true;
  }
}

export default new CampaignsController();
