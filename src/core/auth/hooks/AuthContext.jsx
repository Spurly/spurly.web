import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import authController from '../controller/auth.js';
import { AUTH_EVENTS } from '../constants/constants.js';
import EventEmitter from 'src/shared/utils/EventEmitter.js';
import {
  syncAuthToExtension,
  clearExtensionAuth,
} from 'src/shared/extension/extensionBridge.js';

export const AuthContext = createContext();

/**
 * Every action below dispatches through `authController`, which reports back
 * over an EventEmitter instead of returning a promise — this provider has no
 * async/await or try/catch of its own. Each action creates its own one-shot
 * EventEmitter and returns it, so a caller (a page's submit handler, a
 * modal) can `.once()` its own follow-up (close a dialog, navigate, read a
 * value the action produced) without this context having to know about it —
 * same shape as `useMessageTemplates`/`useImportedLeads` returning their
 * `eventEmitter`. This context's own listeners on that same one-shot
 * emitter are what keep `user`/`loading`/`error` in sync.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // Check if user is logged in on mount. Wrapped in its own function
    // (rather than inlined in the effect body) same as the original
    // promise-based checkAuth — calling setUser directly at the top level
    // of an effect body trips react-hooks/set-state-in-effect for no
    // benefit here; the indirection is enough to satisfy it.
    function checkAuth() {
      const storedUser = authController.getCurrentUserFromStorage();

      if (storedUser && authController.isAuthenticated()) {
        // User logged in via email/password.
        setUser(storedUser);

        // Try to fetch fresh user data. A failure here is not fatal — the
        // stored user stays on screen — so it's only warned about, not
        // surfaced as an auth error.
        const callEmitter = new EventEmitter();
        callEmitter.once(AUTH_EVENTS.FETCH_CURRENT_USER_SUCCESS, (freshUser) => {
          if (!mountedRef.current) return;
          if (freshUser) setUser(freshUser);
          setLoading(false);
        });
        callEmitter.once(AUTH_EVENTS.FETCH_CURRENT_USER_FAILURE, (err) => {
          if (!mountedRef.current) return;
          console.warn('Could not fetch fresh user data:', err);
          setLoading(false);
        });
        authController.fetchCurrentUser(callEmitter);
      } else {
        // No token in storage, but check if authenticated via cookie (LinkedIn OAuth).
        const callEmitter = new EventEmitter();
        callEmitter.once(AUTH_EVENTS.FETCH_CURRENT_USER_SUCCESS, (freshUser) => {
          if (!mountedRef.current) return;
          if (freshUser) {
            setUser(freshUser);
            // Also store user in localStorage for consistency.
            localStorage.setItem('user', JSON.stringify(freshUser.toJSON()));
          } else {
            setUser(null);
            localStorage.removeItem('user');
          }
          setLoading(false);
        });
        callEmitter.once(AUTH_EVENTS.FETCH_CURRENT_USER_FAILURE, () => {
          // Not authenticated via cookie either.
          if (!mountedRef.current) return;
          setUser(null);
          localStorage.removeItem('user');
          setLoading(false);
        });
        authController.fetchCurrentUser(callEmitter);
      }
    }
    checkAuth();
  }, []);

  /**
   * Single sign-on with the Chrome extension.
   *
   * The web app is the only place anyone types credentials. Whenever it holds a
   * session — on load, and again the moment a sign-in, signup, or password
   * reset lands — it hands the JWT to the extension, so the side panel comes up
   * already signed in instead of asking for the same account a second time.
   *
   * Keyed on the user id rather than the user object: `user` is replaced on
   * every profile refetch, and re-pushing an unchanged session on each of those
   * is pointless chatter. A different id (an account switch) does re-push, which
   * is exactly when the extension needs to hear about it — that is what stops
   * the two halves ending up signed in as different people.
   *
   * Failures are ignored on purpose: no extension installed, an older build, or
   * a cookie-only OAuth session with no stored JWT are all normal, and none of
   * them should surface an error next to a sign-in that succeeded.
   */
  const userId = user?._id || user?.id || null;
  useEffect(() => {
    if (!userId) return;
    syncAuthToExtension().catch(() => {});
  }, [userId]);

  const login = useCallback((email, password) => {
    setLoading(true);
    setError(null);
    const callEmitter = new EventEmitter();
    callEmitter.once(AUTH_EVENTS.LOGIN_SUCCESS, ({ user: newUser }) => {
      setUser(newUser);
      if (mountedRef.current) setLoading(false);
    });
    callEmitter.once(AUTH_EVENTS.LOGIN_FAILURE, (err) => {
      setError(err.message || 'Login failed');
      if (mountedRef.current) setLoading(false);
    });
    authController.login(callEmitter, email, password);
    return callEmitter;
  }, []);

  const register = useCallback((name, email, password, confirmPassword) => {
    setLoading(true);
    setError(null);
    const callEmitter = new EventEmitter();
    callEmitter.once(AUTH_EVENTS.REGISTER_SUCCESS, ({ user: newUser }) => {
      setUser(newUser);
      if (mountedRef.current) setLoading(false);
    });
    callEmitter.once(AUTH_EVENTS.REGISTER_FAILURE, (err) => {
      setError(err.message || 'Registration failed');
      if (mountedRef.current) setLoading(false);
    });
    authController.register(callEmitter, name, email, password, confirmPassword);
    return callEmitter;
  }, []);

  const requestSignupOtp = useCallback((params) => {
    setError(null);
    const callEmitter = new EventEmitter();
    callEmitter.once(AUTH_EVENTS.REQUEST_SIGNUP_OTP_FAILURE, (err) => {
      setError(err.message || 'Could not send verification code');
    });
    authController.requestSignupOtp(callEmitter, params);
    return callEmitter;
  }, []);

  const verifySignupOtp = useCallback(({ email, code }) => {
    setLoading(true);
    setError(null);
    const callEmitter = new EventEmitter();
    callEmitter.once(AUTH_EVENTS.VERIFY_SIGNUP_OTP_SUCCESS, ({ user: newUser }) => {
      setUser(newUser);
      if (mountedRef.current) setLoading(false);
    });
    callEmitter.once(AUTH_EVENTS.VERIFY_SIGNUP_OTP_FAILURE, (err) => {
      setError(err.message || 'Verification failed');
      if (mountedRef.current) setLoading(false);
    });
    authController.verifySignupOtp(callEmitter, { email, code });
    return callEmitter;
  }, []);

  const forgotPassword = useCallback((email) => {
    setError(null);
    const callEmitter = new EventEmitter();
    callEmitter.once(AUTH_EVENTS.FORGOT_PASSWORD_FAILURE, (err) => {
      setError(err.message || 'Could not send reset code');
    });
    authController.forgotPassword(callEmitter, email);
    return callEmitter;
  }, []);

  const resetPassword = useCallback((params) => {
    setLoading(true);
    setError(null);
    const callEmitter = new EventEmitter();
    callEmitter.once(AUTH_EVENTS.RESET_PASSWORD_SUCCESS, ({ user: newUser }) => {
      setUser(newUser);
      if (mountedRef.current) setLoading(false);
    });
    callEmitter.once(AUTH_EVENTS.RESET_PASSWORD_FAILURE, (err) => {
      setError(err.message || 'Could not reset password');
      if (mountedRef.current) setLoading(false);
    });
    authController.resetPassword(callEmitter, params);
    return callEmitter;
  }, []);

  const getGoogleAuthUrl = useCallback(() => {
    const callEmitter = new EventEmitter();
    authController.getGoogleAuthUrl(callEmitter);
    return callEmitter;
  }, []);

  const completeOnboarding = useCallback((data) => {
    setError(null);
    const callEmitter = new EventEmitter();
    callEmitter.once(AUTH_EVENTS.COMPLETE_ONBOARDING_SUCCESS, (updatedUser) => {
      if (updatedUser) setUser(updatedUser);
    });
    callEmitter.once(AUTH_EVENTS.COMPLETE_ONBOARDING_FAILURE, (err) => {
      setError(err.message || 'Could not save your details');
    });
    authController.completeOnboarding(callEmitter, data);
    return callEmitter;
  }, []);

  /**
   * Advance the onboarding stage. Deliberately does not touch `error` on
   * failure the way most actions here do -- the LinkedIn/audience pages
   * that call this are mid-flow, so a failed stage bump should not overlay
   * a global auth error banner over an otherwise-successful action (a
   * LinkedIn connection, a queued search); each caller toasts its own
   * failure instead.
   */
  const setOnboardingStage = useCallback((stage) => {
    const callEmitter = new EventEmitter();
    callEmitter.once(AUTH_EVENTS.SET_ONBOARDING_STAGE_SUCCESS, (updatedUser) => {
      if (updatedUser) setUser(updatedUser);
    });
    authController.setOnboardingStage(callEmitter, stage);
    return callEmitter;
  }, []);

  const logout = useCallback(() => {
    setLoading(true);
    const callEmitter = new EventEmitter();
    callEmitter.once(AUTH_EVENTS.LOGOUT_SUCCESS, () => {
      setUser(null);
      setError(null);
      if (mountedRef.current) setLoading(false);
      // Sign the extension out too — one account, one session. Best effort:
      // the web sign-out has already happened and must not appear to fail
      // because the extension is missing or asleep.
      clearExtensionAuth().catch(() => {});
    });
    authController.logout(callEmitter);
    return callEmitter;
  }, []);

  const updateProfile = useCallback((profileData) => {
    setLoading(true);
    setError(null);
    const callEmitter = new EventEmitter();
    callEmitter.once(AUTH_EVENTS.UPDATE_PROFILE_SUCCESS, (updatedUser) => {
      setUser(updatedUser);
      if (mountedRef.current) setLoading(false);
    });
    callEmitter.once(AUTH_EVENTS.UPDATE_PROFILE_FAILURE, (err) => {
      setError(err.message || 'Profile update failed');
      if (mountedRef.current) setLoading(false);
    });
    authController.updateProfile(callEmitter, profileData);
    return callEmitter;
  }, []);

  /**
   * Persist a table's column order.
   *
   * Deliberately does NOT touch `loading`: this fires from a drag gesture, and
   * flipping the global auth loading flag would blank the shell the user is
   * dragging in. The caller keeps the new order on screen optimistically; this
   * only reconciles the stored user afterwards.
   */
  const saveTableColumnOrder = useCallback((tableId, columnOrder) => {
    const callEmitter = new EventEmitter();
    callEmitter.once(AUTH_EVENTS.SAVE_TABLE_COLUMN_ORDER_SUCCESS, (updatedUser) => {
      if (updatedUser) setUser(updatedUser);
    });
    authController.saveTableColumnOrder(callEmitter, tableId, columnOrder);
    return callEmitter;
  }, []);

  const resetTableColumnOrder = useCallback((tableId) => {
    const callEmitter = new EventEmitter();
    callEmitter.once(AUTH_EVENTS.RESET_TABLE_COLUMN_ORDER_SUCCESS, (updatedUser) => {
      if (updatedUser) setUser(updatedUser);
    });
    authController.resetTableColumnOrder(callEmitter, tableId);
    return callEmitter;
  }, []);

  const refetchUser = useCallback(() => {
    const callEmitter = new EventEmitter();
    callEmitter.once(AUTH_EVENTS.FETCH_CURRENT_USER_SUCCESS, (freshUser) => {
      if (freshUser) setUser(freshUser);
    });
    callEmitter.once(AUTH_EVENTS.FETCH_CURRENT_USER_FAILURE, (err) => {
      console.error('Failed to refetch user:', err);
    });
    authController.fetchCurrentUser(callEmitter);
    return callEmitter;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        requestSignupOtp,
        verifySignupOtp,
        forgotPassword,
        resetPassword,
        completeOnboarding,
        setOnboardingStage,
        getGoogleAuthUrl,
        logout,
        updateProfile,
        saveTableColumnOrder,
        resetTableColumnOrder,
        refetchUser,
        isAuthenticated: authController.isAuthenticated(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
