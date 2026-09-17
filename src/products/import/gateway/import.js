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

/**
 * Queue staged leads for import. POST /imported-leads/promote
 *
 * Does NOT write straight into the Hub — the selected rows are resolved
 * through LinkedIn first (Unipile), one Hub audience per call, named by the
 * caller or (if omitted) auto-named server-side with a dated default. A row
 * disappears from staging on its own, the moment it's actually resolved and
 * lands in Hub Leads (see the Import page's polling).
 */
async function promoteLeads(ids, audienceName) {
  const response = await apiGateway.post('/imported-leads/promote', { ids, audienceName });
  return response.data;
}

/**
 * Put failed rows back to 'pending' so they can be re-selected and re-sent.
 * POST /imported-leads/retry
 */
async function retryLeads(ids) {
  const response = await apiGateway.post('/imported-leads/retry', { ids });
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

const importGateway = { stageLeads, getLeads, getStats, promoteLeads, retryLeads, deleteLeads };
export default importGateway;
