import { useCallback, useEffect, useMemo, useState } from 'react';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import orgController from '../controller/org.js';
import { ORG_EVENTS, ORG_PATHS } from '../constants/constants.js';

export const LOGIN_STEPS = { EMAIL: 'email', CODE: 'code' };

/**
 * Drives /login/org: email -> 6-digit code -> a signed-in session, then a full
 * page load into Settings -> Organization (the same hand-off "Open in Spurly"
 * uses, so every provider rebuilds around the new session).
 */
export function useOrgLogin() {
  const emitter = useMemo(() => new EventEmitter(), []);
  const [step, setStep] = useState(LOGIN_STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onSent = () => { setBusy(false); setError(null); setStep(LOGIN_STEPS.CODE); };
    const onFailed = (err) => { setBusy(false); setError(err); };
    const onOpened = () => window.location.replace(ORG_PATHS.SETTINGS);
    emitter.on(ORG_EVENTS.CODE_SENT, onSent);
    emitter.on(ORG_EVENTS.CODE_FAILED, onFailed);
    emitter.on(ORG_EVENTS.SESSION_OPENED, onOpened);
    emitter.on(ORG_EVENTS.SESSION_FAILED, onFailed);
    return () => {
      emitter.off(ORG_EVENTS.CODE_SENT, onSent);
      emitter.off(ORG_EVENTS.CODE_FAILED, onFailed);
      emitter.off(ORG_EVENTS.SESSION_OPENED, onOpened);
      emitter.off(ORG_EVENTS.SESSION_FAILED, onFailed);
    };
  }, [emitter]);

  const sendCode = useCallback((address) => {
    setBusy(true);
    setError(null);
    setEmail(address);
    orgController.requestLoginCode(emitter, address);
  }, [emitter]);

  const verify = useCallback((code) => {
    setBusy(true);
    setError(null);
    orgController.verifyLoginCode(emitter, email, code);
  }, [emitter, email]);

  const changeEmail = useCallback(() => { setStep(LOGIN_STEPS.EMAIL); setError(null); }, []);

  return { step, email, busy, error, sendCode, verify, changeEmail };
}
