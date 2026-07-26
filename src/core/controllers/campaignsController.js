import campaignsApi from 'src/core/gateway/campaignsApi.js';

/**
 * Campaigns Controller
 * Thin orchestration over the campaigns API. Unwraps the { success, data }
 * envelope and throws a readable error so hooks/pages can rely on the payload.
 */
class CampaignsController {
  /**
   * @returns {Promise<{ campaign, memberCount, skippedContacted }>}
   * `skippedContacted` is the authoritative count of already-contacted people
   * the server dropped — the modal's own preview only sees the loaded page.
   */
  async createCampaign({ name, personIds, excludeContacted = false }) {
    const res = await campaignsApi.create({ name, personIds, excludeContacted });
    if (!res?.success) throw new Error(res?.message || 'Failed to create campaign');
    return {
      campaign: res.data.campaign,
      memberCount: res.data.memberCount ?? res.data.campaign?.stats?.total ?? 0,
      skippedContacted: res.data.skippedContacted ?? 0,
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
