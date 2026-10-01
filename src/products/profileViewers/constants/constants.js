export const PAGE_SIZE = 25;

/** The degree filter on the page. `id` is what the API takes (3 means 3rd and beyond). */
export const DEGREE_FILTERS = [
  { id: 'all', label: 'All', degree: undefined },
  { id: '1', label: '1st', degree: 1 },
  { id: '2', label: '2nd', degree: 2 },
  { id: '3', label: '3rd+', degree: 3 },
];

export const PROFILE_VIEWERS_EVENTS = {
  GET_VIEWERS_SUCCESS: 'PROFILE_VIEWERS_GET_VIEWERS_SUCCESS',
  GET_VIEWERS_FAILURE: 'PROFILE_VIEWERS_GET_VIEWERS_FAILURE',
  SYNC_VIEWERS_SUCCESS: 'PROFILE_VIEWERS_SYNC_VIEWERS_SUCCESS',
  SYNC_VIEWERS_FAILURE: 'PROFILE_VIEWERS_SYNC_VIEWERS_FAILURE',
};
