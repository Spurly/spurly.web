import apiGateway from 'src/shared/gateway/apiGateway.js';
import { Profile } from 'src/platform/people/Profile.js';

/**
 * Connections API Client
 *
 * The user's own LinkedIn network, scraped from their connections page and
 * stored in a separate collection from People (see
 * spurly.backend/src/features/connections). This is a roster, not an outreach
 * pipeline — there is deliberately no status, campaign or outreach call here.
 *
 * Rows are still wrapped in `Profile` entities so the shared DataTable cells
 * (name, company, email, skills) work unchanged.
 */
class ConnectionsApi {
  /**
   * Get a page of the user's connections.
   * GET /connections  Query: { limit, skip, search?, sortBy?, sortDir? }
   */
  async getConnections({ limit = 100, skip = 0, search, sortBy, sortDir } = {}) {
    const params = { limit, skip };
    if (search && search.trim()) params.search = search.trim();
    // Both must be present — a key with no direction is meaningless and the
    // server would just default it.
    if (sortBy && sortDir) {
      params.sortBy = sortBy;
      params.sortDir = sortDir;
    }

    const response = await apiGateway.get('/connections', { params });
    const payload = response.data;

    if (payload?.success && payload?.data?.connections) {
      payload.data.entities = Profile.fromList(payload.data.connections);
    }
    return payload;
  }

  /** Header counts. GET /connections/statistics */
  async getStatistics() {
    const response = await apiGateway.get('/connections/statistics');
    return response.data;
  }

  /** Delete a single connection. DELETE /connections/:connectionId */
  async deleteConnection(connectionId) {
    const response = await apiGateway.delete(`/connections/${connectionId}`);
    return response.data;
  }
}

export default new ConnectionsApi();
