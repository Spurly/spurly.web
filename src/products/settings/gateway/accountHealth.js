import apiGateway from 'src/shared/gateway/apiGateway.js';
import { AccountHealth } from '../entities/accountHealth.js';

/**
 * Hub account-health API client (/api/hub/account/health).
 *
 * GET serves what the server has stored and never waits on LinkedIn, so it is
 * safe on page load. POST re-reads LinkedIn and is throttled server-side: a
 * second press inside 30s rejects with a 429 whose body carries `retryAfterMs`.
 */

/** GET /hub/account/health — null when the response has no health in it. */
async function get() {
  const res = await apiGateway.get('/hub/account/health');
  return AccountHealth.fromResponse(res.data?.data?.health ?? null);
}

/** POST /hub/account/health/refresh — re-read from LinkedIn, then the stored view. */
async function refresh() {
  const res = await apiGateway.post('/hub/account/health/refresh');
  return AccountHealth.fromResponse(res.data?.data?.health ?? null);
}

const hubAccountHealthGateway = { get, refresh };
export default hubAccountHealthGateway;
