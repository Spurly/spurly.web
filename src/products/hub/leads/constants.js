/** Leads table page size — matches the server's own default limit. */
export const PAGE_SIZE = 50;

/**
 * Poll interval while an audience is actively importing (queued/running).
 * 5s: importing leans on a background LinkedIn crawl a user is often
 * watching in real time, so this stays faster than campaigns/sequences'
 * 10s poll, which watches a paced send instead.
 */
export const POLL_MS = 5000;
