import hubSourcingGateway from '../gateway/lead.js';
import { LEAD_EVENTS, EXPORT_PAGE_SIZE, EXPORT_MAX_ROWS } from '../constants/constants.js';
import { fetchAllPages } from 'src/shared/utils/fetchAllPages.js';

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

/**
 * Bulk export: every lead matching the current audience and filters, across all
 * pages (200 a request, a few at a time), up to EXPORT_MAX_ROWS. Stored data, no
 * LinkedIn call. Emits { leads, total, truncated }.
 */
async function exportLeads(eventEmitter, params) {
  try {
    const { rows, total, truncated } = await fetchAllPages(
      async (page) => {
        const data = await hubSourcingGateway.listLeads({ ...params, page, limit: EXPORT_PAGE_SIZE });
        return { rows: data.leads ?? [], total: data.pagination?.total ?? 0 };
      },
      { pageSize: EXPORT_PAGE_SIZE, maxRows: EXPORT_MAX_ROWS, keyOf: (lead) => lead._id },
    );
    eventEmitter.emit(LEAD_EVENTS.EXPORT_LEADS_SUCCESS, { leads: rows, total, truncated });
  } catch (error) {
    eventEmitter.emit(LEAD_EVENTS.EXPORT_LEADS_FAILURE, error);
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
  exportLeads,
  resolveProfile,
  withdrawInvitation,
  createList,
  addLeadsToAudience,
  removeLeadsFromAudience,
  getSourcingUsage,
  getFollowerSources,
};

export default leadController;
