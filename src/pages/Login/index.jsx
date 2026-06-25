import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'src/hooks/useAuth.js';
import { Button } from 'src/common/components/Button';
import { Input } from 'src/common/components/Input';
import { Mail, Lock, Linkedin } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInLogin = async () => {
    try {
      const authUrl = await import('src/core/controllers/authController.js').then(
        (module) => module.default.getLinkedInAuthUrl()
      );
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        setError('Could not get LinkedIn auth URL');
      }
    } catch (err) {
      console.error('LinkedIn auth error:', err);
      setError('Could not initialize LinkedIn login');
    }
  };

  return (
    <div
      className="relative min-h-screen grid place-items-center p-6"
      style={{
        background: `
          radial-gradient(ellipse 65% 55% at -4% -8%, rgba(124,58,237,0.52), transparent 62%),
          radial-gradient(ellipse 72% 62% at 104% 106%, rgba(56,189,248,0.50), transparent 60%),
          radial-gradient(ellipse 45% 40% at 55% 110%, rgba(124,58,237,0.18), transparent 60%),
          #f0f1f6
        `,
      }}
    >
      <div className="relative w-full max-w-[400px]">
        {/* Glass card */}
        <div
          className="glass-sheen rounded-[28px] p-8"
          style={{
            background: 'rgba(255,255,255,0.62)',
            backdropFilter: 'blur(48px) saturate(200%)',
            WebkitBackdropFilter: 'blur(48px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.58)',
            boxShadow: '0 32px 64px rgba(16,18,32,0.13), 0 8px 32px rgba(16,18,32,0.07), inset 0 1px 0 rgba(255,255,255,0.82), inset 0 -1px 0 rgba(0,0,0,0.04)',
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center text-center mb-7">
            <img src="/Spurly icon.png" alt="Spurly" className="w-14 h-14 object-contain mb-3" />
            <h1 className="text-[24px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
              Welcome back
            </h1>
            <p className="text-[14px] text-[var(--text-secondary)] mt-1">
              Sign in to your Spurly workspace
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-[12px] text-[13px] font-medium"
              style={{ background: 'var(--red-tint)', color: 'var(--red)', border: '1px solid rgba(255,69,58,0.2)' }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              leadingIcon={<Mail size={17} />}
              required
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leadingIcon={<Lock size={17} />}
              required
              disabled={loading}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded-[5px]"
                  style={{ accentColor: 'var(--accent)' }}
                  disabled={loading}
                />
                Remember me
              </label>
              <a
                href="#"
                className="text-[13px] font-semibold"
                style={{ color: 'var(--brand-purple)' }}
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full animate-spin"
                    style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
                  />
                  Signing in...
                </span>
              ) : 'Sign in'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--separator)' }} />
            <span className="text-[12px] text-[var(--text-tertiary)]">or continue with</span>
            <div className="flex-1 h-px" style={{ background: 'var(--separator)' }} />
          </div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            leadingIcon={<Linkedin size={18} />}
            onClick={handleLinkedInLogin}
            disabled={loading}
          >
            LinkedIn
          </Button>

          <p className="text-center text-[13px] text-[var(--text-secondary)] mt-6">
            New to Spurly?{' '}
            <a href="#" className="font-semibold" style={{ color: 'var(--brand-purple)' }}>
              Create an account
            </a>
          </p>
        </div>

        <p className="text-center text-[12px] text-[var(--text-tertiary)] mt-5">
          100% secure · LinkedIn compliant · Your data stays yours
        </p>
      </div>
    </div>
  );
}
