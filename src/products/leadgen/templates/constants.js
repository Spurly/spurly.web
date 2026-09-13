/**
 * LinkedIn truncates invitation notes at 200 characters. The Campaign schema
 * allows 300, so this is a soft warning in the editor rather than a hard cap.
 */
export const CONNECTION_NOTE_SOFT_LIMIT = 200;

/** Field length caps enforced client-side in the template editor. */
export const NAME_MAX = 100;
export const SUBJECT_MAX = 200;
export const CONTENT_MAX = 5000;
export const DESCRIPTION_MAX = 500;
