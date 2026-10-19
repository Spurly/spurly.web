/**
 * The owner's LinkedIn profile as the "this is you" screen reads it:
 *   { connected, checking, snapshot, checkedAt, error, profile, suggestions, icp }
 * `snapshot` is null until the server's first read lands; `profile` is the
 * account's /users/me copy (the picture lives there, not on the snapshot);
 * `suggestions` are tappable starting points for the ICP, never pre-selected.
 * Pass-through like the rest of hub's entities, with `icp` and `suggestions`
 * guaranteed to be shaped so the form never reads a missing list.
 */
const EMPTY_LISTS = { roles: [], industries: [], locations: [], companySizes: [] };

function createLinkedInProfile(data = {}) {
  return {
    ...data,
    suggestions: { ...EMPTY_LISTS, ...(data.suggestions ?? {}) },
    icp: { ...EMPTY_LISTS, notes: '', ...(data.icp ?? {}) },
    raw: data,
  };
}

export const LinkedInProfile = {
  fromResponse(data) {
    return data && typeof data === 'object' && !Array.isArray(data) ? createLinkedInProfile(data) : null;
  },
};
