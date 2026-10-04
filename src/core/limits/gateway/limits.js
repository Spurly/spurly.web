import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Limits Gateway
 * GET /api/limits — the tracker snapshot (per action: hour/day/week used,
 * remaining, next slot, what is limiting you). PUT /api/limits/preferences —
 * the user's quiet-hours setting. See spurly.backend/src/platform/limits and
 * spurly.backend/src/products/hub/safety.
 */
async function get() {
  const res = await apiGateway.get('/limits');
  return res.data;
}

async function savePreferences(preferences) {
  const res = await apiGateway.put('/limits/preferences', preferences);
  return res.data;
}

const limitsGateway = { get, savePreferences };
export default limitsGateway;
