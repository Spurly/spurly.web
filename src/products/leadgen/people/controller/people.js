import peopleGateway from '../gateway/people.js';
import { Profile } from '../entities/Profile.js';

/**
 * CapturedLeads Controller
 * Business-logic orchestration between the UI/hook layer and the API layer.
 * Components/hooks should call this, never the API directly.
 *
 * The app is now a single flat People list per user (no sessions), so every
 * read goes through the People API.
 */
class CapturedLeadsController {
  /**
   * Fetch a page of the People list.
   * @returns {Promise<{ profiles, pagination }>}
   */
  async getAllProfiles({
    limit = 100,
    skip = 0,
    connectionDegree,
    search,
    outreachStatus,
    sort,
    sortBy,
    sortDir,
  } = {}) {
    const res = await peopleGateway.getPeople({
      limit,
      skip,
      connectionDegree,
      search,
      outreachStatus,
      sort,
      sortBy,
      sortDir,
    });

    if (!res?.success || !res?.data) {
      throw new Error(res?.message || 'Failed to fetch people');
    }

    const rawProfiles = res.data.people || res.data.profiles || [];
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

  /**
   * Save the user's note on one person.
   *
   * Resolves to the value the SERVER stored, not the value we sent: the
   * backend trims, so echoing our own input back into the table would leave the
   * row showing something a reload would contradict.
   *
   * @param {string} personId
   * @param {string} notes - '' clears the note.
   * @returns {Promise<string>} the stored note
   */
  async updateNotes(personId, notes) {
    if (!personId) throw new Error('personId is required');

    const res = await peopleGateway.updateNotes(personId, notes ?? '');
    if (!res?.success) {
      throw new Error(res?.message || 'Failed to save notes');
    }
    return res.data?.notes ?? '';
  }

  /**
   * Dashboard statistics (captures/enriched/verified-email counts, this
   * week vs last week, connection-degree breakdown, top titles).
   * @returns {Promise<Object>} statistics
   */
  async getStatistics() {
    const res = await peopleGateway.getStatistics();
    if (!res?.success || !res?.data?.statistics) {
      throw new Error(res?.message || 'Failed to fetch metrics');
    }
    return res.data.statistics;
  }

  /**
   * Recent captures = the newest rows of the flat list (no "latest session"
   * concept anymore). Server already sorts People by createdAt desc.
   */
  async getRecentCaptures({ limit = 100, skip = 0 } = {}) {
    const res = await peopleGateway.getPeople({ limit, skip });

    if (!res?.success || !res?.data) {
      throw new Error(res?.message || 'Failed to fetch recent captures');
    }

    const rawProfiles = res.data.people || res.data.profiles || [];
    return {
      profiles: res.data.entities || Profile.fromList(rawProfiles),
      pagination: res.data.pagination || { limit, skip: 0, total: 0, pages: 0, hasMore: false },
    };
  }
}

export const peopleController = new CapturedLeadsController();
export default peopleController;
