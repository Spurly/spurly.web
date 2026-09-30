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

async function runSearch(eventEmitter, id, options) {
  try {
    const data = await hubSourcingGateway.runSearch(id, options);
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

async function createList(eventEmitter, payload) {
  try {
    const data = await hubSourcingGateway.createList(payload);
    eventEmitter.emit(LEAD_EVENTS.CREATE_LIST_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(LEAD_EVENTS.CREATE_LIST_FAILURE, error);
  }
}

async function addLeadsToAudience(eventEmitter, id, payload) {
  try {
    const data = await hubSourcingGateway.addLeadsToAudience(id, payload);
    eventEmitter.emit(LEAD_EVENTS.ADD_TO_AUDIENCE_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(LEAD_EVENTS.ADD_TO_AUDIENCE_FAILURE, error);
  }
}

async function removeLeadsFromAudience(eventEmitter, id, payload) {
  try {
    const data = await hubSourcingGateway.removeLeadsFromAudience(id, payload);
    eventEmitter.emit(LEAD_EVENTS.REMOVE_FROM_AUDIENCE_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(LEAD_EVENTS.REMOVE_FROM_AUDIENCE_FAILURE, error);
  }
}

async function getSourcingUsage(eventEmitter) {
  try {
    const data = await hubSourcingGateway.getSourcingUsage();
    eventEmitter.emit(LEAD_EVENTS.SOURCING_USAGE_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(LEAD_EVENTS.SOURCING_USAGE_FAILURE, error);
  }
}

async function getFollowerSources(eventEmitter) {
  try {
    const data = await hubSourcingGateway.getFollowerSources();
    eventEmitter.emit(LEAD_EVENTS.FOLLOWER_SOURCES_SUCCESS, data);
  } catch (error) {
    eventEmitter.emit(LEAD_EVENTS.FOLLOWER_SOURCES_FAILURE, error);
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
  createList,
  addLeadsToAudience,
  removeLeadsFromAudience,
  getSourcingUsage,
  getFollowerSources,
};

export default leadController;
