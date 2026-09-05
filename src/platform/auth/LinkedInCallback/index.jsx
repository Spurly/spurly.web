import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from 'src/platform/auth/useAuth';
import { useToast } from 'src/ui/primitives';
import { getApiErrorMessage } from 'src/shared/utils/apiError';
import authController from 'src/platform/auth/controller';

export function LinkedInCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refetchUser } = useAuth();
  const toast = useToast();

  /* Kept alongside the toast: this page is otherwise a bare spinner, so if the
     toast auto-dismisses during the 3s redirect the user would be staring at
     "Completing LinkedIn Login" with no idea it had already failed. */
  const [error, setError] = useState('');

  useEffect(() => {
    /* `detail` is for the inline strip; the toast gets fixed copy. Every path
       into here already fails for the same user-visible reason. */
    const fail = (detail) => {
      setError(detail);
      toast.error("Couldn't finish signing you in with LinkedIn");
      setTimeout(() => navigate('/?auth=signin'), 3000);
    };

    const handleCallback = async () => {
      try {
        // Get the authorization code from URL parameters
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        // Check for errors from LinkedIn
        if (errorParam) {
          fail(`LinkedIn login failed: ${errorParam}`);
          return;
        }

        // Check if we have the code
        if (!code) {
          fail('No authorization code received from LinkedIn');
          return;
        }

        // Exchange code for token
        const result = await authController.handleLinkedInCallback(code);

        if (result && result.token && result.user) {
          // Refresh the auth context
          await refetchUser();
          toast.success('Signed in with LinkedIn');
          // Redirect to dashboard
          navigate('/dashboard');
        } else {
          fail('Failed to complete LinkedIn login');
        }
      } catch (err) {
        console.error('LinkedIn callback error:', err);
        fail(getApiErrorMessage(err, 'LinkedIn login failed. Please try again.'));
      }
    };

    handleCallback();
  }, [searchParams, navigate, refetchUser, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-spurly-navy via-slate-900 to-spurly-navy flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
            <div className="w-12 h-12 border-4 border-white/20 border-t-spurly-purple rounded-full animate-spin"></div>
          </div>
        </div>
        <h1 className="text-[24px] font-medium text-white mb-4">Completing LinkedIn Login</h1>
        <p className="text-[var(--ui-text-secondary)] text-[14px]">Please wait while we authenticate you...</p>

        {error && (
          <div className="mt-8 text-[var(--ui-danger-fg)] text-center">
            <p className="text-[14px] font-medium mb-2">⚠️ {error}</p>
            <p className="text-[12px]">Redirecting back to login page...</p>
          </div>
        )}
      </div>
    </div>
  );
}
