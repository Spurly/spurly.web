import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * GET /hub/companies/:identifier[?refresh=1] — one LinkedIn company, cached per
 * user for 7 days. Returns { company, cached, fetchedAt, expiresAt }.
 */
async function getCompany(identifier, { refresh = false } = {}) {
  const res = await apiGateway.get(`/hub/companies/${encodeURIComponent(identifier)}`, {
    params: refresh ? { refresh: 1 } : undefined,
  });
  return res.data?.data ?? null;
}

const hubCompanyGateway = { getCompany };
export default hubCompanyGateway;
