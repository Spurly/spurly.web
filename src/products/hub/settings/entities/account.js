/**
 * The hub LinkedIn account, as the UI reads it.
 *
 * Same pass-through shape as the rest of hub's entities — `status`,
 * `connected`, `linkedinName`, `needsReconnect`, `connectionMethod`,
 * `isPremium` and more are all read directly by the settings page today.
 */
export class Account {
  constructor(data = {}) {
    Object.assign(this, data);
    this.raw = data;
  }

  static fromResponse(data) {
    return data ? new Account(data) : null;
  }
}
