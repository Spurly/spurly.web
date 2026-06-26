import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AuthModalProvider } from 'src/marketing/auth/AuthModalContext.jsx';
import './marketing.css';

/**
 * Wraps every public marketing route. Adds the `mkt` class to <body> so the
 * scoped marketing.css (all selectors prefixed `body.mkt`) activates, and sets
 * the default palette the live site shipped with. The class + data attributes
 * are removed on unmount so dashboard routes are never affected.
 *
 * Body-level (not a wrapper div) because several marketing components read CSS
 * variables and data-* attributes directly from document.body at runtime.
 */
export function MarketingLayout() {
  const { pathname } = useLocation();

  // Activate scoping synchronously during render so child components (Globe,
  // Webcam, DotGlow) that read CSS variables off document.body on mount see the
  // marketing tokens. Child effects run before the parent effect below, so the
  // class must already be present by the time they read. Guarded + idempotent.
  if (typeof document !== 'undefined' && !document.body.classList.contains('mkt')) {
    document.body.classList.add('mkt');
    if (!document.body.hasAttribute('data-palette')) {
      document.body.setAttribute('data-palette', 'violet');
    }
  }

  useEffect(() => {
    const body = document.body;
    body.classList.add('mkt');
    if (!body.hasAttribute('data-palette')) {
      body.setAttribute('data-palette', 'violet');
    }
    return () => {
      body.classList.remove('mkt');
      body.removeAttribute('data-palette');
      body.removeAttribute('data-frost');
      body.removeAttribute('data-energy');
      body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <AuthModalProvider>
      <Outlet />
    </AuthModalProvider>
  );
}
