import apiGateway from 'src/shared/gateway/apiGateway.js';
import { Profile } from 'src/platform/people/Profile.js';

/**
 * People API Client
 * The app is now a single flat "People" list per user — no sessions. Rows are
 * still wrapped in `Profile` entities so the existing table/UI components keep
 * their stable shape.
 */
class PeopleApi {
  /**
   * Get a page of the user's People list.
   * GET /people  Query: { limit, skip, connectionDegree?, search?, outreachStatus?, sort? }
   * Returns the raw envelope plus `entities` (Profile instances) and a
   * `profiles` alias so callers written against the old profiles API keep working.
   */
  async getPeople({
    limit = 100,
    skip = 0,
    connectionDegree,
    search,
    outreachStatus,
    sort,
    sortBy,
    sortDir,
  } = {}) {
    const params = { limit, skip };
    if (connectionDegree !== undefined && connectionDegree !== null) {
      params.connectionDegree = connectionDegree;
    }
    if (search && search.trim()) params.search = search.trim();
    // Outreach status filter chips. 'all' means "no filter" — don't send it.
    if (outreachStatus && outreachStatus !== 'all') params.outreachStatus = outreachStatus;
    if (sort) params.sort = sort;
    // Column sort from a clicked table header. Both must be present — a key
    // with no direction is meaningless and the server would default it.
    if (sortBy && sortDir) {
      params.sortBy = sortBy;
      params.sortDir = sortDir;
    }

    const response = await apiGateway.get('/people', { params });
    const payload = response.data;

    if (payload?.success && payload?.data?.people) {
      // Alias `people` -> `profiles` and build Profile entities so the rest of
      // the UI (columns keyed on linkedInUrl/name/etc.) works unchanged.
      payload.data.profiles = payload.data.people;
      payload.data.entities = Profile.fromList(payload.data.people);
    }
    return payload;
  }

  /**
   * Push (upsert) a batch of people into the user's list.
   * POST /people/batch  Body: { people: [{ name, title, company, location, profileUrl, source, connectionDegree }] }
   */
  async pushPeople(people) {
    const response = await apiGateway.post('/people/batch', { people });
    return response.data;
  }

  /** Dashboard statistics. GET /people/statistics */
  async getStatistics() {
    const response = await apiGateway.get('/people/statistics');
    return response.data;
  }

  /**
   * Save the user's free-text note on one person.
   * PATCH /people/:personId/notes  Body: { notes }  ("" clears it)
   * Returns the envelope; `data.notes` is the STORED (trimmed) value.
   */
  async updateNotes(personId, notes) {
    const response = await apiGateway.patch(`/people/${personId}/notes`, { notes });
    return response.data;
  }

  /** Delete a single person. DELETE /people/:personId */
  async deletePerson(personId) {
    const response = await apiGateway.delete(`/people/${personId}`);
    return response.data;
  }
}

export default new PeopleApi();
