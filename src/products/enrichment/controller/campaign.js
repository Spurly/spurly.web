import hubEnrichmentGateway from '../gateway/campaign.js';
import { ENRICHMENT_EVENTS } from '../constants/constants.js';

/**
 * Hub enrichment-campaigns controller — the one thing a page, hook, or
 * another feature (the leads page's "Needs enrichment" tab) is allowed to
 * call. Never the gateway directly. See campaigns/controller/campaign.js for
 * why this layer exists even though every method below wraps a single
 * gateway call today.
 */

async function createEnrichmentCampaign(eventEmitter, params) {
  try {
    const data = await hubEnrichmentGateway.createEnrichmentCampaign(params);
    eventEmitter.emit(ENRICHMENT_EVENTS.CREATE_ENRICHMENT_CAMPAIGN_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(ENRICHMENT_EVENTS.CREATE_ENRICHMENT_CAMPAIGN_FAILURE, error);
  }
}

async function listEnrichmentCampaigns(eventEmitter) {
  try {
    const data = await hubEnrichmentGateway.listEnrichmentCampaigns();
    eventEmitter.emit(ENRICHMENT_EVENTS.LIST_ENRICHMENT_CAMPAIGNS_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(ENRICHMENT_EVENTS.LIST_ENRICHMENT_CAMPAIGNS_FAILURE, error);
  }
}

async function getEnrichmentCampaign(eventEmitter, id) {
  try {
    const data = await hubEnrichmentGateway.getEnrichmentCampaign(id);
    eventEmitter.emit(ENRICHMENT_EVENTS.GET_ENRICHMENT_CAMPAIGN_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(ENRICHMENT_EVENTS.GET_ENRICHMENT_CAMPAIGN_FAILURE, error);
  }
}

async function listLeads(eventEmitter, id, options) {
  try {
    const data = await hubEnrichmentGateway.listLeads(id, options);
    eventEmitter.emit(ENRICHMENT_EVENTS.LIST_LEADS_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(ENRICHMENT_EVENTS.LIST_LEADS_FAILURE, error);
  }
}

async function retryFailed(eventEmitter, id) {
  try {
    const data = await hubEnrichmentGateway.retryFailed(id);
    eventEmitter.emit(ENRICHMENT_EVENTS.RETRY_FAILED_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(ENRICHMENT_EVENTS.RETRY_FAILED_FAILURE, error);
  }
}

async function deleteEnrichmentCampaign(eventEmitter, id) {
  try {
    const data = await hubEnrichmentGateway.deleteEnrichmentCampaign(id);
    eventEmitter.emit(ENRICHMENT_EVENTS.DELETE_ENRICHMENT_CAMPAIGN_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(ENRICHMENT_EVENTS.DELETE_ENRICHMENT_CAMPAIGN_FAILURE, error);
  }
}

const enrichmentCampaignController = {
  createEnrichmentCampaign,
  listEnrichmentCampaigns,
  getEnrichmentCampaign,
  listLeads,
  retryFailed,
  deleteEnrichmentCampaign,
};

export default enrichmentCampaignController;
