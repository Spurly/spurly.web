/**
 * A hub campaign, as the UI reads it.
 *
 * Deliberately a thin pass-through rather than an enumerated field list: the
 * server response carries `_id`, `name`, `status`, `note`, `counts`,
 * `pausedReason`, `error` and more, all read directly by the pages today.
 * Naming each one here would be one more place a new server field has to be
 * added before the UI can see it — `raw` already exists for exactly that
 * escape hatch, and copying every enumerable field onto the instance means
 * nothing is missing from day one either.
 */
export class Campaign {
  constructor(data = {}) {
    Object.assign(this, data);
    // Always preserve the raw payload for anything not copied above, and for
    // callers (CSV export, the outreach log) that want the untouched response.
    this.raw = data;
  }

  static fromResponse(data) {
    return data ? new Campaign(data) : null;
  }

  static fromList(list = []) {
    return list.map(Campaign.fromResponse);
  }
}
