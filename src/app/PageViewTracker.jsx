import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { appPageTitle, trackPageView } from 'src/shared/analytics/analytics.js';

// index.html loads the Google tag with `send_page_view: false`, so this is the
// only place page views are sent -- the first load and every client-side
// navigation -- each tagged with a website/app content_group. App routes get
// their own document.title here ("Contacts · Spurly"); public pages set theirs
// through <Seo>, so the short delay lets that title land before we read it.
export function PageViewTracker() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const appTitle = appPageTitle(pathname);
    if (appTitle) document.title = appTitle;

    const timer = setTimeout(() => {
      trackPageView({ path: pathname + search, title: document.title });
    }, 150);
    return () => clearTimeout(timer);
  }, [pathname, search]);

  return null;
}
