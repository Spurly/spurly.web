import apiGateway from 'src/core/gateway/apiGateway.js';

/**
 * Personalization API Client
 *
 * Talks to /api/personalization — the AI writing endpoints backed by the
 * Cerebras -> Groq -> Gemini fallback chain.
 *
 * The AI writes TEMPLATES containing {{tokens}}, never per-recipient messages.
 * The extension fills those tokens per person at send time, exactly as it
 * already did, so nothing here touches the sending path.
 *
 * Generation is slower than the rest of the API (a model call, plus a possible
 * failover to a second provider), so those requests carry their own timeout
 * rather than the gateway's 10s default — the backend caps each provider
 * attempt at 15s and may try three, so a client giving up at 10s would abandon
 * requests the server is about to answer.
 */

const GENERATE_TIMEOUT_MS = 45000;

class PersonalizationApi {
  /** GET /personalization/status — providers, quota, whether context is set */
  async status() {
    const res = await apiGateway.get('/personalization/status');
    return res.data;
  }

  /** GET /personalization/context — the user's saved "Context for Spurly" */
  async getContext() {
    const res = await apiGateway.get('/personalization/context');
    return res.data;
  }

  /**
   * PUT /personalization/context — partial save
   * @param {Object} patch - any of whatWeDo, targetAudience, outreachGoal,
   *                         voiceRules, defaultTone
   */
  async updateContext(patch) {
    const res = await apiGateway.put('/personalization/context', patch);
    return res.data;
  }

  /**
   * POST /personalization/compose
   *
   * One endpoint for both writing and improving: an empty `content` means
   * "write me one", non-empty means "improve this". The server decides, so the
   * caller doesn't have to branch.
   *
   * @param {Object} payload
   * @param {string} [payload.content]
   * @param {'CONNECTION_REQUEST'|'DIRECT_MESSAGE'} payload.type
   * @param {string} [payload.templateId]
   * @param {string} [payload.tone]
   * @param {string} [payload.instruction]
   * @param {boolean} [payload.regenerate]
   */
  async compose(payload) {
    const res = await apiGateway.post('/personalization/compose', payload, {
      timeout: GENERATE_TIMEOUT_MS,
    });
    return res.data;
  }
}

export default new PersonalizationApi();
