import { useEffect, useMemo, useState } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import sidebarSummaryController from '../controller/sidebarSummary.js';
import { SIDEBAR_SUMMARY_EVENTS } from '../constants/constants.js';

/**
 * The Dashboard page's numbers: everything `useSidebarSummary` has
 * (leadsTotal, leadsNeedingEnrichment, campaignsRunning, inboxUnread,
 * pacing) plus connectRate and enrichmentFailedRecent. Loaded once on
 * mount — the sidebar's own poll already keeps the shared fields fresh
 * while the user is on the page, so this doesn't need its own timer.
 */
const EMPTY = {
  leadsTotal: null,
  leadsNeedingEnrichment: null,
  campaignsRunning: null,
  inboxUnread: null,
  pacing: { dayUsed: null, dailyCap: null },
  connectRate: null,
  enrichmentFailedRecent: null,
};

/** Same reasoning as useSidebarSummary's normalize() — merge onto EMPTY
 * rather than trust the response shape, so a partial payload can't leave
 * `pacing` (or anything else this page reads without optional chaining)
 * undefined. */
function normalize(data) {
  return {
    ...EMPTY,
    ...data,
    pacing: { ...EMPTY.pacing, ...data?.pacing },
  };
}

export function useDashboardSummary() {
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onSuccess = (next) => {
      setData(normalize(next));
      setLoading(false);
      setError(null);
    };
    const onFailure = (message) => {
      setLoading(false);
      setError(message);
    };
    eventEmitter.on(SIDEBAR_SUMMARY_EVENTS.DASHBOARD_LOAD_SUCCESS, onSuccess);
    eventEmitter.on(SIDEBAR_SUMMARY_EVENTS.DASHBOARD_LOAD_FAILURE, onFailure);
    sidebarSummaryController.loadDashboard(eventEmitter);
    return () => {
      eventEmitter.off(SIDEBAR_SUMMARY_EVENTS.DASHBOARD_LOAD_SUCCESS, onSuccess);
      eventEmitter.off(SIDEBAR_SUMMARY_EVENTS.DASHBOARD_LOAD_FAILURE, onFailure);
    };
  }, [eventEmitter]);

  return { ...data, loading, error };
}
