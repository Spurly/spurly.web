import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'src/hooks/useAuth';

/**
 * Marketing auth modal. Views:
 *   signin    — email + password
 *   signup    — name, email, password, confirm, optional referral → request OTP
 *   signupOtp — 6-digit email code → create account + sign in
 *   forgot    — email → request reset code
 *   reset     — code + new password → reset + sign in
 *
 * Talks to the same backend the extension uses, via the web's AuthContext.
 */
export function AuthModal({ initialView = 'signin', onClose }) {
  const navigate = useNavigate();
  const { login, requestSignupOtp, verifySignupOtp, forgotPassword, resetPassword } = useAuth();

  const [view, setView] = useState(initialView);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', referralCode: '', code: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const go = (next) => { setError(''); setNotice(''); setView(next); };
  const onSuccess = () => { onClose(); navigate('/dashboard'); };

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (view === 'signin') {
        await login(form.email.trim(), form.password);
        onSuccess();
      } else if (view === 'signup') {
        if (form.password !== form.confirmPassword) throw new Error('Passwords do not match');
        await requestSignupOtp({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
          referralCode: form.referralCode.trim() || undefined,
        });
        go('signupOtp');
        setNotice(`We emailed a 6-digit code to ${form.email.trim()}.`);
      } else if (view === 'signupOtp') {
        await verifySignupOtp({ email: form.email.trim(), code: form.code.trim() });
        onSuccess();
      } else if (view === 'forgot') {
        await forgotPassword(form.email.trim());
        go('reset');
        setNotice(`If an account exists, a reset code was sent to ${form.email.trim()}.`);
      } else if (view === 'reset') {
        if (form.password !== form.confirmPassword) throw new Error('Passwords do not match');
        await resetPassword({
          email: form.email.trim(),
          code: form.code.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        });
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const meta = {
    signin: { title: 'Welcome back', sub: 'Sign in to your Spurly account.' },
    signup: { title: 'Create your account', sub: 'Start free with 100 credits.' },
    signupOtp: { title: 'Verify your email', sub: 'Enter the 6-digit code we just sent you.' },
    forgot: { title: 'Reset your password', sub: "We'll email you a code to reset it." },
    reset: { title: 'Set a new password', sub: 'Enter the code and choose a new password.' },
  }[view];

  const showTabs = view === 'signin' || view === 'signup';

  return (
    <div className="auth-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="auth-modal" role="dialog" aria-modal="true" aria-label={meta.title}>
        <button type="button" className="auth-close" aria-label="Close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <div className="auth-head">
          <span className="auth-brand"><img src="/spurly-mark.png" alt="" /><span>Spurly</span></span>
          <h2 className="auth-title">{meta.title}</h2>
          <p className="auth-sub">{meta.sub}</p>
        </div>

        {showTabs && (
          <div className="auth-tabs" role="tablist">
            <button type="button" className={'auth-tab' + (view === 'signin' ? ' is-active' : '')} onClick={() => go('signin')}>Sign in</button>
            <button type="button" className={'auth-tab' + (view === 'signup' ? ' is-active' : '')} onClick={() => go('signup')}>Sign up</button>
          </div>
        )}

        {notice && <div className="auth-notice">{notice}</div>}
        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={submit}>
          {view === 'signup' && (
            <label className="auth-field">
              <span>Full name</span>
              <input type="text" value={form.name} onChange={set('name')} autoComplete="name" required placeholder="Jane Doe" />
            </label>
          )}

          {(view === 'signin' || view === 'signup' || view === 'forgot') && (
            <label className="auth-field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required placeholder="you@company.com" />
            </label>
          )}

          {(view === 'signupOtp' || view === 'reset') && (
            <label className="auth-field">
              <span>Verification code</span>
              <input type="text" inputMode="numeric" value={form.code} onChange={set('code')} required placeholder="123456" maxLength={6} className="auth-code" />
            </label>
          )}

          {(view === 'signin' || view === 'signup' || view === 'reset') && (
            <label className="auth-field">
              <span>{view === 'reset' ? 'New password' : 'Password'}</span>
              <input type="password" value={form.password} onChange={set('password')} autoComplete={view === 'signin' ? 'current-password' : 'new-password'} required placeholder="••••••••" />
            </label>
          )}

          {(view === 'signup' || view === 'reset') && (
            <label className="auth-field">
              <span>Confirm password</span>
              <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" required placeholder="••••••••" />
            </label>
          )}

          {view === 'signup' && (
            <label className="auth-field">
              <span>Referral code <em className="auth-opt">(optional)</em></span>
              <input type="text" value={form.referralCode} onChange={set('referralCode')} placeholder="Enter a code if you have one" />
            </label>
          )}

          {view === 'signin' && (
            <button type="button" className="auth-link auth-link-right" onClick={() => go('forgot')}>Forgot password?</button>
          )}

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? 'Please wait…' : (
              view === 'signin' ? 'Sign in'
              : view === 'signup' ? 'Send verification code'
              : view === 'signupOtp' ? 'Verify & create account'
              : view === 'forgot' ? 'Send reset code'
              : 'Reset password'
            )}
          </button>
        </form>

        <div className="auth-foot">
          {view === 'signin' && (
            <span>New to Spurly? <button type="button" className="auth-link" onClick={() => go('signup')}>Create an account</button></span>
          )}
          {view === 'signup' && (
            <span>Already have an account? <button type="button" className="auth-link" onClick={() => go('signin')}>Sign in</button></span>
          )}
          {view === 'signupOtp' && (
            <span>Wrong email? <button type="button" className="auth-link" onClick={() => go('signup')}>Go back</button></span>
          )}
          {(view === 'forgot' || view === 'reset') && (
            <span>Remembered it? <button type="button" className="auth-link" onClick={() => go('signin')}>Back to sign in</button></span>
          )}
        </div>
      </div>
    </div>
  );
}
