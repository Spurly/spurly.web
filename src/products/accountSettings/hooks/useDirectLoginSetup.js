import { useEffect, useMemo, useState } from 'react';
import { useAuth } from 'src/core/auth/hooks/useAuth';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import directLoginController from 'src/core/directLogin/controller/directLogin.js';
import { DIRECT_LOGIN_COPY as c, DIRECT_LOGIN_EVENTS, DIRECT_LOGIN_STEPS } from 'src/core/directLogin/constants/constants.js';

/**
 * State for "Set up a direct login" on a partner-managed account: the email +
 * password form, then the emailed code. On success the auth user is
 * refetched, so the whole app sees `hasDirectLogin` (and the real email).
 */
export function useDirectLoginSetup() {
  const { user, refetchUser } = useAuth();
  const toast = useToast();
  const emitter = useMemo(() => new EventEmitter(), []);

  const [step, setStep] = useState(DIRECT_LOGIN_STEPS.FORM);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onSent = ({ email: to }) => {
      setBusy(false);
      setSentTo(to);
      setCode('');
      setStep(DIRECT_LOGIN_STEPS.CODE);
    };
    const onSendFailed = (err) => {
      setBusy(false);
      toast.error(getToastError(err, c.sendFailed));
    };
    const onVerified = () => {
      setBusy(false);
      setPassword('');
      setConfirmPassword('');
      setCode('');
      setStep(DIRECT_LOGIN_STEPS.FORM);
      toast.success(c.success);
      refetchUser();
    };
    const onVerifyFailed = (err) => {
      setBusy(false);
      toast.error(getToastError(err, c.verifyFailed));
      // The code is gone server-side after these: start over from the form.
      if (['TOO_MANY_ATTEMPTS', 'CODE_EXPIRED', 'EMAIL_TAKEN'].includes(err?.code)) setStep(DIRECT_LOGIN_STEPS.FORM);
    };
    emitter.on(DIRECT_LOGIN_EVENTS.CODE_SENT, onSent);
    emitter.on(DIRECT_LOGIN_EVENTS.CODE_FAILED, onSendFailed);
    emitter.on(DIRECT_LOGIN_EVENTS.VERIFIED, onVerified);
    emitter.on(DIRECT_LOGIN_EVENTS.VERIFY_FAILED, onVerifyFailed);
    return () => {
      emitter.off(DIRECT_LOGIN_EVENTS.CODE_SENT, onSent);
      emitter.off(DIRECT_LOGIN_EVENTS.CODE_FAILED, onSendFailed);
      emitter.off(DIRECT_LOGIN_EVENTS.VERIFIED, onVerified);
      emitter.off(DIRECT_LOGIN_EVENTS.VERIFY_FAILED, onVerifyFailed);
    };
  }, [emitter, toast, refetchUser]);

  const canSend = !busy && email.trim() && password.length >= 8 && password === confirmPassword;
  const canConfirm = !busy && /^\d{6}$/.test(code.trim());

  const sendCode = (e) => {
    e?.preventDefault?.();
    if (!canSend) return;
    setBusy(true);
    directLoginController.requestCode(emitter, { email: email.trim(), password, confirmPassword });
  };

  const confirmCode = (e) => {
    e?.preventDefault?.();
    if (!canConfirm) return;
    setBusy(true);
    directLoginController.verifyCode(emitter, code);
  };

  const backToForm = () => {
    setStep(DIRECT_LOGIN_STEPS.FORM);
    setCode('');
  };

  return {
    user,
    hasDirectLogin: Boolean(user?.hasDirectLogin),
    step,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    code, setCode,
    sentTo,
    busy,
    canSend,
    canConfirm,
    sendCode,
    confirmCode,
    backToForm,
  };
}
