import apiGateway from 'src/core/gateway/apiGateway.js';

/**
 * Imported Leads API Client
 *
 * The CSV staging area that sits in front of People. A row lives here from the
 * moment it's imported until the user promotes it — enrichment happens in
 * between, driven by the extension.
 */
class ImportedLeadsApi {
  /**
   * Stage parsed CSV rows. Free — nothing has been captured or scraped yet.
   * POST /imported-leads/batch
   */
  async stageLeads(leads, sourceFile = '') {
    const response = await apiGateway.post('/imported-leads/batch', { leads, sourceFile });
    return response.data;
  }

  /**
   * Get a page of staged leads.
   * GET /imported-leads  Query: { limit, skip, search?, enrichStatus?, importBatchId? }
   */
  async getLeads({ limit = 100, skip = 0, search, enrichStatus, importBatchId } = {}) {
    const params = { limit, skip };
    if (search && search.trim()) params.search = search.trim();
    // 'all' is the UI's "no filter" sentinel — never send it to the API.
    if (enrichStatus && enrichStatus !== 'all') params.enrichStatus = enrichStatus;
    if (importBatchId && importBatchId !== 'all') params.importBatchId = importBatchId;

    const response = await apiGateway.get('/imported-leads', { params });
    return response.data;
  }

  /** Counts per enrichment status. GET /imported-leads/stats */
  async getStats() {
    const response = await apiGateway.get('/imported-leads/stats');
    return response.data;
  }

  /**
   * Queue leads for enrichment. The extension picks the queue up from the
   * backend, so the ids never travel through the page bridge.
   * POST /imported-leads/enrich/queue
   */
  async queueEnrichment(ids) {
    const response = await apiGateway.post('/imported-leads/enrich/queue', { ids });
    return response.data;
  }

  /** Clear the queue (Stop). POST /imported-leads/enrich/cancel */
  async cancelEnrichment() {
    const response = await apiGateway.post('/imported-leads/enrich/cancel');
    return response.data;
  }

  /** Move staged leads into People. POST /imported-leads/promote */
  async promoteLeads(ids) {
    const response = await apiGateway.post('/imported-leads/promote', { ids });
    return response.data;
  }

  /**
   * Delete staged leads. DELETE /imported-leads
   * Axios needs a DELETE body passed as `data`.
   */
  async deleteLeads(ids) {
    const response = await apiGateway.delete('/imported-leads', { data: { ids } });
    return response.data;
  }
}

export default new ImportedLeadsApi();
