/**
 * A hub lead, as the UI reads it.
 *
 * Same shape decision as Campaign (see entities/campaign.js in this product):
 * a thin Object.assign pass-through rather than an enumerated field list, so
 * every field the server sends — including ones added later — reaches the UI
 * without a matching edit here. `raw` is the untouched response, for CSV
 * export and anything else that wants it unmodified.
 */
export class Lead {
  constructor(data = {}) {
    Object.assign(this, data);
    this.raw = data;
  }

  static fromResponse(data) {
    return data ? new Lead(data) : null;
  }

  static fromList(list = []) {
    return list.map(Lead.fromResponse);
  }
}
