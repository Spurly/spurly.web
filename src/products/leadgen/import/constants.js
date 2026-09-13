/** Staging table page size. */
export const DEFAULT_LIMIT = 50;

/**
 * Most leads the extension will drain in one run. Mirrors MAX_ENRICH_QUEUE in
 * the backend's importedLeads service — the server enforces it, this is here
 * so the user gets told before making the request.
 */
export const MAX_ENRICH_PER_RUN = 500;
