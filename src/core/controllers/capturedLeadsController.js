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

    // profilesApi already builds `entities` by wrapping the raw `profiles`
    // JSON in `Profile` instances once. Re-wrapping `entities` here (as this
    // used to do via `Profile.fromList(res.data.entities || res.data.profiles)`)
    // ran a *second* Profile constructor pass over already-built Profile
    // objects instead of the raw JSON. Fields the constructor renames
    // (profileUrl -> linkedInUrl, _captureStatus -> enrichmentStatus) don't
    // exist under their original key on a first-pass Profile instance, and
    // fields kept only in `.raw` (experiences, _captureStatus, profileUrl)
    // vanished entirely because `.raw` ended up pointing at the first-pass
    // Profile object, not the true backend payload — which is exactly why
    // `row.raw.profileUrl` was undefined in CSV export. Build from the raw
    // JSON array directly instead.
    const rawProfiles = res.data.profiles || [];
    return {
      profiles: res.data.entities || Profile.fromList(rawProfiles),
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

    // See getAllProfiles() above — avoid double-wrapping already-built entities.
    const rawProfiles = res.data.profiles || [];
    return {
      profiles: res.data.entities || Profile.fromList(rawProfiles),
      pagination: res.data.pagination || { limit, skip: 0, total: 0, pages: 0, hasMore: false },
    };
  }

  async getProfilesBySession(sessionId) {
    return profilesApi.getProfilesBySession(sessionId);
  }
}

export default new CapturedLeadsController();
