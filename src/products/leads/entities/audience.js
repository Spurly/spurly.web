/**
 * A saved audience ("search"), as the UI reads it.
 *
 * Same pass-through shape as Lead and Campaign — see entities/lead.js for
 * why. An audience row carries `_id`, `name`, `status`, `mode`, `searchUrl`,
 * `filters`, `importedCount` and more, all read directly by AudienceList and
 * the leads page today.
 */
function createAudience(data = {}) {
  return { ...data, raw: data };
}

export const Audience = {
  fromResponse(data) {
    return data ? createAudience(data) : null;
  },
  fromList(list = []) {
    return list.map(Audience.fromResponse);
  },
};
