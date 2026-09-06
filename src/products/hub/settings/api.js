import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Hub account API client.
 *
 * Talks to /api/hub/account — the user's own LinkedIn account, connected
 * server-side so Spurly can send without the extension or an open browser.
 *
 * Linking deliberately happens on the vendor's hosted page rather than in a
 * form here. The user's LinkedIn password and session cookie never reach
 * Spurly, which is the entire reason that flow was chosen — so there is no
 * "credentials" endpoint in this file, and there should never be one.
 */
class HubAccountApi {
  /**
   * GET /hub/account — always resolves to a shape, never null. "Not connected"
   * is a normal state with its own UI, not an error.
   */
  async get() {
    const res = await apiGateway.get('/hub/account');
    return res.data?.data?.account ?? null;
  }

  /**
   * POST /hub/account/link — a short-lived URL on the vendor's sign-in page.
   * Returns { url, mode } where mode is 'create' or 'reconnect'; the server
   * decides which, because reconnecting an existing account and creating a
   * second one are billed differently.
   */
  async createLink() {
    const res = await apiGateway.post('/hub/account/link');
    return res.data?.data ?? {};
  }

  /** POST /hub/account/refresh — reconcile against the vendor. */
  async refresh() {
    const res = await apiGateway.post('/hub/account/refresh');
    return res.data?.data?.account ?? null;
  }

  /** DELETE /hub/account — unlink, and release the account at the vendor. */
  async disconnect() {
    const res = await apiGateway.delete('/hub/account');
    return res.data?.data ?? {};
  }
}

export const hubAccountApi = new HubAccountApi();
export default hubAccountApi;
