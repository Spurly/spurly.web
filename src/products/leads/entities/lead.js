/**
 * A hub lead, as the UI reads it.
 *
 * Same shape decision as Campaign (see entities/campaign.js in this product):
 * a thin spread pass-through rather than an enumerated field list, so
 * every field the server sends — including ones added later — reaches the UI
 * without a matching edit here. `raw` is the untouched response, for CSV
 * export and anything else that wants it unmodified.
 */
function createLead(data = {}) {
  return { ...data, raw: data };
}

export const Lead = {
  fromResponse(data) {
    return data ? createLead(data) : null;
  },
  fromList(list = []) {
    return list.map(Lead.fromResponse);
  },
};
