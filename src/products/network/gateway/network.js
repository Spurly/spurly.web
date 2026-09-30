import apiGateway from 'src/shared/gateway/apiGateway.js';
import { Lead } from 'src/products/leads/entities/lead.js';
import { PAGE_SIZE } from '../constants/constants.js';

/** GET /hub/network — the sync status, or { exists: false } before the first sync. */
async function getNetwork() {
  const res = await apiGateway.get('/hub/network');
  return res.data?.data?.network ?? { exists: false };
}

/**
 * POST /hub/network/sync — start the first sync, or check for new connections.
 * Returns { network, message }.
 */
async function syncNetwork() {
  const res = await apiGateway.post('/hub/network/sync');
  return { network: res.data?.data?.network ?? { exists: false }, message: res.data?.message ?? '' };
}

/** GET /hub/leads scoped to the network audience, newest connection first. */
async function listConnections({ audienceId, q, page = 1, limit = PAGE_SIZE } = {}) {
  const params = { searchId: audienceId, sort: 'connected', page, limit };
  if (q) params.q = q;
  const res = await apiGateway.get('/hub/leads', { params });
  const data = res.data?.data ?? { leads: [], pagination: { page: 1, limit, total: 0 } };
  return { ...data, leads: Lead.fromList(data.leads ?? []) };
}

const hubNetworkGateway = { getNetwork, syncNetwork, listConnections };
export default hubNetworkGateway;
