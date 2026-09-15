/**
 * Poll interval while an enrichment campaign is still running.
 *
 * Shorter than campaigns' 10s: a single enrichment resolve is a couple of
 * seconds to tens of seconds (sourcing/service.js), not the "a handful an
 * hour" pace of a paced outreach send, so a batch of even 20-30 leads is
 * usually done inside a minute or two and a slower poll would make the page
 * feel stuck.
 */
export const POLL_MS = 4000;
