import connectionsGateway from '../gateway/connections.js';
import { Profile } from 'src/platform/people/entities/Profile.js';

/**
 * Connections Controller
 * Business-logic orchestration between the UI/hook layer and the gateway.
 * Components/hooks should call this, never the gateway directly.
 */
class ConnectionsController {
  /**
   * Fetch a page of the user's connections.
   * @returns {Promise<{ connections, pagination }>}
   */
  async getConnections({ limit = 100, skip = 0, search, sortBy, sortDir } = {}) {
    const res = await connectionsGateway.getConnections({ limit, skip, search, sortBy, sortDir });

    if (!res?.success || !res?.data) {
      throw new Error(res?.message || 'Failed to fetch connections');
    }

    const raw = res.data.connections || [];
    return {
      connections: res.data.entities || Profile.fromList(raw),
      pagination: res.data.pagination || {
        limit,
        skip,
        total: 0,
        pages: 0,
        hasMore: false,
      },
    };
  }

  /** @returns {Promise<{ total: number }>} */
  async getStatistics() {
    const res = await connectionsGateway.getStatistics();
    if (!res?.success || !res?.data) {
      throw new Error(res?.message || 'Failed to fetch connection statistics');
    }
    return res.data.statistics || { total: 0 };
  }
}

export const connectionsController = new ConnectionsController();
export default connectionsController;
