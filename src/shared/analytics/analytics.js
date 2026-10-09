import { CHROME_URL } from 'src/shared/extension/constants.js';

/**
 * GA4 helpers. Everything here is safe to import from prerendered public pages:
 * nothing touches `window`/`document` until an event is actually sent (events
 * only fire from effects and click handlers, never during render).
 *
 * The Google tag itself is loaded in index.html with `send_page_view: false`;
 * PageViewTracker sends every page_view (first load included) so each one can
 * carry a `content_group`, which is how website and app traffic get split in
 * every GA4 report.
 */

// Public marketing paths. Must match PUBLIC_ROUTES in
// src/products/pages/website/seo.js (tests/analytics.test.js checks they agree).
const WEBSITE_EXACT = ['/', '/blog', '/support', '/book-demo', '/privacy', '/terms', '/pricing', '/about', '/security', '/changelog', '/glossary', '/templates'];
const WEBSITE_PREFIXES = ['/blog/', '/product/', '/solutions/', '/compare/', '/alternatives/', '/best/', '/glossary/', '/templates/', '/tools/'];

export function contentGroupFor(pathname) {
  if (WEBSITE_EXACT.includes(pathname) || WEBSITE_PREFIXES.some((p) => pathname.startsWith(p))) return 'website';
  return 'app';
}

// Own document.title per app route, so GA4 "Pages and screens" no longer shows
// one title for the whole app. First match wins. Public pages set their title
// through <Seo>, so they are not listed here.
const APP_TITLES = [
  [/^\/signup\/verify/, 'Verify email'],
  [/^\/signup/, 'Sign up'],
  [/^\/login/, 'Log in'],
  [/^\/forgot-password/, 'Forgot password'],
  [/^\/reset-password/, 'Reset password'],
  [/^\/subscribe/, 'Subscribe'],
  [/^\/onboarding\/linkedin/, 'Connect LinkedIn'],
  [/^\/onboarding\/audience/, 'Choose your audience'],
  [/^\/onboarding\/install/, 'Install the extension'],
  [/^\/onboarding/, 'Welcome'],
  [/^\/dashboard\/templates/, 'Templates'],
  [/^\/dashboard\/import/, 'Import'],
  [/^\/dashboard\/settings\/linkedin/, 'LinkedIn settings'],
  [/^\/dashboard\/settings/, 'Settings'],
  [/^\/dashboard\/notifications/, 'Notifications'],
  [/^\/dashboard\/(leads|people|enrich)/, 'Contacts'],
  [/^\/hub\/dashboard/, 'Dashboard'],
  [/^\/hub\/leads/, 'Leads'],
  [/^\/hub\/company/, 'Company'],
  [/^\/hub\/network/, 'Network'],
  [/^\/hub\/discover/, 'Discover'],
  [/^\/hub\/viewers/, 'Profile viewers'],
  [/^\/hub\/posts/, 'Posts'],
  [/^\/hub\/invitations/, 'Invitations'],
  [/^\/hub\/campaigns\/[^/]+/, 'Campaign'],
  [/^\/hub\/campaigns/, 'Campaigns'],
  [/^\/hub\/enrichment\/[^/]+/, 'Enrichment run'],
  [/^\/hub\/enrichment/, 'Enrichment'],
  [/^\/hub\/sequences\/new/, 'New sequence'],
  [/^\/hub\/sequences\/[^/]+/, 'Sequence'],
  [/^\/hub\/sequences/, 'Sequences'],
  [/^\/hub\/inbox/, 'Inbox'],
  [/^\/hub/, 'Hub'],
  [/^\/dashboard/, 'Dashboard'],
  [/^\/admin/, 'Admin'],
];

/** "Contacts · Spurly" for an app route, or null for a public page / unknown path. */
export function appPageTitle(pathname) {
  if (contentGroupFor(pathname) === 'website') return null;
  const hit = APP_TITLES.find(([re]) => re.test(pathname));
  return hit ? `${hit[1]} · Spurly` : null;
}

// 'IN' | 'INTL', set once the visitor's region is known (T1.10 / checkout).
// Added to every event so conversions can be split by market.
let userRegion = null;

export function setUserRegion(region) {
  userRegion = region === 'IN' ? 'IN' : region ? 'INTL' : null;
}

/** Fire a GA4 event. A no-op when the tag isn't loaded (prerender, tests, blockers). */
export function track(event, params = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', event, userRegion ? { user_region: userRegion, ...params } : params);
}

/** page_view with the website/app content group (also set for later events). */
export function trackPageView({ path, title }) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  const content_group = contentGroupFor(path.split('?')[0]);
  window.gtag('set', { content_group });
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: title,
    content_group,
  });
}

/** Short page name used as utm_campaign and link_location: "/" -> "home". */
export function campaignFor(pathname) {
  return pathname === '/' ? 'home' : pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'home';
}

/** Chrome Web Store URL tagged so installs can be traced to the page that sent them. */
export function chromeStoreUrl(campaign = 'home') {
  const url = new URL(CHROME_URL);
  url.search = '';
  url.searchParams.set('utm_source', 'getspurly');
  url.searchParams.set('utm_medium', 'website');
  url.searchParams.set('utm_campaign', campaign);
  return url.toString();
}
