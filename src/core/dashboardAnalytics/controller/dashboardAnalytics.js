import dashboardAnalyticsGateway from '../gateway/dashboardAnalytics.js';
import { DASHBOARD_ANALYTICS_EVENTS } from '../constants/constants.js';

/**
 * Dashboard analytics controller. try/catch and async/await live here (and in
 * the gateway) only; the hook subscribes to events and never sees a raw
 * response. A failure is non-fatal: the rest of the dashboard still renders.
 */
async function load(eventEmitter, { days, tz }) {
  try {
    const res = await dashboardAnalyticsGateway.get({ days, tz });
    if (!res?.success) throw new Error(res?.message || 'Failed to load analytics');
    eventEmitter.emit(DASHBOARD_ANALYTICS_EVENTS.LOAD_SUCCESS, res.data);
  } catch (error) {
    eventEmitter.emit(DASHBOARD_ANALYTICS_EVENTS.LOAD_FAILURE, error?.message || 'Failed to load analytics');
  }
}

const dashboardAnalyticsController = { load };
export default dashboardAnalyticsController;
