import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Org gateway.
 *   POST   /org/login/request   { email }          -> { sent }
 *   POST   /org/login/verify    { email, code }    -> { token, user: { id, name, email }, orgs }
 *   GET    /org                                     -> { orgs }
 *   GET    /org/accounts        ?orgId&page&limit   -> { items, total, page, limit }
 *   DELETE /org/accounts/:accountId                 -> { ... }
 */

/** The API answers { message, error: CODE }; network failures arrive with status 0. */
function toError(error) {
  if (error?.status === 0) return { status: 0, message: 'Cannot reach server - check your connection', code: 'NETWORK_ERROR' };
  return { status: error?.status || 500, message: error?.message || 'Something went wrong', code: error?.error || error?.code || 'ERROR' };
}

async function unwrap(request) {
  try {
    const response = await request;
    return response.data?.data || {};
  } catch (error) {
    throw toError(error);
  }
}

const requestLoginCode = (email) => unwrap(apiGateway.post('/org/login/request', { email }));
const verifyLoginCode = (email, code) => unwrap(apiGateway.post('/org/login/verify', { email, code }));
const getOrgs = () => unwrap(apiGateway.get('/org'));

function getAccounts({ orgId, page = 1, limit = 50 }) {
  const params = new URLSearchParams({ orgId, page: String(page), limit: String(limit) });
  return unwrap(apiGateway.get(`/org/accounts?${params}`));
}

const disconnectAccount = (accountId) => unwrap(apiGateway.delete(`/org/accounts/${accountId}`));

const orgGateway = { requestLoginCode, verifyLoginCode, getOrgs, getAccounts, disconnectAccount };

export default orgGateway;
