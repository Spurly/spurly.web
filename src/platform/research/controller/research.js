import researchGateway from '../gateway/research.js';

/**
 * Research Controller
 * Unwraps the { success, message, data } envelope so hooks and components
 * never touch the transport shape. Components/hooks call this, never the
 * gateway.
 */
function unwrap(res, fallback) {
  if (!res?.success) throw new Error(res?.message || fallback);
  return res.data;
}

class ResearchController {
  /** Availability and remaining daily quota. */
  async status() {
    const res = await researchGateway.status();
    return unwrap(res, 'Failed to load research status');
  }

  /** Existing briefing, or null if never run. Free read — no throw on a
   * missing/failed briefing, since opening a lead should never surface a
   * scary error just because there's nothing cached yet. */
  async get(personId) {
    const res = await researchGateway.get(personId);
    return res?.data ?? null;
  }

  /** Run (or refresh) the briefing. Deliberate act — throws on failure so
   * the caller can show what went wrong. */
  async run(personId, refresh = false) {
    const res = await researchGateway.run(personId, refresh);
    return unwrap(res, 'Research failed');
  }
}

export const researchController = new ResearchController();
export default researchController;
