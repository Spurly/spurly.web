import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import sidebarSummaryController from '../controller/sidebarSummary.js';
import { SIDEBAR_SUMMARY_EVENTS } from '../constants/constants.js';

/**
 * Polled, same interval as the notifications bell — none of these numbers
 * (leads sourced, needs-enrichment, running campaigns, unread chats,
 * today's send pacing) are time-critical enough to warrant anything
 * faster, and the sidebar is mounted for the whole session so a 30s poll
 * is plenty to feel current.
 */
const POLL_MS = 30000;
const EMPTY = {
  leadsTotal: null,
  leadsNeedingEnrichment: null,
  campaignsRunning: null,
  inboxUnread: null,
  pacing: { dayUsed: null, dailyCap: null },
};

/**
 * Merges onto EMPTY rather than trusting the response shape wholesale.
 * `pacing` is read as `summary.pacing.dayUsed` in DashboardLayout with no
 * optional chaining — a response missing `pacing` entirely (a partial
 * backend payload, or a test's catch-all `{ data: {} }` mock) would throw
 * there instead of just showing a blank reading. Found the hard way: every
 * hub test file that renders DashboardLayout without explicitly mocking
 * `/hub/summary` was crashing on exactly this before this normalization
 * existed.
 */
function normalize(data) {
  return {
    ...EMPTY,
    ...data,
    pacing: { ...EMPTY.pacing, ...data?.pacing },
  };
}

export function useSidebarSummary() {
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const [state, setState] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const onSuccess = (data) => {
      if (!mountedRef.current) return;
      setState(normalize(data));
      setLoading(false);
    };
    // A failed poll keeps the last-known numbers on screen rather than
    // blanking the sidebar — same reasoning as useNotifications.
    const onFailure = () => {
      if (!mountedRef.current) return;
      setLoading(false);
    };
    eventEmitter.on(SIDEBAR_SUMMARY_EVENTS.LOAD_SUCCESS, onSuccess);
    eventEmitter.on(SIDEBAR_SUMMARY_EVENTS.LOAD_FAILURE, onFailure);
    return () => {
      eventEmitter.off(SIDEBAR_SUMMARY_EVENTS.LOAD_SUCCESS, onSuccess);
      eventEmitter.off(SIDEBAR_SUMMARY_EVENTS.LOAD_FAILURE, onFailure);
    };
  }, [eventEmitter]);

  const load = useCallback(() => {
    sidebarSummaryController.load(eventEmitter);
  }, [eventEmitter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => load(), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  return { ...state, loading };
}
