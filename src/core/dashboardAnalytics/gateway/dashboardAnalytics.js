import apiGateway from 'src/shared/gateway/apiGateway.js';

/**
 * GET /api/hub/summary/analytics?days=&tz= — the dashboard's analytics.
 * `tz` is the browser's IANA timezone so "today" and the heatmap hours are
 * the user's own, not the server's.
 */
async function get({ days, tz }) {
  const params = new URLSearchParams({ days: String(days) });
  if (tz) params.set('tz', tz);
  const res = await apiGateway.get(`/hub/summary/analytics?${params.toString()}`);
  return res.data;
}

const dashboardAnalyticsGateway = { get };
export default dashboardAnalyticsGateway;
