import { createContext, useState, useEffect } from 'react';
import authController from 'src/controllers/authController.js';

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

  const logout = async () => {
    setLoading(true);
    try {
      await authController.logout();
      setUser(null);
      setError(null);
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
        logout,
        updateProfile,
        refetchUser,
        isAuthenticated: authController.isAuthenticated(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
