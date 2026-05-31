import apiGateway from 'src/gateway/apiGateway.js';
import { Profile } from 'src/capturedleads/entities/Profile.js';

/**
 * Profiles API Client (CapturedLeads domain)
 * Endpoint-specific calls. Wraps responses in Profile entities.
 */
class ProfilesApi {
  /**
   * Get all profiles across all sessions (optimized endpoint).
   * Returns the raw envelope plus an `entities` array of Profile instances.
   */
  async getAllProfiles({ limit = 100, skip = 0, latestSessionOnly, sortOrder } = {}) {
    const params = { limit, skip };
    if (latestSessionOnly !== undefined) params.latestSessionOnly = latestSessionOnly;
    if (sortOrder !== undefined) params.sortOrder = sortOrder;

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
