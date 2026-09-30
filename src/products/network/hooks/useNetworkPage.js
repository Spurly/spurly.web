import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import hubNetworkController from '../controller/network.js';
import { NETWORK_EVENTS, POLL_MS, PAGE_SIZE } from '../constants/constants.js';

/** Where the failure says the fix is a different page, not a retry. */
export function syncFailureKind(error) {
  const code = error?.code ?? error?.response?.data?.code;
  if (code === 'NO_LINKEDIN_ACCOUNT' || code === 'LINKEDIN_ACCOUNT_NOT_READY') return 'account';
  if (code === 'SYNC_THROTTLED') return 'throttled';
  return 'other';
}

export function retryAfterMinutes(error) {
  const data = error?.data ?? error?.response?.data?.data;
  const ms = Number(data?.retryAfterMs);
  return Number.isFinite(ms) && ms > 0 ? Math.max(1, Math.ceil(ms / 60000)) : null;
}

/**
 * State for the Network page: sync status (polled while syncing), the
 * connections table (server paged, newest connection first), and the one
 * action, "sync now".
 */
export function useNetworkPage() {
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const toast = useToast();

  const [network, setNetwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });
  const [listLoading, setListLoading] = useState(false);
  const [q, setQ] = useState('');
  const [starting, setStarting] = useState(false);
  const [needsAccount, setNeedsAccount] = useState(false);

  const audienceId = network?.audienceId ?? null;
  const pageRef = useRef(1);
  const qRef = useRef('');

  const loadStatus = useCallback(() => {
    hubNetworkController.getNetwork(eventEmitter);
  }, [eventEmitter]);

  const loadConnections = useCallback((opts = {}) => {
    if (!audienceId) return;
    if (opts.page != null) pageRef.current = opts.page;
    if (opts.q != null) qRef.current = opts.q;
    hubNetworkController.listConnections(eventEmitter, {
      audienceId,
      page: pageRef.current,
      q: qRef.current,
    });
  }, [eventEmitter, audienceId]);

  useEffect(() => {
    function onStatus(next) {
      setNetwork(next?.exists ? next : { exists: false });
      setLoading(false);
    }
    function onStatusFailure(error) {
      toast.error(getToastError(error, 'Could not load your network'));
      setLoading(false);
    }
    function onSync({ network: next, message } = {}) {
      setStarting(false);
      setNeedsAccount(false);
      if (next) setNetwork(next);
      if (message) toast.success(message);
    }
    function onSyncFailure(error) {
      setStarting(false);
      const kind = syncFailureKind(error);
      if (kind === 'account') setNeedsAccount(true);
      else if (kind === 'throttled') {
        const mins = retryAfterMinutes(error);
        toast.error(mins ? `Checked a moment ago. Try again in ${mins} min.` : 'Checked a moment ago. Try again shortly.');
      } else toast.error(getToastError(error, 'Could not start the sync'));
    }
    function onList({ leads, pagination: p } = {}) {
      setConnections(leads ?? []);
      if (p) setPagination(p);
      setListLoading(false);
    }
    function onListFailure(error) {
      toast.error(getToastError(error, 'Could not load your connections'));
      setListLoading(false);
    }

    eventEmitter.on(NETWORK_EVENTS.GET_NETWORK_SUCCESS, onStatus);
    eventEmitter.on(NETWORK_EVENTS.GET_NETWORK_FAILURE, onStatusFailure);
    eventEmitter.on(NETWORK_EVENTS.SYNC_NETWORK_SUCCESS, onSync);
    eventEmitter.on(NETWORK_EVENTS.SYNC_NETWORK_FAILURE, onSyncFailure);
    eventEmitter.on(NETWORK_EVENTS.LIST_CONNECTIONS_SUCCESS, onList);
    eventEmitter.on(NETWORK_EVENTS.LIST_CONNECTIONS_FAILURE, onListFailure);
    return () => {
      eventEmitter.off(NETWORK_EVENTS.GET_NETWORK_SUCCESS, onStatus);
      eventEmitter.off(NETWORK_EVENTS.GET_NETWORK_FAILURE, onStatusFailure);
      eventEmitter.off(NETWORK_EVENTS.SYNC_NETWORK_SUCCESS, onSync);
      eventEmitter.off(NETWORK_EVENTS.SYNC_NETWORK_FAILURE, onSyncFailure);
      eventEmitter.off(NETWORK_EVENTS.LIST_CONNECTIONS_SUCCESS, onList);
      eventEmitter.off(NETWORK_EVENTS.LIST_CONNECTIONS_FAILURE, onListFailure);
    };
  }, [eventEmitter, toast]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  // Load the table once the audience is known, and again whenever the count moves
  // (new rows landed while syncing).
  const count = network?.connectionCount ?? 0;
  useEffect(() => {
    if (audienceId) loadConnections({ page: 1 });
  }, [audienceId, count, loadConnections]);

  const syncing = Boolean(network?.syncing);
  useEffect(() => {
    if (!syncing) return undefined;
    const t = setInterval(loadStatus, POLL_MS);
    return () => clearInterval(t);
  }, [syncing, loadStatus]);

  const sync = useCallback(() => {
    setStarting(true);
    hubNetworkController.syncNetwork(eventEmitter);
  }, [eventEmitter]);

  const search = useCallback((value) => {
    setQ(value);
    setListLoading(true);
    loadConnections({ q: value, page: 1 });
  }, [loadConnections]);

  const goToPage = useCallback((page) => {
    setListLoading(true);
    loadConnections({ page });
  }, [loadConnections]);

  return { network, loading, connections, pagination, listLoading, q, search, goToPage, sync, starting, needsAccount };
}
