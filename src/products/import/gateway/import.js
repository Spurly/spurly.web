import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Imported Leads API Client
 *
 * The CSV staging area that sits in front of the Hub. A row lives here from
 * the moment it's imported until the user promotes it — enrichment (if any)
 * now happens after promotion, on the Hub side (products/enrichment),
 * not while a lead sits in staging.
 */

/**
 * Stage parsed CSV rows. Free — nothing has been captured or scraped yet.
 * POST /imported-leads/batch
 */
async function stageLeads(leads, sourceFile = '') {
  const response = await apiGateway.post('/imported-leads/batch', { leads, sourceFile });
  return response.data;
}

/**
 * Get a page of staged leads.
 * GET /imported-leads  Query: { limit, skip, search?, enrichStatus?, importBatchId? }
 */
async function getLeads({ limit = 100, skip = 0, search, enrichStatus, importBatchId } = {}) {
  const params = { limit, skip };
  if (search && search.trim()) params.search = search.trim();
  // 'all' is the UI's "no filter" sentinel — never send it to the API.
  if (enrichStatus && enrichStatus !== 'all') params.enrichStatus = enrichStatus;
  if (importBatchId && importBatchId !== 'all') params.importBatchId = importBatchId;

  const response = await apiGateway.get('/imported-leads', { params });
  return response.data;
}

/** Counts per enrichment status. GET /imported-leads/stats */
async function getStats() {
  const response = await apiGateway.get('/imported-leads/stats');
  return response.data;
}

/** Send staged leads to the Hub. POST /imported-leads/promote */
async function promoteLeads(ids) {
  const response = await apiGateway.post('/imported-leads/promote', { ids });
  return response.data;
}

/**
 * Delete staged leads. DELETE /imported-leads
 * Axios needs a DELETE body passed as `data`.
 */
async function deleteLeads(ids) {
  const response = await apiGateway.delete('/imported-leads', { data: { ids } });
  return response.data;
}

const importGateway = { stageLeads, getLeads, getStats, promoteLeads, deleteLeads };
export default importGateway;
