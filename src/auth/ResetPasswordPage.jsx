import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from 'src/hooks/useAuth';
import { AuthShell, FeaturesAside } from './AuthShell.jsx';
import { PasswordField, PasswordRules, passwordMeetsRules } from './widgets.jsx';
import { MailIcon } from './icons.jsx';

/**
 * Set a new password with the emailed 6-digit code (replaces the modal's
 * "reset" view). Signs the user in on success. The email is prefilled when
 * arriving from the forgot-password page but stays editable.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuth();

  const [form, setForm] = useState({
    email: location.state?.email || '',
    code: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!passwordMeetsRules(form.password)) {
      setError('Please choose a password that meets all the requirements.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({
        email: form.email.trim(),
        code: form.code.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not reset your password. Please try again.');
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
          <h2 className="sp-card__title">Set a new password</h2>
          <p className="sp-card__sub">Enter the code and choose a new password.</p>
        </div>

        {error && <div className="sp-notice sp-notice--error" role="alert" style={{ marginBottom: 16 }}>{error}</div>}

        <form className="sp-form" onSubmit={onSubmit} noValidate>
          <div className="sp-field">
            <label className="sp-label" htmlFor="rp-email">Email</label>
            <div className="sp-input-wrap">
              <span className="sp-ic-left"><MailIcon s={18} /></span>
              <input
                id="rp-email" type="email" className="sp-input has-left"
                value={form.email} onChange={set('email')}
                autoComplete="email" placeholder="you@company.com" required
              />
            </div>
          </div>

          <div className="sp-field">
            <label className="sp-label" htmlFor="rp-code">Verification code</label>
            <input
              id="rp-code" type="text" inputMode="numeric" maxLength={6}
              className="sp-input"
              style={{ letterSpacing: '0.4em', textAlign: 'center', fontWeight: 700 }}
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
              placeholder="123456" required
            />
          </div>

          <div className="sp-field">
            <label className="sp-label" htmlFor="rp-password">New password</label>
            <PasswordField
              id="rp-password" value={form.password} onChange={set('password')}
              placeholder="Create a password" autoComplete="new-password"
            />
            <PasswordRules value={form.password} />
          </div>

          <div className="sp-field">
            <label className="sp-label" htmlFor="rp-confirm">Confirm password</label>
            <PasswordField
              id="rp-confirm" value={form.confirmPassword} onChange={set('confirmPassword')}
              placeholder="Re-enter your password" autoComplete="new-password"
            />
          </div>

          <button type="submit" className="sp-btn sp-btn--primary" disabled={loading || form.code.length !== 6}>
            {loading ? <><span className="sp-spin" /> Resetting…</> : 'Reset password'}
          </button>
        </form>

        <p className="sp-foot-switch" style={{ marginTop: 18 }}>
          Remembered it? <Link className="sp-link" to="/login">Back to sign in</Link>
        </p>
      </div>
    </AuthShell>
  );
}
