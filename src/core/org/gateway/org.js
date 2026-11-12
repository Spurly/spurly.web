import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Org gateway.
 *   POST   /org/login/request   { email }          -> { sent }
 *   POST   /org/login/verify    { email, code }    -> { token, user: { id, name, email }, orgs }
 *   POST   /org/login/password  { email, password }       -> { token, user, orgs }   (optional password sign-in)
 *   POST   /org/login/reset-password { email, code, password } -> { token, user, orgs }   (sets the password with the emailed code)
 *   POST   /org/login/exchange  { ticket }         -> { token, user, orgs, orgId, accountId }   ("Open in Spurly" one-time link)
 *   GET    /org                                     -> { orgs, isMember, features }   (members only)
 *   GET    /org/state                               -> { isMember, features }          (any signed-in user)
 *   PATCH  /org/workspace                           { orgId, enabled }  -> { id, workspaceEnabled, changed }   (owners only)
 *   GET    /org/accounts        ?orgId&page&limit   -> { items, total, page, limit }
 *   DELETE /org/accounts/:accountId                 -> { ... }
 *   POST   /org/accounts/connect                    { orgId, method, ... }   -> { state, account | connectId, checkpoint }
 *   POST   /org/accounts/connect/checkpoint         { orgId, connectId, code }
 *   POST   /org/accounts/connect/checkpoint/another-way | /resend   { orgId, connectId }
 *   GET    /org/accounts/connect/status             ?orgId&connectId
 */

/** The API answers { message, error: CODE }; network failures arrive with status 0. */
function toError(error) {
  if (error?.status === 0) return { status: 0, message: 'Cannot reach server - check your connection', code: 'NETWORK_ERROR' };
  const code = error?.error || error?.code || 'ERROR';
  // `data` is the shape the LinkedIn sign-in dialog reads its errors from.
  return { status: error?.status || 500, message: error?.message || 'Something went wrong', code, data: { code, field: error?.field ?? null } };
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
const passwordLogin = (email, password) => unwrap(apiGateway.post('/org/login/password', { email, password }));
const resetPassword = (email, code, password) => unwrap(apiGateway.post('/org/login/reset-password', { email, code, password }));
/** 🔴 The ticket is a one-time secret: sent once, never logged or kept. */
const exchangeLoginTicket = (ticket) => unwrap(apiGateway.post('/org/login/exchange', { ticket }));
const getOrgs = () => unwrap(apiGateway.get('/org'));
const getState = () => unwrap(apiGateway.get('/org/state'));

function getAccounts({ orgId, page = 1, limit = 50 }) {
  const params = new URLSearchParams({ orgId, page: String(page), limit: String(limit) });
  return unwrap(apiGateway.get(`/org/accounts?${params}`));
}

const disconnectAccount = (accountId) => unwrap(apiGateway.delete(`/org/accounts/${accountId}`));

const setWorkspace = (orgId, enabled) => unwrap(apiGateway.patch('/org/workspace', { orgId, enabled }));

/** A LinkedIn sign-in happens on the provider's servers and can take well over the default timeout. */
const SIGN_IN_TIMEOUT_MS = 65000;
const SIGN_IN = { timeout: SIGN_IN_TIMEOUT_MS };

/** 🔴 `input` carries a LinkedIn password or cookie: sent once, never logged or kept. */
const connectAccount = (orgId, input, accountId) => unwrap(
  apiGateway.post('/org/accounts/connect', { ...input, orgId, ...(accountId ? { accountId } : {}) }, SIGN_IN),
);
const solveCheckpoint = (orgId, connectId, code) => unwrap(apiGateway.post('/org/accounts/connect/checkpoint', { orgId, connectId, code }, SIGN_IN));
const tryAnotherWay = (orgId, connectId) => unwrap(apiGateway.post('/org/accounts/connect/checkpoint/another-way', { orgId, connectId }, SIGN_IN));
const resendCheckpoint = (orgId, connectId) => unwrap(apiGateway.post('/org/accounts/connect/checkpoint/resend', { orgId, connectId }, SIGN_IN));
const connectStatus = (orgId, connectId) => unwrap(
  apiGateway.get(`/org/accounts/connect/status?${new URLSearchParams({ orgId, connectId })}`, { timeout: 30000 }),
);

const orgGateway = {
  requestLoginCode, verifyLoginCode, passwordLogin, resetPassword, exchangeLoginTicket, getOrgs, getState, getAccounts, disconnectAccount, setWorkspace,
  connectAccount, solveCheckpoint, tryAnotherWay, resendCheckpoint, connectStatus,
};

export default orgGateway;
