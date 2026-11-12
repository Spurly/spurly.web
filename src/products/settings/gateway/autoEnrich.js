import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Automatic profile enrichment (/api/hub/leads/enrich/auto).
 * GET: the setting, the server's allowed range, and today's progress. PUT: change any of enabled / dailyTarget / includeFailed.
 * No try/catch: apiGateway rejects with the response body and the controller reports it.
 */

/** GET -> { enabled, dailyTarget, includeFailed, limits: { min, max, default }, progress: { usedToday, waiting, needing } } */
async function get() {
  const res = await apiGateway.get('/hub/leads/enrich/auto');
  return res.data?.data ?? null;
}

async function set(patch) {
  const res = await apiGateway.put('/hub/leads/enrich/auto', patch);
  return res.data?.data ?? null;
}

const hubAutoEnrichGateway = { get, set };
export default hubAutoEnrichGateway;
