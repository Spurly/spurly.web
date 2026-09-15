/**
 * A hub sequence, as the UI reads it.
 *
 * Same pass-through shape as Campaign/Lead/Audience — see
 * hub/campaigns/entities/campaign.js for why: `_id`, `name`, `status`,
 * `steps`, `pausedReason`, `error` and more are all read directly by the
 * pages today, and a thin spread means nothing is missing on day one.
 */
function createSequence(data = {}) {
  return { ...data, raw: data };
}

export const Sequence = {
  fromResponse(data) {
    return data ? createSequence(data) : null;
  },
  fromList(list = []) {
    return list.map(Sequence.fromResponse);
  },
};
