import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from 'src/platform/auth/useAuth';
import { useToast } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { AuthShell, FeaturesAside } from './AuthShell.jsx';
import { MailIcon } from './icons.jsx';

/** Request a password-reset code (replaces the modal's "forgot" view). */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      toast.success('Reset code sent', { description: `Check ${email.trim()} for the code.` });
      navigate('/reset-password', { state: { email: email.trim() } });
    } catch (err) {
      toast.error(getToastError(err, "Couldn't send a reset code"));
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
