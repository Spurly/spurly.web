import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import partnerController from '../controller/partner.js';
import { PARTNER_EVENTS, PARTNER_PATHS } from '../constants/constants.js';

export const ENTER_PHASES = {
  OPENING: 'opening',
  CONFIRM: 'confirm',
  EXPIRED: 'expired',
};

/** Pull `t` out of "#t=…" and remove the whole fragment from the address bar. */
function takeTicket() {
  const raw = window.location.hash.replace(/^#/, '');
  const ticket = new URLSearchParams(raw).get('t') || '';
  // The ticket must not linger in history, a screenshot or a copied URL.
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return ticket;
}

/**
 * Drives /partner/enter.
 *
 *  - reads the one-time ticket from the URL fragment and erases it at once
 *  - no session here → exchange it and go to the dashboard
 *  - a normal (non-managed) session here → ask first (the exchange replaces it)
 *  - anything that goes wrong → the single "link expired" state
 *
 * The exchange is started once per page load (a ref), so React StrictMode's
 * double-mount cannot spend the ticket twice.
 */
export function usePartnerEnter() {
  const emitter = useMemo(() => new EventEmitter(), []);
  const ticketRef = useRef('');
  const startedRef = useRef(false);
  const [phase, setPhase] = useState(ENTER_PHASES.OPENING);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const onOpened = () => window.location.replace(PARTNER_PATHS.HOME);
    const onFailed = () => setPhase(ENTER_PHASES.EXPIRED);
    const onConfirm = ({ email: who }) => {
      setEmail(who);
      setPhase(ENTER_PHASES.CONFIRM);
    };
    emitter.on(PARTNER_EVENTS.SESSION_OPENED, onOpened);
    emitter.on(PARTNER_EVENTS.SESSION_FAILED, onFailed);
    emitter.on(PARTNER_EVENTS.CONFIRM_REQUIRED, onConfirm);
    return () => {
      emitter.off(PARTNER_EVENTS.SESSION_OPENED, onOpened);
      emitter.off(PARTNER_EVENTS.SESSION_FAILED, onFailed);
      emitter.off(PARTNER_EVENTS.CONFIRM_REQUIRED, onConfirm);
    };
  }, [emitter]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    ticketRef.current = takeTicket();
    if (!ticketRef.current) {
      emitter.emit(PARTNER_EVENTS.SESSION_FAILED, new Error('No ticket'));
      return;
    }

    const existing = partnerController.getExistingSession();
    if (existing) {
      emitter.emit(PARTNER_EVENTS.CONFIRM_REQUIRED, { email: existing.email });
      return;
    }
    partnerController.openAccount(emitter, ticketRef.current);
  }, [emitter]);

  const onContinue = useCallback(() => {
    setPhase(ENTER_PHASES.OPENING);
    partnerController.openAccount(emitter, ticketRef.current);
  }, [emitter]);

  // Staying signed in never touches the ticket; it just expires unused.
  const onStay = useCallback(() => {
    ticketRef.current = '';
    window.location.replace(PARTNER_PATHS.HOME);
  }, []);

  return { phase, email, onContinue, onStay };
}
