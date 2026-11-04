/**
 * Which LinkedIn account of an organization a request acts through.
 *
 * An organization shares one workspace but its LinkedIn accounts keep separate limits, so every account-bound
 * request names the account (`accountId`). The member picks it once (the sidebar switcher) and the gateway adds it
 * to the requests listed here; a page never has to know. Inbox is not listed: it already filters by account itself.
 */
export const ORG_ACTIVE_ACCOUNT_KEY = 'orgActiveAccount';
export const ORG_ACTIVE_ACCOUNT_EVENT = 'org-active-account-changed';

/** Paths (without the /api base, without the query string) whose requests act through one account. */
export const ORG_ACCOUNT_BOUND_PATHS = [
  /^\/hub\/(profile-viewers|invitations|discover|companies|searches|posts)(\/|$)/,
  /^\/hub\/leads\/[^/]+\/(follow|skills|endorse|posts|invitation)(\/|$)/,
  /^\/imported-leads(\/|$)/,
];

/** Create calls that read the account from the request BODY (everything else reads it from the query). */
export const ORG_ACCOUNT_BODY_PATHS = [/^\/hub\/campaigns$/, /^\/hub\/sequences$/];
