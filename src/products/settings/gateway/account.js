import apiGateway from 'src/shared/gateway/apiGateway.js';
import { Account } from '../entities/account.js';

/**
 * Hub account API client.
 *
 * Talks to /api/hub/account — the user's own LinkedIn account, connected
 * server-side so Spurly can send without the extension or an open browser.
 *
 * Two ways to link:
 *   - native (default): our own sign-in form. The email + password go to
 *     /hub/account/connect, which passes them to LinkedIn's sign-in through
 *     our provider and never stores them; checkpoints (2FA, email/SMS code,
 *     app approval, phone) are answered on /hub/account/connect/checkpoint*.
 *   - hosted (fallback): the provider's own sign-in page, via createLink().
 *     Offered when the native flow fails in a way the user cannot fix, or for
 *     everyone when the server sets account.connectFlow = 'hosted'.
 */

/**
 * A LinkedIn sign-in happens on the provider's servers and can take well over
 * the gateway's default 10s (measured logins run 5-40s). The server caps its
 * own wait at 50s, so this only needs to outlast that.
 */
const SIGN_IN_TIMEOUT_MS = 65000;

/**
 * GET /hub/account — always resolves to a shape, never null. "Not connected"
 * is a normal state with its own UI, not an error.
 */
async function get() {
  const res = await apiGateway.get('/hub/account');
  return Account.fromResponse(res.data?.data?.account ?? null);
}

/**
 * POST /hub/account/link — a short-lived URL on the vendor's sign-in page.
 * Returns { url, mode } where mode is 'create' or 'reconnect'; the server
 * decides which, because reconnecting an existing account and creating a
 * second one are billed differently.
 *
 * `returnTo` is optional and server-allow-listed (see D2) — omit it for the
 * settings page's own default; the onboarding LinkedIn-connect page passes
 * '/onboarding/linkedin' so hosted auth brings the user back to itself
 * instead of the dashboard settings page.
 */
async function createLink(returnTo) {
  const res = await apiGateway.post('/hub/account/link', returnTo ? { returnTo } : {});
  return res.data?.data ?? {};
}

/** POST /hub/account/refresh — reconcile against the vendor. */
async function refresh() {
  const res = await apiGateway.post('/hub/account/refresh');
  return Account.fromResponse(res.data?.data?.account ?? null);
}

/** DELETE /hub/account — unlink, and release the account at the vendor. */
async function disconnect() {
  const res = await apiGateway.delete('/hub/account');
  return res.data?.data ?? {};
}

/**
 * Every native step answers { state: 'connected', account } or
 * { state: 'checkpoint', checkpoint: { type, expiresAt } }. Failures reject
 * with the server body: { message, status, data: { code, fallback } }.
 */
function readStep(res) {
  const data = res.data?.data ?? {};
  return {
    state: data.state ?? null,
    checkpoint: data.checkpoint ?? null,
    account: data.account ? Account.fromResponse(data.account) : null,
  };
}

/**
 * POST /hub/account/connect — start a native sign-in. `input`:
 *   { method: 'credentials', username, password }
 *   { method: 'cookies', accessToken, premiumToken?, userAgent }
 *   plus sync: { chats, messages } and location:
 *   { mode: 'auto' } | { mode: 'country', country } | { mode: 'proxy', proxy: { protocol, host, port, username?, password? } }
 * Never logged, never stored client-side.
 */
async function connectWithCredentials(input) {
  const res = await apiGateway.post('/hub/account/connect', input, { timeout: SIGN_IN_TIMEOUT_MS });
  return readStep(res);
}

/** GET /hub/account/connect/options — e.g. the country "Automatic" location resolves to. */
async function getConnectOptions() {
  const res = await apiGateway.get('/hub/account/connect/options');
  return res.data?.data ?? {};
}

/** POST /hub/account/connect/checkpoint — a code, or a phone number written (+91)9876543210. */
async function solveCheckpoint(code) {
  const res = await apiGateway.post('/hub/account/connect/checkpoint', { code }, { timeout: SIGN_IN_TIMEOUT_MS });
  return readStep(res);
}

/** POST /hub/account/connect/checkpoint/another-way — ask LinkedIn for a different method. */
async function tryAnotherWay() {
  const res = await apiGateway.post('/hub/account/connect/checkpoint/another-way', {}, { timeout: SIGN_IN_TIMEOUT_MS });
  return readStep(res);
}

/** POST /hub/account/connect/checkpoint/resend — send the code / app notification again. */
async function resendCheckpoint() {
  const res = await apiGateway.post('/hub/account/connect/checkpoint/resend', {}, { timeout: SIGN_IN_TIMEOUT_MS });
  return res.data?.data ?? {};
}

/** POST /hub/account/connect/checkpoint/status — poll while waiting on an app approval. */
async function checkpointStatus() {
  const res = await apiGateway.post('/hub/account/connect/checkpoint/status', {}, { timeout: 30000 });
  return readStep(res);
}

const hubAccountGateway = {
  get,
  createLink,
  refresh,
  disconnect,
  connectWithCredentials,
  getConnectOptions,
  solveCheckpoint,
  tryAnotherWay,
  resendCheckpoint,
  checkpointStatus,
};
export default hubAccountGateway;
