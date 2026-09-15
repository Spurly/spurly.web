/**
 * A hub sequence, as the UI reads it.
 *
 * Same pass-through shape as Campaign/Lead/Audience — see
 * hub/campaigns/entities/campaign.js for why: `_id`, `name`, `status`,
 * `steps`, `pausedReason`, `error` and more are all read directly by the
 * pages today, and a thin Object.assign means nothing is missing on day one.
 */
export class Sequence {
  constructor(data = {}) {
    Object.assign(this, data);
    this.raw = data;
  }

  static fromResponse(data) {
    return data ? new Sequence(data) : null;
  }

  static fromList(list = []) {
    return list.map(Sequence.fromResponse);
  }
}
