import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * Research API Client
 *
 * Talks to /api/research — live web research about a lead and their company,
 * run by Groq's Compound system (web search executed server-side).
 *
 * Read and write are separate calls on purpose. Research takes seconds, spends
 * a daily quota and may cost credits, so it must never happen as a side effect
 * of opening a lead — `get` is the free read, `run` is the deliberate act.
 */

/**
 * Much longer than the message writer's 45s. Compound performs real HTTP
 * fetches inside a single completion, and the server allows 60s for that, so a
 * client giving up sooner would abandon a request that is about to succeed.
 */
const RESEARCH_TIMEOUT_MS = 90000;

class ResearchApi {
  /** GET /research/status — availability and remaining daily quota */
  async status() {
    const res = await apiGateway.get('/research/status');
    return res.data;
  }

  /** GET /research/:personId — existing briefing, or data:null if never run */
  async get(personId) {
    const res = await apiGateway.get(`/research/${personId}`);
    return res.data;
  }

  /**
   * POST /research/:personId — run it.
   * @param {string} personId
   * @param {boolean} [refresh] - bypass the cached briefing
   */
  async run(personId, refresh = false) {
    const res = await apiGateway.post(
      `/research/${personId}`,
      { refresh },
      { timeout: RESEARCH_TIMEOUT_MS },
    );
    return res.data;
  }
}

export default new ResearchApi();
