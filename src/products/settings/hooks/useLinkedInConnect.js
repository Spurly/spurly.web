import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import accountController from '../controller/account.js';
import {
  NATIVE_CONNECT_EVENTS,
  APPROVAL_POLL_INTERVAL_MS,
  APPROVAL_POLL_TIMEOUT_MS,
  CHECKPOINT_TYPES,
} from '../constants/constants.js';

const GENERIC_FAILURE = 'Could not connect LinkedIn. Try again.';

/**
 * Listen for exactly one of a success/failure pair. Plain `once` on both would
 * leave the unfired one registered, and the NEXT call's answer would be
 * delivered to this call's handler.
 */
function listenForOne(emitter, okEvent, failEvent, onOk, onFail) {
  function ok(payload) {
    emitter.off(failEvent, fail);
    onOk(payload);
  }
  function fail(payload) {
    emitter.off(okEvent, ok);
    onFail(payload);
  }
  emitter.once(okEvent, ok);
  emitter.once(failEvent, fail);
}

/** The server writes user-facing copy for every native-flow failure (data.code set). */
function messageOf(err) {
  if (err?.data?.code && typeof err?.message === 'string' && err.message.trim()) return err.message;
  return getToastError(err, GENERIC_FAILURE);
}

/**
 * State for the native LinkedIn sign-in dialog — our own form instead of the
 * provider's hosted page.
 *
 *   credentials -> (connected) -> onConnected(account)
 *               -> checkpoint (2FA | OTP | IN_APP_VALIDATION | PHONE_REGISTER)
 *                    -> code / phone / approval poll -> connected
 *
 * `offerHosted` turns true whenever the server says the native flow cannot
 * finish (fallback: true) or something unexpected happened; the dialog then
 * offers the hosted sign-in page, which is the old flow kept as the way out.
 *
 * No try/catch or async/await here — the controller emits events.
 * The password is never kept in this hook: the form owns it and hands it to
 * signIn(), which passes it straight to the controller.
 */
export function useLinkedInConnect({ onConnected } = {}) {
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('credentials');
  const [checkpointType, setCheckpointType] = useState(null);
  const [busy, setBusy] = useState(null); // 'signin' | 'code' | 'another' | 'resend' | null
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [offerHosted, setOfferHosted] = useState(false);

  /**
   * Bumped on open, close and success. Every answer checks it, so a slow reply
   * from a dialog the user already closed — or a poll landing after a code
   * already connected — is dropped instead of reopening or re-finishing.
   */
  const sessionRef = useRef(0);
  const busyRef = useRef(null);
  const onConnectedRef = useRef(onConnected);
  useEffect(() => { onConnectedRef.current = onConnected; }, [onConnected]);

  const setBusyBoth = (value) => {
    busyRef.current = value;
    setBusy(value);
  };

  const backToStart = useCallback((message) => {
    setStep('credentials');
    setCheckpointType(null);
    setNotice('');
    setError(message || '');
  }, []);

  const finish = useCallback((account) => {
    sessionRef.current += 1;
    busyRef.current = null;
    setBusy(null);
    setOpen(false);
    onConnectedRef.current?.(account ?? null);
  }, []);

  const openDialog = useCallback(() => {
    sessionRef.current += 1;
    busyRef.current = null;
    setBusy(null);
    setStep('credentials');
    setCheckpointType(null);
    setError('');
    setNotice('');
    setOfferHosted(false);
    setOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    sessionRef.current += 1;
    busyRef.current = null;
    setBusy(null);
    setOpen(false);
  }, []);

  /** Run one step and route whatever it answers. */
  const runStep = (kind, call) => {
    if (busyRef.current) return;
    const session = sessionRef.current;
    setBusyBoth(kind);
    setError('');
    setNotice('');

    listenForOne(
      eventEmitter,
      NATIVE_CONNECT_EVENTS.STEP_SUCCESS,
      NATIVE_CONNECT_EVENTS.STEP_FAILURE,
      (next) => {
        if (session !== sessionRef.current) return;
        setBusyBoth(null);
        if (next?.state === 'connected') {
          finish(next.account);
          return;
        }
        if (next?.state === 'checkpoint' && next.checkpoint?.type) {
          setStep('checkpoint');
          setCheckpointType(next.checkpoint.type);
          if (kind === 'another') setNotice('LinkedIn switched to a different way to verify.');
          return;
        }
        setError(GENERIC_FAILURE);
        setOfferHosted(true);
      },
      (err) => {
        if (session !== sessionRef.current) return;
        setBusyBoth(null);
        if (err?.data?.code === 'EXPIRED') backToStart(messageOf(err));
        else setError(messageOf(err));
        if (err?.data?.fallback || !err?.data?.code) setOfferHosted(true);
      },
    );
    call();
  };

  const signIn = ({ username, password }) => runStep(
    'signin',
    () => accountController.connectWithCredentials(eventEmitter, { username, password }),
  );

  const submitCode = (code) => runStep('code', () => accountController.solveCheckpoint(eventEmitter, code));

  const tryAnotherWay = () => runStep('another', () => accountController.tryAnotherWay(eventEmitter));

  const resend = () => {
    if (busyRef.current) return;
    const session = sessionRef.current;
    setBusyBoth('resend');
    setError('');
    setNotice('');
    listenForOne(
      eventEmitter,
      NATIVE_CONNECT_EVENTS.RESEND_SUCCESS,
      NATIVE_CONNECT_EVENTS.RESEND_FAILURE,
      () => {
        if (session !== sessionRef.current) return;
        setBusyBoth(null);
        setNotice('Sent again. It can take a minute to arrive.');
      },
      (err) => {
        if (session !== sessionRef.current) return;
        setBusyBoth(null);
        if (err?.data?.code === 'EXPIRED') backToStart(messageOf(err));
        else setError(messageOf(err));
      },
    );
    accountController.resendCheckpoint(eventEmitter);
  };

  /**
   * App approval: nothing to type, so poll until the server sees the account
   * healthy. Also covers LinkedIn's "Yes, it's me" email — any approval that
   * completes the sign-in ends here. Skips a tick while another request
   * (resend, try another way) is in flight, and never overlaps itself.
   */
  const waitingOnApproval = open && step === 'checkpoint' && checkpointType === CHECKPOINT_TYPES.IN_APP;
  useEffect(() => {
    if (!waitingOnApproval) return undefined;
    const session = sessionRef.current;
    const startedAt = Date.now();
    let inFlight = false;
    let stopped = false;

    const timer = setInterval(() => {
      if (stopped || inFlight || busyRef.current) return;
      if (Date.now() - startedAt > APPROVAL_POLL_TIMEOUT_MS) {
        stopped = true;
        clearInterval(timer);
        if (session === sessionRef.current) backToStart('The approval wasn’t received in time. Sign in again.');
        return;
      }
      inFlight = true;
      listenForOne(
        eventEmitter,
        NATIVE_CONNECT_EVENTS.POLL_SUCCESS,
        NATIVE_CONNECT_EVENTS.POLL_FAILURE,
        (next) => {
          inFlight = false;
          if (stopped || session !== sessionRef.current) return;
          if (next?.state === 'connected') {
            stopped = true;
            clearInterval(timer);
            finish(next.account);
          }
        },
        (err) => {
          inFlight = false;
          if (stopped || session !== sessionRef.current) return;
          // A dropped poll is not a failed sign-in; only an expired one is.
          if (err?.data?.code === 'EXPIRED') {
            stopped = true;
            clearInterval(timer);
            backToStart(messageOf(err));
          }
        },
      );
      accountController.checkpointStatus(eventEmitter);
    }, APPROVAL_POLL_INTERVAL_MS);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [waitingOnApproval, eventEmitter, finish, backToStart]);

  return {
    open,
    step,
    checkpointType,
    busy,
    error,
    notice,
    offerHosted,
    openDialog,
    closeDialog,
    signIn,
    submitCode,
    tryAnotherWay,
    resend,
  };
}
