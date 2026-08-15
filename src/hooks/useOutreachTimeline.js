import { useState, useEffect, useRef } from 'react';
import outreachController from 'src/core/controllers/outreachController.js';
import { useErrorToast } from 'src/ui/primitives';

/**
 * Full outreach history for one person — every send, failure, acceptance and
 * reply, with the exact copy that went out.
 *
 * Fetches lazily: pass `enabled: false` (e.g. while a drawer is collapsed) to
 * skip the request entirely.
 */
export function useOutreachTimeline({ personId, profileUrl, enabled = true } = {}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Guards against a slow response for a previously-selected person
  // overwriting the currently-selected one.
  const requestRef = useRef(0);

  useEffect(() => {
    if (!enabled || (!personId && !profileUrl)) {
      setEvents([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const requestId = ++requestRef.current;
    let cancelled = false;

    setLoading(true);
    setError(null);

    outreachController
      .getTimeline({ personId, profileUrl })
      .then((list) => {
        if (cancelled || requestId !== requestRef.current) return;
        setEvents(list);
      })
      .catch((err) => {
        if (cancelled || requestId !== requestRef.current) return;
        setError(err.message || 'Failed to load activity');
        setEvents([]);
      })
      .finally(() => {
        if (cancelled || requestId !== requestRef.current) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [personId, profileUrl, enabled]);

  /* Reported twice on purpose: the inline block the page renders (which
     persists next to the empty table) and one toast (which catches the eye
     if that block is off screen). The toast gets fixed copy — the server's
     text goes inline, where there's room for it. */
  useErrorToast(error, "Couldn't load this lead's activity");

  return { events, loading, error };
}
