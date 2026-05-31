import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'src/hooks/useAuth.js';
import { Button } from 'src/common/components/Button';
import { Input } from 'src/common/components/Input';

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
      const authUrl = await import('src/controllers/authController.js').then(
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
    <div className="min-h-screen bg-gradient-to-br from-spurly-navy via-slate-900 to-spurly-navy flex items-center justify-center p-4">
      {/* Grid background pattern */}
      <div className="fixed inset-0 opacity-5">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative w-full max-w-md">
        {/* Gradient accents */}
        <div className="absolute -top-20 right-0 w-96 h-96 bg-spurly-purple rounded-full blur-3xl opacity-20 -z-10"></div>
        <div className="absolute -bottom-20 left-0 w-96 h-96 bg-spurly-blue rounded-full blur-3xl opacity-20 -z-10"></div>

        {/* Card */}
        <div className="relative bg-white border border-spurly-border rounded-spurly-lg shadow-spurly-lg p-8 overflow-hidden">
          {/* Corner decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-spurly-purple/5 to-transparent rounded-bl-3xl"></div>

          {/* Logo & Brand */}
          <div className="text-center mb-8 relative z-10">
            <div className="inline-block mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-spurly-purple to-spurly-blue rounded-spurly flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
            </div>
            <h1 className="text-dashboard-title font-bold bg-gradient-to-r from-spurly-purple to-spurly-blue bg-clip-text text-transparent mb-2">
              Spurly
            </h1>
            <p className="text-spurly-text-secondary text-body">Lead Management Platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <div className="bg-spurly-error/10 border border-spurly-error/30 text-spurly-error p-4 rounded-spurly text-label">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-label">
              <label className="flex items-center gap-2 text-spurly-text-secondary hover:text-spurly-navy-light cursor-pointer transition">
                <input type="checkbox" className="rounded w-4 h-4 border border-spurly-border" disabled={loading} />
                Remember me
              </label>
              <a href="#" className="text-spurly-purple hover:text-spurly-blue transition font-medium">
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full py-3 mt-6"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6 z-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-spurly-border"></div>
            </div>
            <div className="relative flex justify-center text-label">
              <span className="px-3 bg-white text-spurly-text-secondary">Or continue with</span>
            </div>
          </div>

          {/* LinkedIn Button */}
          <Button
            type="button"
            variant="secondary"
            onClick={handleLinkedInLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
            </svg>
            LinkedIn
          </Button>

          {/* Sign Up Link */}
          <p className="text-center text-spurly-text-secondary text-label mt-6 relative z-10">
            Don't have an account?{' '}
            <a href="#" className="text-spurly-purple hover:text-spurly-blue font-semibold transition">
              Sign up
            </a>
          </p>
        </div>

        {/* Footer text */}
        <p className="text-center text-spurly-text-secondary text-label opacity-60 mt-8 relative z-10">
          100% secure • LinkedIn compliant • Your data is safe
        </p>
      </div>
    </div>
  );
}
