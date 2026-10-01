/** Discover (plan M5): company, job and post search. */

export const DISCOVER_TABS = [
  { id: 'companies', label: 'Companies' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'posts', label: 'Posts' },
];

/** Posted-date filter on the Posts tab. The id is what the API takes (`any` sends nothing). */
export const DATE_POSTED_OPTIONS = [
  { id: 'any', label: 'Any time' },
  { id: 'past_day', label: 'Past day' },
  { id: 'past_week', label: 'Past week' },
  { id: 'past_month', label: 'Past month' },
];

/** Sort order on Posts and Jobs. the id is the API value (`any` sends nothing, LinkedIn's default is relevance). */
export const SORT_OPTIONS = [
  { id: 'any', label: 'Most relevant' },
  { id: 'date', label: 'Newest first' },
];

/** Post format filter. Ids are the vendor's `content_type` enum (`any` sends nothing). */
export const CONTENT_TYPE_OPTIONS = [
  { id: 'any', label: 'All posts' },
  { id: 'videos', label: 'Videos' },
  { id: 'images', label: 'Images' },
  { id: 'documents', label: 'Documents' },
  { id: 'collaborative_articles', label: 'Articles' },
  { id: 'jobs', label: 'Job posts' },
];

/** Posts: who wrote it, among the people the account is tied to. Ids are the API values. */
export const POSTED_BY_OPTIONS = [
  { id: 'any', label: 'Anyone' },
  { id: 'first_connections', label: 'My 1st connections' },
  { id: 'people_you_follow', label: 'People I follow' },
];

/** Company size buckets. Ids are the backend's HEADCOUNT_BUCKETS keys. */
export const HEADCOUNT_OPTIONS = [
  { id: '1-10', label: '1-10' },
  { id: '11-50', label: '11-50' },
  { id: '51-200', label: '51-200' },
  { id: '201-500', label: '201-500' },
  { id: '501-1000', label: '501-1,000' },
  { id: '1001-5000', label: '1,001-5,000' },
  { id: '5001-10000', label: '5,001-10,000' },
  { id: '10001+', label: '10,001+' },
];

export const PRESENCE_OPTIONS = [
  { id: 'on_site', label: 'On-site' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'remote', label: 'Remote' },
];

export const JOB_TYPE_OPTIONS = [
  { id: 'full_time', label: 'Full-time' },
  { id: 'part_time', label: 'Part-time' },
  { id: 'contract', label: 'Contract' },
  { id: 'internship', label: 'Internship' },
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
