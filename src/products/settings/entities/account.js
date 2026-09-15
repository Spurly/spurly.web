/**
 * The hub LinkedIn account, as the UI reads it.
 *
 * Same pass-through shape as the rest of hub's entities — `status`,
 * `connected`, `linkedinName`, `needsReconnect`, `connectionMethod`,
 * `isPremium` and more are all read directly by the settings page today.
 */
function createAccount(data = {}) {
  return { ...data, raw: data };
}

export const Account = {
  fromResponse(data) {
    return data ? createAccount(data) : null;
  },
};
