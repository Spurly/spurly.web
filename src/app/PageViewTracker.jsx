import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// The Google tag's own `gtag('config', ...)` call in index.html already fires
// the pageview for whatever URL the document loaded with, so the first render
// here is skipped -- sending it again would double-count that view. Every
// route change after that is a client-side navigation the tag never sees on
// its own, so it's reported manually.
export function PageViewTracker() {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [location]);

  return null;
}
