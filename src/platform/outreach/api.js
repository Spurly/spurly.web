import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Outreach API Client
 * Talks to /api/outreach — the append-only record of what we actually sent to
 * each person, plus the derived status counts and weekly send budget.
 */
class OutreachApi {
  /** Status counts + weekly connection budget. GET /outreach/summary */
  async getSummary() {
    const res = await apiGateway.get('/outreach/summary');
    return res.data;
  }

  /** Weekly connection budget only. GET /outreach/budget */
  async getBudget() {
    const res = await apiGateway.get('/outreach/budget');
    return res.data;
  }

  /**
   * Full activity history for one person, newest first.
   * GET /outreach/timeline?personId=|profileUrl=
   */
  async getTimeline({ personId, profileUrl, limit = 100 } = {}) {
    const params = { limit };
    if (personId) params.personId = personId;
    if (profileUrl) params.profileUrl = profileUrl;
    const res = await apiGateway.get('/outreach/timeline', { params });
    return res.data;
  }
}

export default new OutreachApi();
