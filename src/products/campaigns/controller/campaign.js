import hubCampaignsGateway from '../gateway/campaign.js';
import { CAMPAIGN_EVENTS } from '../constants/constants.js';

/**
 * Hub campaigns controller — the one thing a page, hook, or another
 * feature (leads, creating a campaign from a selection) is allowed to call.
 * Never the gateway directly.
 *
 * Today this is an orchestration point with nothing to orchestrate yet —
 * every method wraps a single gateway call in try/catch and emits the
 * matching event pair. That is deliberate, not a placeholder to "fill in
 * later": the layer exists so that when a rule DOES span more than one
 * gateway call (e.g. retrying failed members also needs to re-check the
 * account's sending window), it has exactly one place to live rather than
 * getting duplicated across every hook that calls campaigns.
 */

async function createCampaign(eventEmitter, params) {
  try {
    const data = await hubCampaignsGateway.createCampaign(params);
    eventEmitter.emit(CAMPAIGN_EVENTS.CREATE_CAMPAIGN_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(CAMPAIGN_EVENTS.CREATE_CAMPAIGN_FAILURE, error);
  }
}

async function listCampaigns(eventEmitter) {
  try {
    const data = await hubCampaignsGateway.listCampaigns();
    eventEmitter.emit(CAMPAIGN_EVENTS.LIST_CAMPAIGNS_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(CAMPAIGN_EVENTS.LIST_CAMPAIGNS_FAILURE, error);
  }
}

async function getCampaign(eventEmitter, id) {
  try {
    const data = await hubCampaignsGateway.getCampaign(id);
    eventEmitter.emit(CAMPAIGN_EVENTS.GET_CAMPAIGN_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(CAMPAIGN_EVENTS.GET_CAMPAIGN_FAILURE, error);
  }
}

async function listMembers(eventEmitter, id, options) {
  try {
    const data = await hubCampaignsGateway.listMembers(id, options);
    eventEmitter.emit(CAMPAIGN_EVENTS.LIST_MEMBERS_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(CAMPAIGN_EVENTS.LIST_MEMBERS_FAILURE, error);
  }
}

async function addLeads(eventEmitter, id, options) {
  try {
    const data = await hubCampaignsGateway.addLeads(id, options);
    eventEmitter.emit(CAMPAIGN_EVENTS.ADD_LEADS_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(CAMPAIGN_EVENTS.ADD_LEADS_FAILURE, error);
  }
}

async function updateCampaign(eventEmitter, id, patch) {
  try {
    const data = await hubCampaignsGateway.updateCampaign(id, patch);
    eventEmitter.emit(CAMPAIGN_EVENTS.UPDATE_CAMPAIGN_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(CAMPAIGN_EVENTS.UPDATE_CAMPAIGN_FAILURE, error);
  }
}

async function startCampaign(eventEmitter, id) {
  try {
    const data = await hubCampaignsGateway.startCampaign(id);
    eventEmitter.emit(CAMPAIGN_EVENTS.START_CAMPAIGN_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(CAMPAIGN_EVENTS.START_CAMPAIGN_FAILURE, error);
  }
}

async function pauseCampaign(eventEmitter, id) {
  try {
    const data = await hubCampaignsGateway.pauseCampaign(id);
    eventEmitter.emit(CAMPAIGN_EVENTS.PAUSE_CAMPAIGN_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(CAMPAIGN_EVENTS.PAUSE_CAMPAIGN_FAILURE, error);
  }
}

async function retryFailed(eventEmitter, id) {
  try {
    const data = await hubCampaignsGateway.retryFailed(id);
    eventEmitter.emit(CAMPAIGN_EVENTS.RETRY_FAILED_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(CAMPAIGN_EVENTS.RETRY_FAILED_FAILURE, error);
  }
}

async function deleteCampaign(eventEmitter, id) {
  try {
    const data = await hubCampaignsGateway.deleteCampaign(id);
    eventEmitter.emit(CAMPAIGN_EVENTS.DELETE_CAMPAIGN_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(CAMPAIGN_EVENTS.DELETE_CAMPAIGN_FAILURE, error);
  }
}

const campaignController = {
  createCampaign,
  listCampaigns,
  getCampaign,
  listMembers,
  addLeads,
  updateCampaign,
  startCampaign,
  pauseCampaign,
  retryFailed,
  deleteCampaign,
};

export default campaignController;
