/**
 * The connected LinkedIn account's health, as the card reads it: who is
 * connected and what their plan can do. Pass-through like the rest of hub's
 * entities. `capabilities` is null until the server's first check lands, and
 * every flag inside it is true / false / null — null means "LinkedIn did not
 * say", which the card must not render as "no".
 */
function createAccountHealth(data = {}) {
  return { ...data, raw: data };
}

export const AccountHealth = {
  fromResponse(data) {
    return data && typeof data === 'object' && !Array.isArray(data) ? createAccountHealth(data) : null;
  },
};
