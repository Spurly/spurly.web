import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from 'src/core/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { useOrgLogin, LOGIN_STEPS } from 'src/core/org/hooks/useOrgLogin.js';
import { ORG_CODE_LENGTH, ORG_COPY } from 'src/core/org/constants/constants.js';
import { AuthShell, FeaturesAside } from './components/AuthShell.jsx';
import { MailIcon } from './components/icons.jsx';

/** Codes whose message is our own product copy and safe to show as written. */
const SHOWN_AS_WRITTEN = ['INVALID_CODE', 'CODE_EXPIRED', 'TOO_MANY_ATTEMPTS', 'EMAIL_TAKEN', 'ORG_SUSPENDED', 'INVALID_EMAIL'];

function messageFor(error) {
  if (SHOWN_AS_WRITTEN.includes(error?.code) && error.message) return error.message;
  return getToastError(error, "Couldn't sign you in");
}

/**
 * Organization sign-in: the organization's email, then a 6-digit code.
 * Never merges with a personal Spurly account: that address is refused.
 * No async/await or try/catch here; the controller reports over events.
 */
export default function OrgLoginPage() {
  const toast = useToast();
  const { step, email, busy, error, sendCode, verify, changeEmail } = useOrgLogin();
  const [address, setAddress] = useState('');
  const [code, setCode] = useState('');
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

  const onCodeStep = step === LOGIN_STEPS.CODE;

  return (
    <AuthShell aside={<FeaturesAside />} topRight={<>{copy.personal} <Link to="/login">{copy.personalLink}</Link></>}>
      <div className="sp-card">
        <div className="sp-card__head">
          <h1 className="sp-card__title">{copy.title}</h1>
          <p className="sp-card__sub">{onCodeStep ? copy.subCode(email) : copy.subEmail}</p>
        </div>

        {!onCodeStep && (
          <form className="sp-form" onSubmit={onSend} noValidate>
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
            <button type="submit" className="sp-btn sp-btn--primary" disabled={busy || !address.trim()}>
              {busy ? <><span className="sp-spin" /> {copy.sending}</> : copy.sendCode}
            </button>
          </form>
        )}

        {onCodeStep && (
          <form className="sp-form" onSubmit={onVerify} noValidate>
            <div className="sp-field">
              <label className="sp-label" htmlFor="org-code">6-digit code</label>
              <input
                id="org-code" type="text" inputMode="numeric" pattern="[0-9]*" className="sp-input"
                maxLength={ORG_CODE_LENGTH} value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, ORG_CODE_LENGTH))}
                autoComplete="one-time-code" placeholder="123456" required
              />
            </div>
            <button type="submit" className="sp-btn sp-btn--primary" disabled={busy || code.length !== ORG_CODE_LENGTH}>
              {busy ? <><span className="sp-spin" /> {copy.verifying}</> : copy.verify}
            </button>
            <p className="sp-foot-switch" style={{ marginTop: 14 }}>
              <button type="button" className="sp-link" onClick={() => { setCode(''); changeEmail(); }}>{copy.useDifferentEmail}</button>
            </p>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
