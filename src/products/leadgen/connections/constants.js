/**
 * How often "Sync now" re-asks the extension whether the sweep has finished.
 * 2s: the sweep itself runs for minutes, so this only needs to be fast enough
 * that the button doesn't feel stuck once the extension actually answers.
 */
export const POLL_MS = 2000;

/** Debounce for the connections search box before it hits the server. */
export const SEARCH_DEBOUNCE_MS = 350;
