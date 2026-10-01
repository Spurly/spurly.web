/** Discover (plan M5): company, job and post search. */

export const DISCOVER_TABS = [
  { id: 'companies', label: 'Companies' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'posts', label: 'Posts' },
];

/** Posted-date filter on the Posts tab. `value` is what the API takes. */
export const DATE_POSTED_OPTIONS = [
  { id: 'any', label: 'Any time', value: undefined },
  { id: 'past_day', label: 'Past day', value: 'past_day' },
  { id: 'past_week', label: 'Past week', value: 'past_week' },
  { id: 'past_month', label: 'Past month', value: 'past_month' },
];

/** The most authors one import takes (mirrors the backend's MAX_AUTHORS_PER_IMPORT). */
export const MAX_AUTHORS_PER_IMPORT = 100;

export const DISCOVER_EVENTS = {
  SEARCH_SUCCESS: 'DISCOVER_SEARCH_SUCCESS',
  SEARCH_FAILURE: 'DISCOVER_SEARCH_FAILURE',
  USAGE_SUCCESS: 'DISCOVER_USAGE_SUCCESS',
  USAGE_FAILURE: 'DISCOVER_USAGE_FAILURE',
  IMPORT_AUTHORS_SUCCESS: 'DISCOVER_IMPORT_AUTHORS_SUCCESS',
  IMPORT_AUTHORS_FAILURE: 'DISCOVER_IMPORT_AUTHORS_FAILURE',
};
