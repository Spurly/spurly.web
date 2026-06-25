import profilesApi from 'src/core/gateway/profilesApi.js';
import { Profile } from 'src/core/entities/Profile.js';

/**
 * CapturedLeads Controller
 * Business-logic orchestration between the UI/hook layer and the API layer.
 * Components/hooks should call this, never the API directly.
 */
class CapturedLeadsController {
  /**
   * Fetch a page of captured leads.
   * @returns {Promise<{ profiles, pagination }>}
   */
  async getAllProfiles({ limit = 100, skip = 0, connectionDegree, search } = {}) {
    const res = await profilesApi.getAllProfiles({ limit, skip, connectionDegree, search });

    if (!res?.success || !res?.data) {
      throw new Error(res?.message || 'Failed to fetch profiles');
    }

    const raw = res.data.entities || res.data.profiles || [];
    return {
      profiles: Profile.fromList(raw),
      pagination: res.data.pagination || {
        limit,
        skip,
        total: 0,
        pages: 0,
        hasMore: false,
      },
    };
  }

  async getRecentCaptures({ limit = 100, skip = 0 } = {}) {
    const res = await profilesApi.getAllProfiles({
      limit,
      skip,
      latestSessionOnly: true,
      sortOrder: 'desc',
    });

    if (!res?.success || !res?.data) {
      throw new Error(res?.message || 'Failed to fetch recent captures');
    }

    const raw = res.data.entities || res.data.profiles || [];
    return {
      profiles: Profile.fromList(raw),
      pagination: res.data.pagination || { limit, skip: 0, total: 0, pages: 0, hasMore: false },
    };
  }

  async getProfilesBySession(sessionId) {
    return profilesApi.getProfilesBySession(sessionId);
  }
}

export default new CapturedLeadsController();
