export const PAGE_SIZE = 50;
/** Rows per page the All leads table offers; the server takes it as `limit` (it allows up to 200). */
export const LEAD_PAGE_SIZES = [50, 75, 100];
export const POLL_MS = 5000;

export const LEAD_EVENTS = {
  CREATE_SEARCH_SUCCESS: 'LEAD_CREATE_SEARCH_SUCCESS',
  CREATE_SEARCH_FAILURE: 'LEAD_CREATE_SEARCH_FAILURE',
  SEARCH_AUDIENCE_PARAMS_SUCCESS: 'LEAD_SEARCH_AUDIENCE_PARAMS_SUCCESS',
  SEARCH_AUDIENCE_PARAMS_FAILURE: 'LEAD_SEARCH_AUDIENCE_PARAMS_FAILURE',
  LIST_SEARCHES_SUCCESS: 'LEAD_LIST_SEARCHES_SUCCESS',
  LIST_SEARCHES_FAILURE: 'LEAD_LIST_SEARCHES_FAILURE',
  GET_SEARCH_SUCCESS: 'LEAD_GET_SEARCH_SUCCESS',
  GET_SEARCH_FAILURE: 'LEAD_GET_SEARCH_FAILURE',
  RUN_SEARCH_SUCCESS: 'LEAD_RUN_SEARCH_SUCCESS',
  RUN_SEARCH_FAILURE: 'LEAD_RUN_SEARCH_FAILURE',
  DELETE_SEARCH_SUCCESS: 'LEAD_DELETE_SEARCH_SUCCESS',
  DELETE_SEARCH_FAILURE: 'LEAD_DELETE_SEARCH_FAILURE',
  LIST_LEADS_SUCCESS: 'LEAD_LIST_LEADS_SUCCESS',
  LIST_LEADS_FAILURE: 'LEAD_LIST_LEADS_FAILURE',
  LIST_COMPANIES_SUCCESS: 'LEAD_LIST_COMPANIES_SUCCESS',
  LIST_COMPANIES_FAILURE: 'LEAD_LIST_COMPANIES_FAILURE',
  EXPORT_LEADS_SUCCESS: 'LEAD_EXPORT_LEADS_SUCCESS',
  EXPORT_LEADS_FAILURE: 'LEAD_EXPORT_LEADS_FAILURE',
  RESOLVE_PROFILE_SUCCESS: 'LEAD_RESOLVE_PROFILE_SUCCESS',
  RESOLVE_PROFILE_FAILURE: 'LEAD_RESOLVE_PROFILE_FAILURE',
  WITHDRAW_INVITATION_SUCCESS: 'LEAD_WITHDRAW_INVITATION_SUCCESS',
  WITHDRAW_INVITATION_FAILURE: 'LEAD_WITHDRAW_INVITATION_FAILURE',
  CREATE_LIST_SUCCESS: 'LEAD_CREATE_LIST_SUCCESS',
  CREATE_LIST_FAILURE: 'LEAD_CREATE_LIST_FAILURE',
  ADD_TO_AUDIENCE_SUCCESS: 'LEAD_ADD_TO_AUDIENCE_SUCCESS',
  ADD_TO_AUDIENCE_FAILURE: 'LEAD_ADD_TO_AUDIENCE_FAILURE',
  REMOVE_FROM_AUDIENCE_SUCCESS: 'LEAD_REMOVE_FROM_AUDIENCE_SUCCESS',
  REMOVE_FROM_AUDIENCE_FAILURE: 'LEAD_REMOVE_FROM_AUDIENCE_FAILURE',
  SOURCING_USAGE_SUCCESS: 'LEAD_SOURCING_USAGE_SUCCESS',
  SOURCING_USAGE_FAILURE: 'LEAD_SOURCING_USAGE_FAILURE',
  FOLLOWER_SOURCES_SUCCESS: 'LEAD_FOLLOWER_SOURCES_SUCCESS',
  FOLLOWER_SOURCES_FAILURE: 'LEAD_FOLLOWER_SOURCES_FAILURE',
};

/** Export: rows per request (the server's page ceiling) and the most rows one export reads. */
export const EXPORT_PAGE_SIZE = 200;
export const EXPORT_MAX_ROWS = 10000;

/** Default "profiles to fetch" — the old fixed import size. */
export const DEFAULT_FETCH_COUNT = 30;

/** Default "followers to import" — bigger than a search's: a follower list is cheap to page and the audience is usually the point. */
export const DEFAULT_FOLLOWERS_COUNT = 100;

/** Options for the table's "Last activity" type filter (server param `activityType`). */
export const ACTIVITY_TYPES = [
  { value: 'invite', label: 'Invite sent' },
  { value: 'message', label: 'Message sent' },
  { value: 'imported', label: 'Imported' },
  { value: 'enriched', label: 'Enriched' },
];

/**
 * Title-column filters. The `value` keys are the server's (spurly.backend products/hub/sourcing/constants/titleTaxonomy.js);
 * a key the server does not know is ignored there, so keep the two lists in step.
 */
export const LEAD_SENIORITY_OPTIONS = [
  { value: 'owner', label: 'Founder / Owner' },
  { value: 'c_level', label: 'C-level' },
  { value: 'vp', label: 'VP' },
  { value: 'director', label: 'Director / Head' },
  { value: 'manager', label: 'Manager' },
  { value: 'senior', label: 'Senior' },
  { value: 'entry', label: 'Entry / Intern' },
];

export const LEAD_FUNCTION_OPTIONS = [
  { value: 'engineering', label: 'Engineering / IT' },
  { value: 'product_design', label: 'Product & Design' },
  { value: 'sales', label: 'Sales & BD' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'hr', label: 'HR & Recruiting' },
  { value: 'finance', label: 'Finance' },
  { value: 'operations', label: 'Operations' },
  { value: 'customer', label: 'Support & CS' },
  { value: 'legal', label: 'Legal' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'executive', label: 'General mgmt' },
];

/** "Last activity" as a date window; the server reads these presets (d7 | d30 | d90 | older90). */
export const LAST_ACTIVITY_WINDOWS = [
  { value: '', label: 'Any time' },
  { value: 'd7', label: '7 days' },
  { value: 'd30', label: '30 days' },
  { value: 'd90', label: '90 days' },
  { value: 'older90', label: 'Idle 90d+' },
];

export const EMPTY_LEAD_FILTERS = { title: '', seniority: [], jobFunction: [], location: '', lastActivity: '' };

/** The query params for a leadFilters object; only the filters that are set. */
export function leadFilterParams(f = EMPTY_LEAD_FILTERS) {
  const out = {};
  if (f.title?.trim()) out.title = f.title.trim();
  if (f.seniority?.length) out.seniority = f.seniority.join(',');
  if (f.jobFunction?.length) out.jobFunction = f.jobFunction.join(',');
  if (f.location?.trim()) out.location = f.location.trim();
  if (f.lastActivity) out.lastActivity = f.lastActivity;
  return out;
}

/** How many of the Filter menu's filters are set (the badge on its button). */
export const countLeadFilters = (f = EMPTY_LEAD_FILTERS) => Object.keys(leadFilterParams(f)).length;
