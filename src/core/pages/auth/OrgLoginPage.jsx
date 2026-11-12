import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { useOrgLogin, LOGIN_STEPS, LOGIN_MODES } from 'src/core/org/hooks/useOrgLogin.js';
import { ORG_CODE_LENGTH, ORG_COPY } from 'src/core/org/constants/constants.js';
import { AuthShell, FeaturesAside } from './components/AuthShell.jsx';
import { PasswordField, PasswordRules, passwordMeetsRules } from './components/widgets.jsx';
import { MailIcon } from './components/icons.jsx';

/** Codes whose message is our own product copy and safe to show as written. */
const SHOWN_AS_WRITTEN = ['INVALID_CODE', 'CODE_EXPIRED', 'TOO_MANY_ATTEMPTS', 'EMAIL_TAKEN', 'ORG_SUSPENDED', 'INVALID_EMAIL', 'INVALID_CREDENTIALS', 'INVALID_PASSWORD', 'TOO_MANY_CODES', 'TOO_SOON'];

function messageFor(error) {
  if (SHOWN_AS_WRITTEN.includes(error?.code) && error.message) return error.message;
  return getToastError(error, "Couldn't sign you in");
}

/**
 * Organization sign-in: the organization's email, then a 6-digit code, or the email and a
 * password the member set earlier. "Forgot password?" sends the same code and sets a new one.
 * Never merges with a personal Spurly account: that address is refused.
 * No async/await or try/catch here; the controller reports over events.
 */
export default function OrgLoginPage() {
  const toast = useToast();
  const { step, mode, email, busy, error, sendCode, verify, signInWithPassword, resetPassword, changeEmail, setMode } = useOrgLogin();
  const [address, setAddress] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldError, setFieldError] = useState('');
  const copy = ORG_COPY.login;

  useEffect(() => {
    if (error) toast.error(messageFor(error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  function onSend(e) {
    e.preventDefault();
    sendCode(address.trim());
  }

  function onVerify(e) {
    e.preventDefault();
    verify(code.trim());
  }

  function onPassword(e) {
    e.preventDefault();
    signInWithPassword(address.trim(), password);
  }

  function onReset(e) {
    e.preventDefault();
    setFieldError('');
    if (!passwordMeetsRules(password)) { setFieldError(copy.passwordRules); return; }
    if (password !== confirm) { setFieldError(copy.passwordMismatch); return; }
    resetPassword(code.trim(), password);
  }

  function switchMode(next) {
    setCode(''); setPassword(''); setConfirm(''); setFieldError('');
    setMode(next);
  }

  const onCodeStep = step === LOGIN_STEPS.CODE;
  const isPassword = mode === LOGIN_MODES.PASSWORD;
  const isReset = mode === LOGIN_MODES.RESET;
  const title = isReset ? copy.resetTitle : copy.title;
  let sub = copy.subEmail;
  if (isPassword) sub = copy.passwordSub;
  else if (isReset) sub = onCodeStep ? copy.resetSubCode(email) : copy.resetSubEmail;
  else if (onCodeStep) sub = copy.subCode(email);

  const emailField = (
    <div className="sp-field">
      <label className="sp-label" htmlFor="org-email">Organization email</label>
      <div className="sp-input-wrap">
        <span className="sp-ic-left"><MailIcon s={18} /></span>
        <input
          id="org-email" type="email" className="sp-input has-left"
          value={address} onChange={(e) => setAddress(e.target.value)}
          autoComplete="email" placeholder="you@company.com" required
        />
      </div>
    </div>
  );

  const codeField = (
    <div className="sp-field">
      <label className="sp-label" htmlFor="org-code">6-digit code</label>
      <input
        id="org-code" type="text" inputMode="numeric" pattern="[0-9]*" className="sp-input"
        maxLength={ORG_CODE_LENGTH} value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, ORG_CODE_LENGTH))}
        autoComplete="one-time-code" placeholder="123456" required
      />
    </div>
  );

  return (
    <AuthShell aside={<FeaturesAside />} topRight={<>{copy.personal} <Link to="/login">{copy.personalLink}</Link></>}>
      <div className="sp-card">
        <div className="sp-card__head">
          <h1 className="sp-card__title">{title}</h1>
          <p className="sp-card__sub">{sub}</p>
        </div>

        {fieldError && <div className="sp-notice sp-notice--error" role="alert" style={{ marginBottom: 16 }}>{fieldError}</div>}

        {isPassword && (
          <form className="sp-form" onSubmit={onPassword} noValidate>
            {emailField}
            <div className="sp-field">
              <label className="sp-label" htmlFor="org-password">{copy.passwordLabel}</label>
              <PasswordField id="org-password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              <button type="button" className="sp-link" style={{ marginTop: 8 }} onClick={() => switchMode(LOGIN_MODES.RESET)}>{copy.forgot}</button>
            </div>
            <button type="submit" className="sp-btn sp-btn--primary" disabled={busy || !address.trim() || !password}>
              {busy ? <><span className="sp-spin" /> {copy.verifying}</> : copy.signIn}
            </button>
            <p className="sp-foot-switch" style={{ marginTop: 14 }}>
              <button type="button" className="sp-link" onClick={() => switchMode(LOGIN_MODES.CODE)}>{copy.useCode}</button>
            </p>
          </form>
        )}

        {!isPassword && !onCodeStep && (
          <form className="sp-form" onSubmit={onSend} noValidate>
            {emailField}
            <button type="submit" className="sp-btn sp-btn--primary" disabled={busy || !address.trim()}>
              {busy ? <><span className="sp-spin" /> {copy.sending}</> : copy.sendCode}
            </button>
            <p className="sp-foot-switch" style={{ marginTop: 14 }}>
              {isReset
                ? <button type="button" className="sp-link" onClick={() => switchMode(LOGIN_MODES.PASSWORD)}>{copy.backToSignIn}</button>
                : <button type="button" className="sp-link" onClick={() => switchMode(LOGIN_MODES.PASSWORD)}>{copy.usePassword}</button>}
            </p>
          </form>
        )}

        {!isPassword && onCodeStep && !isReset && (
          <form className="sp-form" onSubmit={onVerify} noValidate>
            {codeField}
            <button type="submit" className="sp-btn sp-btn--primary" disabled={busy || code.length !== ORG_CODE_LENGTH}>
              {busy ? <><span className="sp-spin" /> {copy.verifying}</> : copy.verify}
            </button>
            <p className="sp-foot-switch" style={{ marginTop: 14 }}>
              <button type="button" className="sp-link" onClick={() => { setCode(''); changeEmail(); }}>{copy.useDifferentEmail}</button>
            </p>
          </form>
        )}

        {isReset && onCodeStep && (
          <form className="sp-form" onSubmit={onReset} noValidate>
            {codeField}
            <div className="sp-field">
              <label className="sp-label" htmlFor="org-new-password">{copy.newPassword}</label>
              <PasswordField id="org-new-password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              <PasswordRules value={password} />
            </div>
            <div className="sp-field">
              <label className="sp-label" htmlFor="org-confirm-password">{copy.confirmPassword}</label>
              <PasswordField id="org-confirm-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </div>
            <button type="submit" className="sp-btn sp-btn--primary" disabled={busy || code.length !== ORG_CODE_LENGTH || !password || !confirm}>
              {busy ? <><span className="sp-spin" /> {copy.savingPassword}</> : copy.setPassword}
            </button>
            <p className="sp-foot-switch" style={{ marginTop: 14 }}>
              <button type="button" className="sp-link" onClick={() => { setCode(''); setPassword(''); setConfirm(''); changeEmail(); }}>{copy.useDifferentEmail}</button>
            </p>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
