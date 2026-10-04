import { useCallback, useEffect, useState } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import dashboardAnalyticsController from '../controller/dashboardAnalytics.js';
import { DASHBOARD_ANALYTICS_EVENTS } from '../constants/constants.js';

const emptyPeriod = { value: 0, prev: 0, delta: null };

/**
 * Merge a response onto a full empty shape so a partial payload (an older
 * server, a test's catch-all `{ data: [] }` mock) can never leave something
 * the page reads without optional chaining undefined. Returns null when the
 * response is not an analytics object at all, which the page treats as "no
 * data yet".
 */
export function normalizeAnalytics(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || !data.series) return null;
  const arr = (v) => (Array.isArray(v) ? v : []);
  const s = data.series;
  const p = data.period ?? {};
  return {
    ...data,
    totals: { invites: 0, messages: 0, connections: 0, connectionsSinceStart: null, repliesConversations: 0, ...data.totals },
    period: {
      invites: { ...emptyPeriod, ...p.invites },
      messages: { ...emptyPeriod, ...p.messages },
      newConnections: { ...emptyPeriod, ...p.newConnections },
      replies: { ...emptyPeriod, ...p.replies },
      newViewers: { ...emptyPeriod, ...p.newViewers },
    },
    series: {
      days: arr(s.days),
      invites: arr(s.invites),
      messages: arr(s.messages),
      newConnections: arr(s.newConnections),
      replies: arr(s.replies),
      newViewers: arr(s.newViewers),
      network: arr(s.network),
    },
    acceptance: { rate: null, matured: 0, accepted: 0, windowDays: 14, ...data.acceptance },
    reply: { rate: null, conversations: 0, replied: 0, medianHoursToReply: null, ...data.reply },
    funnel: arr(data.funnel),
    heat: { sends: arr(data.heat?.sends), replies: arr(data.heat?.replies) },
    campaigns: arr(data.campaigns),
    audience: { locations: arr(data.audience?.locations), companies: arr(data.audience?.companies) },
  };
}

function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    return '';
  }
}

/**
 * The dashboard's analytics for a range. Refetches when `days` changes and
 * ignores a response that arrives after the range has moved on, so quickly
 * flipping 7 -> 30 -> 90 can never leave the 30-day numbers on screen.
 */
export function useDashboardAnalytics(days) {
  const [state, setState] = useState({ data: null, forDays: null, error: null });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    const emitter = new EventEmitter();
    emitter.once(DASHBOARD_ANALYTICS_EVENTS.LOAD_SUCCESS, (data) => {
      if (alive) setState({ data: normalizeAnalytics(data), forDays: days, error: null });
    });
    emitter.once(DASHBOARD_ANALYTICS_EVENTS.LOAD_FAILURE, (message) => {
      if (alive) setState((prev) => ({ data: prev.data, forDays: days, error: message }));
    });
    dashboardAnalyticsController.load(emitter, { days, tz: browserTimezone() });
    return () => {
      alive = false;
    };
  }, [days, tick]);

  /* `loading` is true until a response for THIS range has landed, so flipping
     the range never presents the previous range's numbers as current. */
  return { data: state.data, error: state.error, loading: state.forDays !== days, reload };
}
