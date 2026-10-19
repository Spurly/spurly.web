import apiGateway from 'src/shared/gateway/apiGateway.js';
import { LinkedInProfile } from '../entities/linkedinProfile.js';

/**
 * The owner's LinkedIn profile + ICP (/api/hub/account/profile).
 *
 * GET serves what the server has stored and never waits on LinkedIn, so it is
 * safe on page load. POST re-reads LinkedIn and is throttled server-side: a
 * second press inside 15s rejects with a body carrying `retryAfterMs`.
 */

/** GET /hub/account/profile -- null when the response has no profile in it. */
async function get() {
  const res = await apiGateway.get('/hub/account/profile');
  return LinkedInProfile.fromResponse(res.data?.data?.profile ?? null);
}

/** POST /hub/account/profile/refresh -- re-read from LinkedIn, then the stored view. */
async function refresh() {
  const res = await apiGateway.post('/hub/account/profile/refresh');
  return LinkedInProfile.fromResponse(res.data?.data?.profile ?? null);
}

/** PUT /hub/account/profile/icp -- resolves to the saved ICP. */
async function saveIcp(icp) {
  const res = await apiGateway.put('/hub/account/profile/icp', icp);
  return res.data?.data?.icp ?? null;
}

const hubProfileGateway = { get, refresh, saveIcp };
export default hubProfileGateway;
