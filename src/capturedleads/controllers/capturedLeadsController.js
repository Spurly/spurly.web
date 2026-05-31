import profilesApi from 'src/capturedleads/gateway/profilesApi.js';

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
  async getAllProfiles({ limit = 100, skip = 0 } = {}) {
    const res = await profilesApi.getAllProfiles({ limit, skip });

    if (!res?.success || !res?.data) {
      throw new Error(res?.message || 'Failed to fetch profiles');
    }

    return {
      profiles: res.data.entities || res.data.profiles || [],
      pagination: res.data.pagination || {
        limit,
        skip,
        total: 0,
        pages: 0,
        hasMore: false,
      },
    };
  }

  /**
   * Fetch the most recent captures (latest session, newest first).
   * @param {number} limit - Results per page (default: 100)
   * @param {number} skip - Skip N results for pagination (default: 0)
   * @returns {Promise<{ profiles, pagination }>}
   */
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

    return {
      profiles: res.data.entities || res.data.profiles || [],
      pagination: res.data.pagination || { limit, skip: 0, total: 0, pages: 0, hasMore: false },
    };
  }

  async getProfilesBySession(sessionId) {
    return profilesApi.getProfilesBySession(sessionId);
  }
}

export default new CapturedLeadsController();
