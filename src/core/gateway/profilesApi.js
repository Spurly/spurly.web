import apiGateway from 'src/core/gateway/apiGateway.js';
import { Profile } from 'src/core/entities/Profile.js';

/**
 * Profiles API Client (CapturedLeads domain)
 * Endpoint-specific calls. Wraps responses in Profile entities.
 */
class ProfilesApi {
  /**
   * Get all profiles across all sessions (optimized endpoint).
   * Returns the raw envelope plus an `entities` array of Profile instances.
   */
  async getAllProfiles({ limit = 100, skip = 0, latestSessionOnly, sortOrder, connectionDegree, search } = {}) {
    const params = { limit, skip };
    if (latestSessionOnly !== undefined) params.latestSessionOnly = latestSessionOnly;
    if (sortOrder !== undefined) params.sortOrder = sortOrder;
    if (connectionDegree !== undefined && connectionDegree !== null) params.connectionDegree = connectionDegree;
    if (search && search.trim()) params.search = search.trim();

    const response = await apiGateway.get('/profiles/all', { params });
    const payload = response.data;
    if (payload?.success && payload?.data?.profiles) {
      payload.data.entities = Profile.fromList(payload.data.profiles);
    }
    return payload;
  }

  /** Get profiles for a specific session. */
  async getProfilesBySession(sessionId) {
    const response = await apiGateway.get(`/profiles/session/${sessionId}`);
    return response.data;
  }
}

export default new ProfilesApi();
