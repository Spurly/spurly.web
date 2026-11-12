import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * The workspace default for "skip people I've messaged recently" (/api/hub/settings/recent-contact).
 * New message campaigns and new sequences copy it; changing it never touches ones that already exist.
 */

/** GET -> { enabled, days, scope } */
async function get() {
  const res = await apiGateway.get('/hub/settings/recent-contact');
  return res.data?.data ?? null;
}

async function set(patch) {
  const res = await apiGateway.put('/hub/settings/recent-contact', patch);
  return res.data?.data ?? null;
}

const hubRecentContactGateway = { get, set };
export default hubRecentContactGateway;
