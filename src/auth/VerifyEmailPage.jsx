import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from 'src/hooks/useAuth';
import { useToast } from 'src/ui/primitives';
import { getToastError } from 'src/common/utils/apiError';
import { AuthShell, FeaturesAside } from './AuthShell.jsx';

/**
 * Step 1b — Verify your email.
 * Reached only after the signup form requests an OTP (email passed via router
 * state). Enters the 6-digit code, creates the account, signs in, and sends
 * the brand-new account straight to the mandatory subscribe screen — there is
 * no product access before the first payment succeeds, so onboarding waits
 * until after /subscribe. A direct hit with no email bounces back to /signup.
 */
export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifySignupOtp } = useAuth();
  const toast = useToast();

  const email = location.state?.email || '';
  const name = location.state?.name || '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  /* Persistent page context, not an API result — stays inline so it's still
     readable while the user switches to their mail client and back. */
  const notice = email ? `We emailed a 6-digit code to ${email}.` : '';

  // No email in state → the user didn't come from the signup form. Send them back.
  useEffect(() => {
    if (!email) navigate('/signup', { replace: true });
  }, [email, navigate]);

  if (!email) return null;

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await verifySignupOtp({ email, code: code.trim() });
      toast.success('Account created', { description: 'Welcome to Spurly.' });
      navigate('/subscribe', { replace: true });
    } catch (err) {
      toast.error(getToastError(err, "That code didn't work. Check it and try again."));
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setResending(true);
    try {
      // We don't keep the password around on this page, so a true resend isn't
      // possible here — guide the user back to the form to restart cleanly.
      navigate('/signup', { state: { email, name } });
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell
      aside={<FeaturesAside />}
      topRight={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      <div className="sp-card">
        <div className="sp-card__head">
          <h2 className="sp-card__title">Verify your email</h2>
          <p className="sp-card__sub">Enter the 6-digit code we just sent you.</p>
        </div>

        {notice && <div className="sp-notice sp-notice--info" style={{ marginBottom: 16 }}>{notice}</div>}

        <form className="sp-form" onSubmit={onSubmit} noValidate>
          <div className="sp-field">
            <label className="sp-label" htmlFor="otp">Verification code</label>
            <input
              id="otp" type="text" inputMode="numeric" maxLength={6}
              className="sp-input"
              style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: 22, fontWeight: 700 }}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456" autoComplete="one-time-code" required
            />
          </div>

          <button type="submit" className="sp-btn sp-btn--primary" disabled={loading || code.length !== 6}>
            {loading ? <><span className="sp-spin" /> Verifying…</> : 'Verify & create account'}
          </button>
        </form>

        <p className="sp-foot-switch" style={{ marginTop: 18 }}>
          Didn’t get it?{' '}
          <button type="button" className="sp-link" onClick={onResend} disabled={resending}>
            Resend code
          </button>
        </p>
        <p className="sp-foot-switch" style={{ marginTop: 8 }}>
          Wrong email? <Link className="sp-link" to="/signup">Go back</Link>
        </p>
      </div>
    </AuthShell>
  );
}
