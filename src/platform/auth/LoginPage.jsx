import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from 'src/platform/auth/useAuth';
import { useToast } from 'src/ui/primitives';
import { getToastError } from 'src/shared/utils/apiError';
import { AuthShell, FeaturesAside } from './AuthShell.jsx';
import { GoogleButton, PasswordField } from './widgets.jsx';
import { MailIcon } from './icons.jsx';

/**
 * Sign in page (replaces the old modal's "signin" view).
 * On success, sends the user to onboarding if they never finished it, otherwise
 * straight to the dashboard. Honors a `?next=` redirect target.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  // Surface OAuth failures redirected here as ?error= by the backend callback.
  const oauthError = params.get('error');
  useEffect(() => {
    /* A query param is attacker-controllable — anyone can send a user to
       /login?error=<anything>. Through the same gate as a server message, so
       the toast can't be used to put arbitrary text on the page. */
    if (oauthError) toast.error(getToastError(oauthError, "Couldn't sign you in"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oauthError]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await login(form.email.trim(), form.password);
      toast.success('Signed in');
      const next = params.get('next');
      if (next) navigate(next, { replace: true });
      else if (user && user.onboardingComplete === false) navigate('/onboarding', { replace: true });
      else navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(getToastError(err, "Couldn't sign you in"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      aside={<FeaturesAside />}
      topRight={<>New to Spurly? <Link to="/signup">Create an account</Link></>}
    >
      <div className="sp-card">
        <div className="sp-card__head">
          <h2 className="sp-card__title">Welcome back</h2>
          <p className="sp-card__sub">Sign in to your Spurly account.</p>
        </div>

        <GoogleButton label="Sign in with Google" onError={(msg) => toast.error(getToastError(msg, "Google sign-in failed"))} />

        <div className="sp-or" style={{ margin: '18px 0' }}>or</div>

        <form className="sp-form" onSubmit={onSubmit} noValidate>
          <div className="sp-field">
            <label className="sp-label" htmlFor="li-email">Email</label>
            <div className="sp-input-wrap">
              <span className="sp-ic-left"><MailIcon s={18} /></span>
              <input
                id="li-email" type="email" className="sp-input has-left"
                value={form.email} onChange={set('email')}
                autoComplete="email" placeholder="you@company.com" required
              />
            </div>
          </div>

          <div className="sp-field">
            <label className="sp-label" htmlFor="li-password">Password</label>
            <PasswordField
              id="li-password" value={form.password} onChange={set('password')}
              autoComplete="current-password"
            />
            <div className="sp-row-right">
              <Link className="sp-link" to="/forgot-password">Forgot password?</Link>
            </div>
          </div>

          <button type="submit" className="sp-btn sp-btn--primary" disabled={loading || !form.email || !form.password}>
            {loading ? <><span className="sp-spin" /> Signing in…</> : 'Sign in'}
          </button>
        </form>

        <p className="sp-foot-switch" style={{ marginTop: 18 }}>
          New to Spurly? <Link className="sp-link" to="/signup">Create an account</Link>
        </p>
      </div>
    </AuthShell>
  );
}
