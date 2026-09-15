import hubEnrichmentGateway from '../gateway/campaign.js';

/**
 * Hub enrichment-campaigns controller — the one thing a page, hook, or
 * another feature (the leads page's "Needs enrichment" tab) is allowed to
 * call. Never the gateway directly. See campaigns/controller/campaign.js for
 * why this layer exists even though every method below delegates straight
 * through today.
 */
class EnrichmentCampaignController {
  createEnrichmentCampaign(params) {
    return hubEnrichmentGateway.createEnrichmentCampaign(params);
  }

  listEnrichmentCampaigns() {
    return hubEnrichmentGateway.listEnrichmentCampaigns();
  }

  getEnrichmentCampaign(id) {
    return hubEnrichmentGateway.getEnrichmentCampaign(id);
  }

  listLeads(id, options) {
    return hubEnrichmentGateway.listLeads(id, options);
  }

  retryFailed(id) {
    return hubEnrichmentGateway.retryFailed(id);
  }

  deleteEnrichmentCampaign(id) {
    return hubEnrichmentGateway.deleteEnrichmentCampaign(id);
  }
}

export const enrichmentCampaignController = new EnrichmentCampaignController();
export default enrichmentCampaignController;
