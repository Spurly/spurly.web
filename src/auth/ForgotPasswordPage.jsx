import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from 'src/hooks/useAuth';
import { AuthShell, FeaturesAside } from './AuthShell.jsx';
import { MailIcon } from './icons.jsx';

/** Request a password-reset code (replaces the modal's "forgot" view). */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      navigate('/reset-password', { state: { email: email.trim() } });
    } catch (err) {
      setError(err.message || 'Could not send a reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      aside={<FeaturesAside />}
      topRight={<>Remembered it? <Link to="/login">Sign in</Link></>}
    >
      <div className="sp-card">
        <div className="sp-card__head">
          <h2 className="sp-card__title">Reset your password</h2>
          <p className="sp-card__sub">We’ll email you a code to reset it.</p>
        </div>

        {error && <div className="sp-notice sp-notice--error" role="alert" style={{ marginBottom: 16 }}>{error}</div>}

        <form className="sp-form" onSubmit={onSubmit} noValidate>
          <div className="sp-field">
            <label className="sp-label" htmlFor="fp-email">Email</label>
            <div className="sp-input-wrap">
              <span className="sp-ic-left"><MailIcon s={18} /></span>
              <input
                id="fp-email" type="email" className="sp-input has-left"
                value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" placeholder="you@company.com" required
              />
            </div>
          </div>

          <button type="submit" className="sp-btn sp-btn--primary" disabled={loading || !email}>
            {loading ? <><span className="sp-spin" /> Sending…</> : 'Send reset code'}
          </button>
        </form>

        <p className="sp-foot-switch" style={{ marginTop: 18 }}>
          Remembered it? <Link className="sp-link" to="/login">Back to sign in</Link>
        </p>
      </div>
    </AuthShell>
  );
}
