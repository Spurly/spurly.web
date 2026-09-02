import { createContext, useState, useEffect } from 'react';
import authController from 'src/core/controllers/authController.js';
import {
  syncAuthToExtension,
  clearExtensionAuth,
} from 'src/core/extension/extensionBridge.js';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      try {
        // First try to get from local storage (for email/password login)
        const storedUser = authController.getCurrentUserFromStorage();

        if (storedUser && authController.isAuthenticated()) {
          // User logged in via email/password
          setUser(storedUser);

          // Try to fetch fresh user data
          try {
            const freshUser = await authController.fetchCurrentUser();
            if (freshUser) {
              setUser(freshUser);
            }
          } catch (err) {
            console.warn('Could not fetch fresh user data:', err);
          }
        } else {
          // No token in storage, but check if authenticated via cookie (LinkedIn OAuth)
          try {
            const freshUser = await authController.fetchCurrentUser();
            if (freshUser) {
              setUser(freshUser);
              // Also store user in localStorage for consistency
              localStorage.setItem('user', JSON.stringify(freshUser.toJSON()));
            } else {
              setUser(null);
              localStorage.removeItem('user');
            }
          } catch (err) {
            // Not authenticated via cookie either
            setUser(null);
            localStorage.removeItem('user');
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

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

  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const { user, token } = await authController.login(email, password);
      setUser(user);
      return { user, token };
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, confirmPassword) => {
    setLoading(true);
    setError(null);

    try {
      const { user, token } = await authController.register(
        name,
        email,
        password,
        confirmPassword
      );
      setUser(user);
      return { user, token };
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const requestSignupOtp = async (params) => {
    setError(null);
    try {
      return await authController.requestSignupOtp(params);
    } catch (err) {
      setError(err.message || 'Could not send verification code');
      throw err;
    }
  };

  const verifySignupOtp = async ({ email, code }) => {
    setLoading(true);
    setError(null);
    try {
      const { user, token } = await authController.verifySignupOtp({ email, code });
      setUser(user);
      return { user, token };
    } catch (err) {
      setError(err.message || 'Verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setError(null);
    try {
      return await authController.forgotPassword(email);
    } catch (err) {
      setError(err.message || 'Could not send reset code');
      throw err;
    }
  };

  const resetPassword = async (params) => {
    setLoading(true);
    setError(null);
    try {
      const { user, token } = await authController.resetPassword(params);
      setUser(user);
      return { user, token };
    } catch (err) {
      setError(err.message || 'Could not reset password');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getGoogleAuthUrl = async () => {
    return authController.getGoogleAuthUrl();
  };

  const completeOnboarding = async (data) => {
    setError(null);
    try {
      const updatedUser = await authController.completeOnboarding(data);
      if (updatedUser) setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err.message || 'Could not save your details');
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authController.logout();
      setUser(null);
      setError(null);
      // Sign the extension out too — one account, one session. Best effort:
      // the web sign-out has already happened and must not appear to fail
      // because the extension is missing or asleep.
      clearExtensionAuth().catch(() => {});
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);

    try {
      const updatedUser = await authController.updateProfile(profileData);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      const errorMessage = err.message || 'Profile update failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Persist a table's column order.
   *
   * Deliberately does NOT touch `loading`: this fires from a drag gesture, and
   * flipping the global auth loading flag would blank the shell the user is
   * dragging in. The caller keeps the new order on screen optimistically; this
   * only reconciles the stored user afterwards.
   */
  const saveTableColumnOrder = async (tableId, columnOrder) => {
    const updatedUser = await authController.saveTableColumnOrder(tableId, columnOrder);
    if (updatedUser) setUser(updatedUser);
    return updatedUser;
  };

  const resetTableColumnOrder = async (tableId) => {
    const updatedUser = await authController.resetTableColumnOrder(tableId);
    if (updatedUser) setUser(updatedUser);
    return updatedUser;
  };

  const refetchUser = async () => {
    try {
      const freshUser = await authController.fetchCurrentUser();
      if (freshUser) {
        setUser(freshUser);
      }
      return freshUser;
    } catch (err) {
      console.error('Failed to refetch user:', err);
      throw err;
    }
  };

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
