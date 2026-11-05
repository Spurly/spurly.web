/**
 * D60: a builder draft is tied to the account it is built for. Pages that hold an unsaved draft mark it here, and the
 * "Acting as" control asks before switching (a switch re-mounts the page, which would silently lose the draft, or
 * silently point it at another account). In-memory only: it describes this page view, nothing is stored.
 */
const dirty = new Set();

export function setDraftDirty(key, on) {
  if (on) dirty.add(key);
  else dirty.delete(key);
}

export const hasDirtyDraft = () => dirty.size > 0;
