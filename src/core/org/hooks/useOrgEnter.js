import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import orgController from '../controller/org.js';
import { ORG_EVENTS, ORG_PATHS } from '../constants/constants.js';

export const ORG_ENTER_PHASES = {
  OPENING: 'opening',
  CONFIRM: 'confirm',
  EXPIRED: 'expired',
  BUSY: 'busy',
  OFFLINE: 'offline',
};

/** Pull `t` out of "#t=…" and remove the whole fragment from the address bar. */
function takeTicket() {
  const raw = window.location.hash.replace(/^#/, '');
  const ticket = new URLSearchParams(raw).get('t') || '';
  // The ticket must not linger in history, a screenshot or a copied URL.
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return ticket;
}

/** Why a link failed, as the page shows it: a refused or unknown link is "expired" whatever the cause. */
const phaseFor = (error) => {
  if (error?.code === 'RATE_LIMITED') return ORG_ENTER_PHASES.BUSY;
  if (error?.code === 'NETWORK_ERROR') return ORG_ENTER_PHASES.OFFLINE;
  return ORG_ENTER_PHASES.EXPIRED;
};

/**
 * Drives /login/org/enter ("Open in Spurly" for an organization).
 *
 *  - reads the one-time ticket from the URL fragment and erases it at once
 *  - no session here (or this member's own) -> exchange it and go to Settings -> Organization
 *  - a personal session here -> ask first (the exchange replaces it)
 *  - anything that goes wrong -> one calm state, never the reason
 *
 * The exchange starts once per page load (a ref), so React StrictMode's double-mount
 * cannot spend the ticket twice. No async/await here: the controller reports over events.
 */
export function useOrgEnter() {
  const emitter = useMemo(() => new EventEmitter(), []);
  const ticketRef = useRef('');
  const startedRef = useRef(false);
  const [phase, setPhase] = useState(ORG_ENTER_PHASES.OPENING);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const onOpened = () => window.location.replace(ORG_PATHS.SETTINGS);
    const onFailed = (error) => setPhase(phaseFor(error));
    emitter.on(ORG_EVENTS.SESSION_OPENED, onOpened);
    const onConfirm = ({ email: who }) => {
      setEmail(who);
      setPhase(ORG_ENTER_PHASES.CONFIRM);
    };
    emitter.on(ORG_EVENTS.SESSION_FAILED, onFailed);
    emitter.on(ORG_EVENTS.ENTER_CONFIRM_REQUIRED, onConfirm);
    return () => {
      emitter.off(ORG_EVENTS.SESSION_OPENED, onOpened);
      emitter.off(ORG_EVENTS.SESSION_FAILED, onFailed);
      emitter.off(ORG_EVENTS.ENTER_CONFIRM_REQUIRED, onConfirm);
    };
  }, [emitter]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    ticketRef.current = takeTicket();
    if (!ticketRef.current) {
      emitter.emit(ORG_EVENTS.SESSION_FAILED, new Error('No ticket'));
      return;
    }

    const existing = orgController.getExistingSession();
    if (existing) {
      emitter.emit(ORG_EVENTS.ENTER_CONFIRM_REQUIRED, { email: existing.email });
      return;
    }
    orgController.openFromLink(emitter, ticketRef.current);
  }, [emitter]);

  const onContinue = useCallback(() => {
    setPhase(ORG_ENTER_PHASES.OPENING);
    orgController.openFromLink(emitter, ticketRef.current);
  }, [emitter]);

  // Staying signed in never touches the ticket; it just expires unused.
  const onStay = useCallback(() => {
    ticketRef.current = '';
    window.location.replace('/dashboard');
  }, []);

  return { phase, email, onContinue, onStay };
}
