import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import accountController from '../controller/account.js';
import {
  NATIVE_CONNECT_EVENTS,
  APPROVAL_POLL_INTERVAL_MS,
  APPROVAL_POLL_TIMEOUT_MS,
  CHECKPOINT_TYPES,
  CONNECT_ERROR_TITLES,
} from '../constants/constants.js';

const GENERIC_FAILURE = 'Something went wrong while connecting LinkedIn. Try again.';

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

/**
 * A failure -> { code, title, message, field, fallback } for the dialog's
 * alert. The server writes user-facing copy for every native-flow failure
 * (data.code set); anything else (network, a crash) gets generic, honest copy.
 */
export function toConnectError(err) {
  const code = err?.data?.code ?? null;
  if (code && typeof err?.message === 'string' && err.message.trim()) {
    return {
      code,
      title: CONNECT_ERROR_TITLES[code] ?? 'Couldn’t connect LinkedIn',
      message: err.message,
      field: err?.data?.field ?? null,
      fallback: Boolean(err?.data?.fallback),
    };
  }
  return {
    code: 'UNKNOWN',
    title: 'Couldn’t connect LinkedIn',
    message: getToastError(err, GENERIC_FAILURE),
    field: null,
    fallback: true,
  };
}

/**
 * State for the native LinkedIn sign-in dialog — our own form instead of the
 * provider's hosted page.
 *
 *   form -> (connected) -> success
 *        -> checkpoint (2FA | OTP | IN_APP_VALIDATION | PHONE_REGISTER)
 *             -> code / phone / approval poll -> success
 *
 * `offerHosted` turns true whenever the server says the native flow cannot
 * finish (fallback: true) or something unexpected happened; the dialog then
 * offers the hosted sign-in page, the old flow kept as the way out.
 *
 * `onConnected(account)` fires the moment the account is bound, so the page
 * behind updates while the dialog shows its success state.
 *
 * No try/catch or async/await here — the controller emits events. Secrets
 * (password, cookie, proxy password) are never kept here: the form owns them
 * and hands them to signIn(), which passes them straight to the controller.
 */
export function useLinkedInConnect({ onConnected } = {}) {
  const eventEmitter = useMemo(() => new EventEmitter(), []);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'checkpoint' | 'success'
  const [checkpoint, setCheckpoint] = useState(null); // { type, expiresAt }
  const [busy, setBusy] = useState(null); // 'signin' | 'code' | 'another' | 'resend' | null
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const [offerHosted, setOfferHosted] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState(null);
  const [options, setOptions] = useState({ detectedCountry: null, loaded: false });

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

  const backToForm = useCallback((nextError) => {
    setStep('form');
    setCheckpoint(null);
    setNotice('');
    setError(nextError ?? null);
  }, []);

  const finish = useCallback((account) => {
    sessionRef.current += 1;
    busyRef.current = null;
    setBusy(null);
    setError(null);
    setNotice('');
    setConnectedAccount(account ?? null);
    setStep('success');
    onConnectedRef.current?.(account ?? null);
  }, []);

  const openDialog = useCallback(() => {
    sessionRef.current += 1;
    busyRef.current = null;
    setBusy(null);
    setStep('form');
    setCheckpoint(null);
    setError(null);
    setNotice('');
    setOfferHosted(false);
    setConnectedAccount(null);
    setOpen(true);

    // Where "Automatic" will sign in from. A nicety: the dialog works without it.
    listenForOne(
      eventEmitter,
      NATIVE_CONNECT_EVENTS.OPTIONS_SUCCESS,
      NATIVE_CONNECT_EVENTS.OPTIONS_FAILURE,
      (next) => setOptions({ detectedCountry: next?.detectedCountry ?? null, loaded: true }),
      () => setOptions({ detectedCountry: null, loaded: true }),
    );
    accountController.getConnectOptions(eventEmitter);
  }, [eventEmitter]);

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
    setError(null);
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
          setCheckpoint({ type: next.checkpoint.type, expiresAt: next.checkpoint.expiresAt ?? null });
          if (kind === 'another') setNotice('LinkedIn switched to a different way to verify it’s you.');
          return;
        }
        setError({ code: 'UNKNOWN', title: 'Couldn’t connect LinkedIn', message: GENERIC_FAILURE, field: null });
        setOfferHosted(true);
      },
      (err) => {
        if (session !== sessionRef.current) return;
        setBusyBoth(null);
        const info = toConnectError(err);
        if (info.code === 'EXPIRED') backToForm(info);
        else setError(info);
        if (info.fallback) setOfferHosted(true);
      },
    );
    call();
  };

  const signIn = (input) => runStep('signin', () => accountController.connectWithCredentials(eventEmitter, input));

  const submitCode = (code) => runStep('code', () => accountController.solveCheckpoint(eventEmitter, code));

  const tryAnotherWay = () => runStep('another', () => accountController.tryAnotherWay(eventEmitter));

  /** "Use a different account" from a checkpoint — the open sign-in is simply superseded. */
  const startOver = () => {
    if (busyRef.current) return;
    sessionRef.current += 1;
    backToForm(null);
  };

  const resend = () => {
    if (busyRef.current) return;
    const session = sessionRef.current;
    setBusyBoth('resend');
    setError(null);
    setNotice('');
    listenForOne(
      eventEmitter,
      NATIVE_CONNECT_EVENTS.RESEND_SUCCESS,
      NATIVE_CONNECT_EVENTS.RESEND_FAILURE,
      () => {
        if (session !== sessionRef.current) return;
        setBusyBoth(null);
        setNotice(checkpoint?.type === CHECKPOINT_TYPES.IN_APP
          ? 'Sent again. Check the LinkedIn app on your phone.'
          : 'Sent again. It can take a minute to arrive — check spam too.');
      },
      (err) => {
        if (session !== sessionRef.current) return;
        setBusyBoth(null);
        const info = toConnectError(err);
        if (info.code === 'EXPIRED') backToForm(info);
        else setError(info);
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
  const waitingOnApproval = open && step === 'checkpoint' && checkpoint?.type === CHECKPOINT_TYPES.IN_APP;
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
        if (session === sessionRef.current) {
          backToForm({
            code: 'EXPIRED',
            title: CONNECT_ERROR_TITLES.EXPIRED,
            message: 'The approval wasn’t received in time. Sign in again and approve within 5 minutes.',
            field: null,
          });
        }
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
            backToForm(toConnectError(err));
          }
        },
      );
      accountController.checkpointStatus(eventEmitter);
    }, APPROVAL_POLL_INTERVAL_MS);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [waitingOnApproval, eventEmitter, finish, backToForm]);

  return {
    open,
    step,
    checkpoint,
    checkpointType: checkpoint?.type ?? null,
    busy,
    error,
    notice,
    offerHosted,
    connectedAccount,
    options,
    openDialog,
    closeDialog,
    signIn,
    submitCode,
    tryAnotherWay,
    resend,
    startOver,
  };
}
