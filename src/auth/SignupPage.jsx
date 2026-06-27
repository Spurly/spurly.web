import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from 'src/hooks/useAuth';
import { AuthShell, FeaturesAside } from './AuthShell.jsx';
import {
  GoogleButton, PasswordField, PasswordRules, passwordMeetsRules, TrustBadges,
} from './widgets.jsx';
import { UserIcon, MailIcon, GiftIcon } from './icons.jsx';

/**
 * Step 1 — Create your account.
 * Collects name + work email + password (with live strength rules), requests a
 * signup OTP, then advances to the email-verification page. Google sign-in is
 * present in the UI but disabled until the backend is wired.
 */
export default function SignupPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { requestSignupOtp } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '', referralCode: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Prefill a referral code from a referral link, e.g. /signup?ref=K7P3M9QX.
  useEffect(() => {
    const ref = params.get('ref') || params.get('referral');
    if (ref) setForm((f) => ({ ...f, referralCode: ref.trim().toUpperCase() }));
  }, [params]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const canSubmit = form.name.trim() && form.email.trim() && passwordMeetsRules(form.password) && !loading;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!passwordMeetsRules(form.password)) {
      setError('Please choose a password that meets all the requirements.');
      return;
    }
    setLoading(true);
    try {
      await requestSignupOtp({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        // Single-field UI: confirmation mirrors the password (rules enforced above).
        confirmPassword: form.password,
        referralCode: form.referralCode.trim() || undefined,
      });
      navigate('/signup/verify', {
        state: { email: form.email.trim(), name: form.name.trim() },
      });
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      aside={<FeaturesAside />}
      topRight={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      <div className="sp-card">
        <div className="sp-card__head">
          <h2 className="sp-card__title">Create your account</h2>
          <p className="sp-card__sub">Get started with <b>100 free credits</b> 🎉</p>
        </div>

        {error && <div className="sp-notice sp-notice--error" role="alert" style={{ marginBottom: 16 }}>{error}</div>}

        <GoogleButton onError={setError} />

        <div className="sp-or" style={{ margin: '18px 0' }}>or</div>

        <form className="sp-form" onSubmit={onSubmit} noValidate>
          <div className="sp-field">
            <label className="sp-label" htmlFor="su-name">Full Name</label>
            <div className="sp-input-wrap">
              <span className="sp-ic-left"><UserIcon s={18} /></span>
              <input
                id="su-name" type="text" className="sp-input has-left"
                value={form.name} onChange={set('name')}
                autoComplete="name" placeholder="Jane Doe" required
              />
            </div>
          </div>

          <div className="sp-field">
            <label className="sp-label" htmlFor="su-email">Work Email</label>
            <div className="sp-input-wrap">
              <span className="sp-ic-left"><MailIcon s={18} /></span>
              <input
                id="su-email" type="email" className="sp-input has-left"
                value={form.email} onChange={set('email')}
                autoComplete="email" placeholder="you@company.com" required
              />
            </div>
          </div>

          <div className="sp-field">
            <label className="sp-label" htmlFor="su-password">Password</label>
            <PasswordField
              id="su-password" value={form.password} onChange={set('password')}
              placeholder="Create a password" autoComplete="new-password"
            />
            <PasswordRules value={form.password} />
          </div>

          <div className="sp-field">
            <label className="sp-label" htmlFor="su-referral">
              Referral code <span className="opt">(optional)</span>
            </label>
            <div className="sp-input-wrap">
              <span className="sp-ic-left"><GiftIcon s={18} /></span>
              <input
                id="su-referral" type="text" className="sp-input has-left"
                value={form.referralCode}
                onChange={(e) => setForm((f) => ({ ...f, referralCode: e.target.value.toUpperCase() }))}
                autoComplete="off" placeholder="Have a code? Enter it here"
              />
            </div>
          </div>

          <button type="submit" className="sp-btn sp-btn--primary" disabled={!canSubmit}>
            {loading ? <><span className="sp-spin" /> Please wait…</> : 'Create Account'}
          </button>
        </form>

        <p className="sp-legal" style={{ marginTop: 16 }}>
          By creating an account, you agree to our{' '}
          <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.
        </p>

        <TrustBadges />
      </div>
    </AuthShell>
  );
}
