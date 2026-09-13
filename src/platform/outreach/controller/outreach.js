import outreachGateway from '../gateway/outreach.js';

/**
 * Outreach Controller
 * Unwraps the { success, message, data } envelope so hooks and components
 * never touch the transport shape. Components/hooks call this, never the API.
 */
class OutreachController {
  /** @returns {Promise<Object>} { total, statusCounts, contacted, needsAttention, connectionBudget, messagesThisWeek } */
  async getSummary() {
    const res = await outreachGateway.getSummary();
    if (!res?.success || !res?.data?.summary) {
      throw new Error(res?.message || 'Failed to load outreach summary');
    }
    return res.data.summary;
  }

  /** @returns {Promise<Object>} { weekUsed, dayUsed, weeklyLimit, weeklyRemaining, resetsAt } */
  async getBudget() {
    const res = await outreachGateway.getBudget();
    if (!res?.success || !res?.data?.budget) {
      throw new Error(res?.message || 'Failed to load connection budget');
    }
    return res.data.budget;
  }

  /** @returns {Promise<Array>} outreach events, newest first */
  async getTimeline({ personId, profileUrl, limit } = {}) {
    const res = await outreachGateway.getTimeline({ personId, profileUrl, limit });
    if (!res?.success || !res?.data) {
      throw new Error(res?.message || 'Failed to load outreach timeline');
    }
    return res.data.events || [];
  }
}

export const outreachController = new OutreachController();
export default outreachController;
