import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from 'src/core/auth/hooks/useAuth';
import { useToast } from 'src/core/primitives';
import { getApiErrorMessage } from 'src/shared/utils/apiError';
import authController from 'src/core/auth/controller/auth.js';
import { AUTH_EVENTS } from 'src/core/auth/constants/constants.js';
import EventEmitter from 'src/shared/utils/EventEmitter.js';

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

    const handleCallback = () => {
      // Get the authorization code from URL parameters
      const code = searchParams.get('code');
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
      const callEmitter = new EventEmitter();
      callEmitter.once(AUTH_EVENTS.HANDLE_LINKEDIN_CALLBACK_SUCCESS, ({ user, token }) => {
        if (user && token) {
          // Refresh the auth context, then land on the dashboard once it does.
          const refetchEmitter = refetchUser();
          refetchEmitter.once(AUTH_EVENTS.FETCH_CURRENT_USER_SUCCESS, () => {
            toast.success('Signed in with LinkedIn');
            navigate('/dashboard');
          });
          refetchEmitter.once(AUTH_EVENTS.FETCH_CURRENT_USER_FAILURE, (err) => {
            console.error('LinkedIn callback error:', err);
            fail(getApiErrorMessage(err, 'LinkedIn login failed. Please try again.'));
          });
        } else {
          fail('Failed to complete LinkedIn login');
        }
      });
      callEmitter.once(AUTH_EVENTS.HANDLE_LINKEDIN_CALLBACK_FAILURE, (err) => {
        console.error('LinkedIn callback error:', err);
        fail(getApiErrorMessage(err, 'LinkedIn login failed. Please try again.'));
      });
      authController.handleLinkedInCallback(callEmitter, code);
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
        <h1 className="text-[length:var(--ui-t-metric)] font-medium text-white mb-4">Completing LinkedIn Login</h1>
        <p className="text-[var(--ui-text-secondary)] text-[length:var(--ui-t-body)]">Please wait while we authenticate you...</p>

        {error && (
          <div className="mt-8 text-[var(--ui-danger-fg)] text-center">
            <p className="text-[length:var(--ui-t-body)] font-medium mb-2">⚠️ {error}</p>
            <p className="text-[length:var(--ui-t-label)]">Redirecting back to login page...</p>
          </div>
        )}
      </div>
    </div>
  );
}
