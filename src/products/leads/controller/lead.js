import hubSourcingGateway from '../gateway/lead.js';
import { LEAD_EVENTS } from '../constants/constants.js';

async function createSearch(eventEmitter, payload) {
  try {
    const data = await hubSourcingGateway.createSearch(payload);
    eventEmitter.emit(LEAD_EVENTS.CREATE_SEARCH_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(LEAD_EVENTS.CREATE_SEARCH_FAILURE, error);
  }
}

async function searchAudienceParams(eventEmitter, params) {
  try {
    const data = await hubSourcingGateway.searchAudienceParams(params);
    eventEmitter.emit(LEAD_EVENTS.SEARCH_AUDIENCE_PARAMS_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(LEAD_EVENTS.SEARCH_AUDIENCE_PARAMS_FAILURE, error);
  }
}

async function listSearches(eventEmitter) {
  try {
    const data = await hubSourcingGateway.listSearches();
    eventEmitter.emit(LEAD_EVENTS.LIST_SEARCHES_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(LEAD_EVENTS.LIST_SEARCHES_FAILURE, error);
  }
}

async function getSearch(eventEmitter, id) {
  try {
    const data = await hubSourcingGateway.getSearch(id);
    eventEmitter.emit(LEAD_EVENTS.GET_SEARCH_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(LEAD_EVENTS.GET_SEARCH_FAILURE, error);
  }
}

async function runSearch(eventEmitter, id) {
  try {
    const data = await hubSourcingGateway.runSearch(id);
    eventEmitter.emit(LEAD_EVENTS.RUN_SEARCH_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(LEAD_EVENTS.RUN_SEARCH_FAILURE, error);
  }
}

async function deleteSearch(eventEmitter, id, options) {
  try {
    const data = await hubSourcingGateway.deleteSearch(id, options);
    eventEmitter.emit(LEAD_EVENTS.DELETE_SEARCH_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(LEAD_EVENTS.DELETE_SEARCH_FAILURE, error);
  }
}

async function listLeads(eventEmitter, params) {
  try {
    const data = await hubSourcingGateway.listLeads(params);
    eventEmitter.emit(LEAD_EVENTS.LIST_LEADS_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(LEAD_EVENTS.LIST_LEADS_FAILURE, error);
  }
}

async function resolveProfile(eventEmitter, id, options) {
  try {
    const data = await hubSourcingGateway.resolveProfile(id, options);
    eventEmitter.emit(LEAD_EVENTS.RESOLVE_PROFILE_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(LEAD_EVENTS.RESOLVE_PROFILE_FAILURE, error);
  }
}

async function withdrawInvitation(eventEmitter, id) {
  try {
    const data = await hubSourcingGateway.withdrawInvitation(id);
    eventEmitter.emit(LEAD_EVENTS.WITHDRAW_INVITATION_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(LEAD_EVENTS.WITHDRAW_INVITATION_FAILURE, error);
  }
}

const leadController = {
  createSearch,
  searchAudienceParams,
  listSearches,
  getSearch,
  runSearch,
  deleteSearch,
  listLeads,
  resolveProfile,
  withdrawInvitation,
};

export default leadController;
