/**
 * Event names the sidebar-summary controller emits and useSidebarSummary
 * listens for. Centralized so the two sides can never drift — see
 * core/notifications/constants/constants.js for the same reasoning.
 */
export const SIDEBAR_SUMMARY_EVENTS = {
  LOAD_SUCCESS: 'SIDEBAR_SUMMARY_LOAD_SUCCESS',
  LOAD_FAILURE: 'SIDEBAR_SUMMARY_LOAD_FAILURE',
  DASHBOARD_LOAD_SUCCESS: 'SIDEBAR_SUMMARY_DASHBOARD_LOAD_SUCCESS',
  DASHBOARD_LOAD_FAILURE: 'SIDEBAR_SUMMARY_DASHBOARD_LOAD_FAILURE',
};
