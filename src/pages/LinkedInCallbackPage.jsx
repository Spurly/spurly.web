import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import authController from '../controllers/authController';

export function LinkedInCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refetchUser } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL parameters
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        // Check for errors from LinkedIn
        if (errorParam) {
          setError(`LinkedIn login failed: ${errorParam}`);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Check if we have the code
        if (!code) {
          setError('No authorization code received from LinkedIn');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Exchange code for token
        const result = await authController.handleLinkedInCallback(code);

        if (result && result.token && result.user) {
          // Refresh the auth context
          await refetchUser();
          // Redirect to dashboard
          navigate('/dashboard');
        } else {
          setError('Failed to complete LinkedIn login');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err) {
        console.error('LinkedIn callback error:', err);
        setError(err.message || 'LinkedIn login failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, refetchUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-spurly-navy via-slate-900 to-spurly-navy flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
            <div className="w-12 h-12 border-4 border-white/20 border-t-spurly-purple rounded-full animate-spin"></div>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Completing LinkedIn Login</h1>
        <p className="text-spurly-text-secondary text-lg">Please wait while we authenticate you...</p>

        {error && (
          <div className="mt-8 text-spurly-error text-center">
            <p className="text-lg font-semibold mb-2">⚠️ {error}</p>
            <p className="text-sm">Redirecting back to login page...</p>
          </div>
        )}
      </div>
    </div>
  );
}
