import { useCallback, useEffect, useMemo, useState } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import orgController from '../controller/org.js';
import { ORG_EVENTS } from '../constants/constants.js';

/** The member's orgs with counts and 30-day usage. `orgs` is null until loaded. */
export function useOrganizations() {
  const emitter = useMemo(() => new EventEmitter(), []);
  const [orgs, setOrgs] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onLoaded = (data) => { setOrgs(data.orgs || []); setError(null); };
    const onFailed = (err) => setError(err);
    emitter.on(ORG_EVENTS.ORGS_LOADED, onLoaded);
    emitter.on(ORG_EVENTS.ORGS_FAILED, onFailed);
    orgController.loadOrgs(emitter);
    return () => {
      emitter.off(ORG_EVENTS.ORGS_LOADED, onLoaded);
      emitter.off(ORG_EVENTS.ORGS_FAILED, onFailed);
    };
  }, [emitter]);

  const reload = useCallback(() => orgController.loadOrgs(emitter), [emitter]);
  return { orgs, error, reload };
}

/** Switch the member's org workspace on or off (owners). `onChanged` runs after a success so the page reloads. */
export function useOrgWorkspace({ onChanged } = {}) {
  const emitter = useMemo(() => new EventEmitter(), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onSet = () => { setBusy(false); setError(null); onChanged?.(); };
    const onFailed = (err) => { setBusy(false); setError(err); };
    emitter.on(ORG_EVENTS.WORKSPACE_SET, onSet);
    emitter.on(ORG_EVENTS.WORKSPACE_FAILED, onFailed);
    return () => {
      emitter.off(ORG_EVENTS.WORKSPACE_SET, onSet);
      emitter.off(ORG_EVENTS.WORKSPACE_FAILED, onFailed);
    };
  }, [emitter, onChanged]);

  const setWorkspace = useCallback((orgId, enabled) => {
    setBusy(true);
    setError(null);
    orgController.setWorkspace(emitter, orgId, enabled);
  }, [emitter]);

  return { setWorkspace, busy, error };
}

/** One org's LinkedIn accounts, and disconnecting one. `onDisconnected` runs after a success. */
export function useOrgAccounts(orgId, { onDisconnected } = {}) {
  const emitter = useMemo(() => new EventEmitter(), []);
  const [accounts, setAccounts] = useState(null);
  const [error, setError] = useState(null);
  const [disconnecting, setDisconnecting] = useState(null);
  const [disconnectError, setDisconnectError] = useState(null);

  const reload = useCallback(() => orgController.loadAccounts(emitter, { orgId }), [emitter, orgId]);

  useEffect(() => {
    const onLoaded = (data) => { setAccounts(data.items || []); setError(null); };
    const onFailed = (err) => setError(err);
    const onGone = () => { setDisconnecting(null); setDisconnectError(null); reload(); onDisconnected?.(); };
    const onGoneFailed = (err) => { setDisconnecting(null); setDisconnectError(err); };
    emitter.on(ORG_EVENTS.ACCOUNTS_LOADED, onLoaded);
    emitter.on(ORG_EVENTS.ACCOUNTS_FAILED, onFailed);
    emitter.on(ORG_EVENTS.ACCOUNT_DISCONNECTED, onGone);
    emitter.on(ORG_EVENTS.ACCOUNT_DISCONNECT_FAILED, onGoneFailed);
    reload();
    return () => {
      emitter.off(ORG_EVENTS.ACCOUNTS_LOADED, onLoaded);
      emitter.off(ORG_EVENTS.ACCOUNTS_FAILED, onFailed);
      emitter.off(ORG_EVENTS.ACCOUNT_DISCONNECTED, onGone);
      emitter.off(ORG_EVENTS.ACCOUNT_DISCONNECT_FAILED, onGoneFailed);
    };
  }, [emitter, reload, onDisconnected]);

  const disconnect = useCallback((accountId) => {
    setDisconnecting(accountId);
    setDisconnectError(null);
    orgController.disconnectAccount(emitter, accountId);
  }, [emitter]);

  return { accounts, error, disconnecting, disconnectError, disconnect, reload };
}
