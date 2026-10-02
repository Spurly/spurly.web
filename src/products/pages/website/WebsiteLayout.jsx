import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import './website.css';

/**
 * Wraps every public marketing route. Adds the `mkt` class to <body> so the
 * scoped website.css (all selectors prefixed `body.mkt`) activates. The class
 * is removed on unmount so dashboard routes are never affected.
 *
 * Body-level (not a wrapper div) because the webcam demo reads CSS variables
 * directly from document.body at runtime.
 */
export function WebsiteLayout() {
  const { pathname } = useLocation();

  // Activate scoping synchronously during render so child components (Webcam)
  // that read CSS variables off document.body on mount see the
  // marketing tokens. Child effects run before the parent effect below, so the
  // class must already be present by the time they read. Guarded + idempotent.
  if (typeof document !== 'undefined' && !document.body.classList.contains('mkt')) {
    document.body.classList.add('mkt');
  }

  useEffect(() => {
    const body = document.body;
    body.classList.add('mkt');
    return () => {
      body.classList.remove('mkt');
      body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Outlet />
  );
}
