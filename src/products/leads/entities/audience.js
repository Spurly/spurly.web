/**
 * A saved audience ("search"), as the UI reads it.
 *
 * Same pass-through shape as Lead and Campaign — see entities/lead.js for
 * why. An audience row carries `_id`, `name`, `status`, `mode`, `searchUrl`,
 * `filters`, `importedCount` and more, all read directly by AudienceList and
 * the leads page today.
 */
export class Audience {
  constructor(data = {}) {
    Object.assign(this, data);
    this.raw = data;
  }

  static fromResponse(data) {
    return data ? new Audience(data) : null;
  }

  static fromList(list = []) {
    return list.map(Audience.fromResponse);
  }
}
