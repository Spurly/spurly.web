import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Sidebar Summary Gateway
 * Talks to GET /api/hub/summary — leads/enrichment/campaigns/inbox counts
 * plus today's send pacing. See spurly.backend/src/products/hub/summary.
 */
async function get() {
  const res = await apiGateway.get('/hub/summary');
  return res.data;
}

/** GET /api/hub/summary/dashboard — sidebar fields plus connect rate and
 * recent enrichment failures. Used once per Dashboard page visit. */
async function getDashboard() {
  const res = await apiGateway.get('/hub/summary/dashboard');
  return res.data;
}

const sidebarSummaryGateway = { get, getDashboard };
export default sidebarSummaryGateway;
