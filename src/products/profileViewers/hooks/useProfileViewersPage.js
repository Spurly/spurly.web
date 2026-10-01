import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import hubProfileViewersController from '../controller/profileViewers.js';
import { DEGREE_FILTERS, PAGE_SIZE, PROFILE_VIEWERS_EVENTS } from '../constants/constants.js';

/** What a failed sync means for the page: a different screen, a wait, LinkedIn's side, or a plain error. */
export function syncFailureKind(error) {
  const code = error?.code ?? error?.response?.data?.code;
  if (code === 'NO_ACCOUNT' || code === 'ACCOUNT_NOT_READY') return 'account';
  if (code === 'SYNC_THROTTLED') return 'throttled';
  if (code === 'VIEWERS_QUERY_REJECTED') return 'rejected';
  return 'other';
}

export function retryAfterMinutes(error) {
  const data = error?.data ?? error?.response?.data?.data;
  const ms = Number(data?.retryAfterMs);
  return Number.isFinite(ms) && ms > 0 ? Math.max(1, Math.ceil(ms / 60000)) : null;
}

/**
 * State for the Profile viewers page: the stored list (server paged, newest
 * first, optional degree filter) with its summary and sync state, and the one
 * action, "Sync now". Nothing here calls LinkedIn on load: the list is what we
 * already stored, so it is instant.
 */
export function useProfileViewersPage() {
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [degreeId, setDegreeId] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [needsAccount, setNeedsAccount] = useState(false);
  const [rejected, setRejected] = useState(false);

  const pageRef = useRef(1);
  const degreeRef = useRef(undefined);

  const load = useCallback(() => {
    hubProfileViewersController.getViewers(eventEmitter, {
      page: pageRef.current,
      limit: PAGE_SIZE,
      degree: degreeRef.current,
    });
  }, [eventEmitter]);

  useEffect(() => {
    function onViewers(next) {
      setData(next);
      setLoading(false);
    }
    function onViewersFailure(error) {
      toast.error(getToastError(error, 'Could not load profile viewers'));
      setLoading(false);
    }
    function onSync({ message } = {}) {
      setSyncing(false);
      setNeedsAccount(false);
      setRejected(false);
      toast.success(message || 'Profile viewers updated');
      pageRef.current = 1;
      load();
    }
    function onSyncFailure(error) {
      setSyncing(false);
      const kind = syncFailureKind(error);
      if (kind === 'account') setNeedsAccount(true);
      else if (kind === 'rejected') {
        setRejected(true);
        load(); // the state row now carries the failure
      } else if (kind === 'throttled') {
        const mins = retryAfterMinutes(error);
        toast.error(mins ? `Checked a moment ago. Try again in ${mins} min.` : 'Checked a moment ago. Try again shortly.');
      } else {
        toast.error(getToastError(error, 'Could not read profile viewers'));
        load();
      }
    }

    eventEmitter.on(PROFILE_VIEWERS_EVENTS.GET_VIEWERS_SUCCESS, onViewers);
    eventEmitter.on(PROFILE_VIEWERS_EVENTS.GET_VIEWERS_FAILURE, onViewersFailure);
    eventEmitter.on(PROFILE_VIEWERS_EVENTS.SYNC_VIEWERS_SUCCESS, onSync);
    eventEmitter.on(PROFILE_VIEWERS_EVENTS.SYNC_VIEWERS_FAILURE, onSyncFailure);
    return () => {
      eventEmitter.off(PROFILE_VIEWERS_EVENTS.GET_VIEWERS_SUCCESS, onViewers);
      eventEmitter.off(PROFILE_VIEWERS_EVENTS.GET_VIEWERS_FAILURE, onViewersFailure);
      eventEmitter.off(PROFILE_VIEWERS_EVENTS.SYNC_VIEWERS_SUCCESS, onSync);
      eventEmitter.off(PROFILE_VIEWERS_EVENTS.SYNC_VIEWERS_FAILURE, onSyncFailure);
    };
  }, [eventEmitter, toast, load]);

  useEffect(() => { load(); }, [load]);

  const sync = useCallback(() => {
    setSyncing(true);
    hubProfileViewersController.syncViewers(eventEmitter);
  }, [eventEmitter]);

  const changeDegree = useCallback((id) => {
    const filter = DEGREE_FILTERS.find((f) => f.id === id) ?? DEGREE_FILTERS[0];
    setDegreeId(filter.id);
    degreeRef.current = filter.degree;
    pageRef.current = 1;
    load();
  }, [load]);

  const goToPage = useCallback((page) => {
    pageRef.current = page;
    load();
  }, [load]);

  return { data, loading, degreeId, changeDegree, goToPage, sync, syncing, needsAccount, rejected };
}
