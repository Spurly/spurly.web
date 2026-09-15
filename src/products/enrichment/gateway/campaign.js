import apiGateway from 'src/shared/gateway/apiGateway.js';
import { EnrichmentCampaign } from '../entities/campaign.js';

/**
 * Hub enrichment-campaigns API client.
 *
 * An enrichment campaign is a named, snapshotted list of leads queued for
 * bulk enrichment together. Creating one queues every lead in the same call
 * — unlike an outreach campaign, there is no separate "start" step, because
 * enrichment never contacts anyone; it only resolves a profile through
 * Unipile.
 */

/**
 * POST /hub/enrichment — create from a selection, queueing it immediately.
 * Returns { campaign, queued, requested }.
 */
async function createEnrichmentCampaign({ name, leadIds } = {}) {
  const res = await apiGateway.post('/hub/enrichment', { name, leadIds });
  const data = res.data?.data ?? { campaign: null, queued: 0, requested: 0 };
  return { ...data, campaign: EnrichmentCampaign.fromResponse(data.campaign) };
}

/** GET /hub/enrichment — the list, each with its live progress counts. */
async function listEnrichmentCampaigns() {
  const res = await apiGateway.get('/hub/enrichment');
  return EnrichmentCampaign.fromList(res.data?.data?.campaigns ?? []);
}

/** GET /hub/enrichment/:id — the campaign plus its live counts and status. */
async function getEnrichmentCampaign(id) {
  const res = await apiGateway.get(`/hub/enrichment/${id}`);
  const data = res.data?.data ?? null;
  if (!data) return null;
  return { ...data, campaign: EnrichmentCampaign.fromResponse(data.campaign) };
}

/** GET /hub/enrichment/:id/leads — the per-lead status table. */
async function listLeads(id, { status, page = 1, limit = 50 } = {}) {
  const params = { page, limit };
  if (status) params.status = status;
  const res = await apiGateway.get(`/hub/enrichment/${id}/leads`, { params });
  return res.data?.data ?? { leads: [], pagination: { page: 1, limit, total: 0 } };
}

/** POST /hub/enrichment/:id/retry — put failed leads back in the queue. */
async function retryFailed(id) {
  const res = await apiGateway.post(`/hub/enrichment/${id}/retry`);
  return res.data?.data ?? { requeued: 0 };
}

/**
 * DELETE /hub/enrichment/:id — remove the campaign grouping only.
 * Whatever each lead resolved to stays exactly as it is.
 */
async function deleteEnrichmentCampaign(id) {
  const res = await apiGateway.delete(`/hub/enrichment/${id}`);
  return res.data?.data ?? {};
}

const hubEnrichmentGateway = {
  createEnrichmentCampaign,
  listEnrichmentCampaigns,
  getEnrichmentCampaign,
  listLeads,
  retryFailed,
  deleteEnrichmentCampaign,
};

export default hubEnrichmentGateway;
