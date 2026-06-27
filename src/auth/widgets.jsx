import { useState } from 'react';
import { useAuth } from 'src/hooks/useAuth';
import {
  GoogleIcon, EyeIcon, EyeOffIcon, LockIcon, ShieldIcon, CheckCircleIcon,
} from './icons.jsx';

/**
 * "Continue with Google" button. Fetches the Google OAuth authorization URL
 * from the backend, then sends the browser to Google. The backend callback sets
 * an httpOnly cookie and redirects back into the app (onboarding or dashboard).
 * Errors are surfaced via the optional `onError` callback.
 */
export function GoogleButton({ label = 'Continue with Google', onError }) {
  const { getGoogleAuthUrl } = useAuth();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    onError?.('');
    try {
      const url = await getGoogleAuthUrl();
      if (!url) throw new Error('Could not start Google sign-in. Please try again.');
      window.location.assign(url);
      // No reset: the browser navigates away on success.
    } catch (err) {
      onError?.(err?.message || 'Could not start Google sign-in. Please try again.');
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="sp-btn sp-btn--google"
      onClick={onClick}
      disabled={loading}
      aria-busy={loading}
    >
      {loading ? <span className="sp-spin" style={{ borderTopColor: 'var(--sp-primary)', borderColor: 'rgba(79,70,229,0.3)' }} /> : <GoogleIcon s={20} />}
      {loading ? 'Connecting…' : label}
    </button>
  );
}

/** Password input with a show/hide toggle and a left lock icon. */
export function PasswordField({
  id, value, onChange, placeholder = '••••••••', autoComplete = 'new-password',
  error, withIcon = true,
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="sp-input-wrap">
      {withIcon && <span className="sp-ic-left"><LockIcon s={18} /></span>}
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className={'sp-input has-right' + (withIcon ? ' has-left' : '') + (error ? ' is-error' : '')}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        className="sp-eye"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOffIcon s={18} /> : <EyeIcon s={18} />}
      </button>
    </div>
  );
}

/** The three password rules shown under the signup password field. */
export const PASSWORD_RULES = [
  { key: 'len', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { key: 'num', label: 'Include a number', test: (v) => /\d/.test(v) },
  { key: 'upper', label: 'Include an uppercase letter', test: (v) => /[A-Z]/.test(v) },
];

export function passwordMeetsRules(v) {
  return PASSWORD_RULES.every((r) => r.test(v || ''));
}

export function PasswordRules({ value }) {
  return (
    <div className="sp-pwd-rules">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value || '');
        return (
          <div key={r.key} className={'sp-pwd-rule' + (ok ? ' ok' : '')}>
            <span className="sp-pwd-rule__dot"><CheckCircleIcon s={14} /></span>
            {r.label}
          </div>
        );
      })}
    </div>
  );
}

/** Trust badges row under the signup form. */
export function TrustBadges() {
  const items = [
    { Icon: ShieldIcon, t: '14-day free trial', d: 'No credit card required' },
    { Icon: LockIcon, t: 'GDPR Compliant', d: 'Your data is safe' },
    { Icon: CheckCircleIcon, t: 'Cancel anytime', d: 'No hidden charges' },
  ];
  return (
    <div className="sp-trust">
      {items.map(({ Icon, t, d }) => (
        <div className="sp-trust__item" key={t}>
          <span className="sp-trust__ic"><Icon s={22} /></span>
          <div>
            <div className="sp-trust__t">{t}</div>
            <div className="sp-trust__d">{d}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
