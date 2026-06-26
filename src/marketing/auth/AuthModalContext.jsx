import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthModal } from 'src/marketing/components/AuthModal.jsx';

const ALLOWED_VIEWS = ['signin', 'signup', 'forgot'];

/**
 * Provides a single shared auth modal for the marketing site. Any marketing
 * component can call `openAuth('signin' | 'signup' | 'forgot')` to open it.
 */
const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [view, setView] = useState(null); // null = closed
  const [searchParams, setSearchParams] = useSearchParams();

  const openAuth = useCallback((initialView = 'signin') => setView(initialView), []);
  const closeAuth = useCallback(() => setView(null), []);

  // Allow other parts of the app to deep-link the modal open, e.g. redirects
  // after logout or an expired session land on `/?auth=signin`.
  useEffect(() => {
    const requested = searchParams.get('auth');
    if (requested && ALLOWED_VIEWS.includes(requested)) {
      setView(requested);
      const next = new URLSearchParams(searchParams);
      next.delete('auth');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <AuthModalContext.Provider value={{ openAuth, closeAuth, isOpen: view !== null }}>
      {children}
      {view !== null && <AuthModal initialView={view} onClose={closeAuth} />}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider');
  return ctx;
}
