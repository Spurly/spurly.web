import hubCampaignsGateway from '../gateway/campaign.js';

/**
 * Hub campaigns controller — the one thing a page, hook, or another
 * feature (leads, creating a campaign from a selection) is allowed to call.
 * Never the gateway directly.
 *
 * Today this is a orchestration point with nothing to orchestrate yet — every
 * method delegates straight through. That is deliberate, not a placeholder to
 * "fill in later": the layer exists so that when a rule DOES span more than
 * one gateway call (e.g. retrying failed members also needs to re-check the
 * account's sending window), it has exactly one place to live rather than
 * getting duplicated across every hook that calls campaigns.
 */
class CampaignController {
  createCampaign(params) {
    return hubCampaignsGateway.createCampaign(params);
  }

  listCampaigns() {
    return hubCampaignsGateway.listCampaigns();
  }

  getCampaign(id) {
    return hubCampaignsGateway.getCampaign(id);
  }

  listMembers(id, options) {
    return hubCampaignsGateway.listMembers(id, options);
  }

  addLeads(id, options) {
    return hubCampaignsGateway.addLeads(id, options);
  }

  updateCampaign(id, patch) {
    return hubCampaignsGateway.updateCampaign(id, patch);
  }

  startCampaign(id) {
    return hubCampaignsGateway.startCampaign(id);
  }

  pauseCampaign(id) {
    return hubCampaignsGateway.pauseCampaign(id);
  }

  retryFailed(id) {
    return hubCampaignsGateway.retryFailed(id);
  }

  deleteCampaign(id) {
    return hubCampaignsGateway.deleteCampaign(id);
  }
}

export const campaignController = new CampaignController();
export default campaignController;
