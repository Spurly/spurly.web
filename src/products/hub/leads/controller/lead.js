import hubSourcingGateway from '../gateway/lead.js';

/**
 * Hub sourcing controller — the one thing a page, hook, or another feature
 * (campaigns' "create from selection", sequences' "enroll selection") is
 * allowed to call. Never the gateway directly.
 *
 * Pure pass-through today, same reasoning as CampaignController: the layer
 * exists so a rule that spans more than one gateway call has exactly one
 * place to live, not because there is one yet.
 */
class LeadController {
  createSearch(payload) {
    return hubSourcingGateway.createSearch(payload);
  }

  searchAudienceParams(params) {
    return hubSourcingGateway.searchAudienceParams(params);
  }

  listSearches() {
    return hubSourcingGateway.listSearches();
  }

  getSearch(id) {
    return hubSourcingGateway.getSearch(id);
  }

  runSearch(id) {
    return hubSourcingGateway.runSearch(id);
  }

  deleteSearch(id, options) {
    return hubSourcingGateway.deleteSearch(id, options);
  }

  listLeads(params) {
    return hubSourcingGateway.listLeads(params);
  }

  resolveProfile(id, options) {
    return hubSourcingGateway.resolveProfile(id, options);
  }

  withdrawInvitation(id) {
    return hubSourcingGateway.withdrawInvitation(id);
  }
}

export const leadController = new LeadController();
export default leadController;
