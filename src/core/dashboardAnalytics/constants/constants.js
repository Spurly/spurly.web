/**
 * Event names the dashboard-analytics controller emits and its hook listens
 * for. Same reasoning as core/sidebarSummary/constants: one definition so the
 * two sides cannot drift.
 */
export const DASHBOARD_ANALYTICS_EVENTS = {
  LOAD_SUCCESS: 'DASHBOARD_ANALYTICS_LOAD_SUCCESS',
  LOAD_FAILURE: 'DASHBOARD_ANALYTICS_LOAD_FAILURE',
};

export const ANALYTICS_RANGES = [
  { id: 7, label: '7 days' },
  { id: 30, label: '30 days' },
  { id: 90, label: '90 days' },
];

export const DEFAULT_ANALYTICS_RANGE = 30;
