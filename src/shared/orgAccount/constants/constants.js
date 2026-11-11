/**
 * Which LinkedIn account of an organization a request acts through.
 *
 * An organization shares one workspace but its LinkedIn accounts keep separate limits, so every account-bound
 * request names the account (`accountId`). The member picks it once (the sidebar switcher) and the gateway adds it
 * to the requests listed here; a page never has to know. Inbox is not listed: it already filters by account itself.
 */
export const ORG_ACTIVE_ACCOUNT_KEY = 'orgActiveAccount';
export const ORG_ACTIVE_ACCOUNT_EVENT = 'org-active-account-changed';
/** The member's usable accounts as last seen, so the default choice is known before any page asks. */
export const ORG_KNOWN_ACCOUNTS_KEY = 'orgKnownAccounts';

/** Paths (without the /api base, without the query string) whose requests act through one account. */
export const ORG_ACCOUNT_BOUND_PATHS = [
  /^\/hub\/(profile-viewers|invitations|discover|companies|searches|posts|network|audience|sourcing)(\/|$)/,
  /^\/hub\/leads\/[^/]+\/(follow|skills|endorse|posts|invitation|profile)(\/|$)/,
  /^\/hub\/leads\/enrich\/queue$/,
  // Account isolation: the lists an account works are its own, so these carry the account too.
  /^\/hub\/(leads|lead-companies|lists|campaigns|sequences)$/,
  /^\/imported-leads(\/|$)/,
  // D59: the sidebar counts follow the acting account.
  /^\/hub\/summary(\/dashboard)?$/,
];

/** Create calls that read the account from the request BODY (everything else reads it from the query). */
export const ORG_ACCOUNT_BODY_PATHS = [/^\/hub\/campaigns$/, /^\/hub\/sequences$/, /^\/hub\/network\/sync$/];

/**
 * "All accounts" view: on these pages the member may look at every account's data at once (no account is sent on the
 * list reads below). Everywhere else one account is always in effect.
 */
export const ORG_ALL_VIEW_PAGES = ['/hub/leads'];
/** GET requests that, in the all-accounts view, are sent WITHOUT an account so the server returns every account's rows. */
export const ORG_ALL_VIEW_READS = [/^\/hub\/leads$/, /^\/hub\/lead-companies$/, /^\/hub\/searches(\/[^/]+)?$/];
/** One lead's own requests (open, enrich, follow...) in the all-accounts view act through an account that holds that lead. */
export const ORG_LEAD_PATH = /^\/hub\/leads\/([^/]+)\//;
