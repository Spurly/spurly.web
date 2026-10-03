import { describe, it, expect, vi, afterEach } from 'vitest';
import { PUBLIC_ROUTES } from 'src/products/pages/website/seo.js';
import {
  contentGroupFor, appPageTitle, track, trackPageView, chromeStoreUrl, campaignFor, setUserRegion,
} from 'src/shared/analytics/analytics.js';

afterEach(() => { delete window.gtag; setUserRegion(null); });

describe('analytics', () => {
  it('groups every public route as website and app routes as app', () => {
    for (const { path } of PUBLIC_ROUTES) expect(contentGroupFor(path)).toBe('website');
    for (const p of ['/signup', '/login', '/dashboard', '/hub/inbox', '/admin']) {
      expect(contentGroupFor(p)).toBe('app');
    }
  });

  it('titles app routes and leaves public pages to <Seo>', () => {
    expect(appPageTitle('/hub/campaigns')).toBe('Campaigns · Spurly');
    expect(appPageTitle('/hub/campaigns/abc123')).toBe('Campaign · Spurly');
    expect(appPageTitle('/blog')).toBeNull();
    expect(appPageTitle('/')).toBeNull();
  });

  it('track is a no-op without gtag and adds user_region once known', () => {
    expect(() => track('x')).not.toThrow();
    window.gtag = vi.fn();
    track('a');
    setUserRegion('IN');
    track('b', { k: 1 });
    expect(window.gtag).toHaveBeenNthCalledWith(1, 'event', 'a', {});
    expect(window.gtag).toHaveBeenNthCalledWith(2, 'event', 'b', { user_region: 'IN', k: 1 });
  });

  it('sends page_view with the content group', () => {
    window.gtag = vi.fn();
    trackPageView({ path: '/blog?x=1', title: 'Blog' });
    expect(window.gtag).toHaveBeenCalledWith('set', { content_group: 'website' });
    expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', expect.objectContaining({ content_group: 'website', page_path: '/blog?x=1' }));
  });

  it('tags Chrome Web Store links with UTMs', () => {
    const url = new URL(chromeStoreUrl(campaignFor('/blog/some-post')));
    expect(url.searchParams.get('utm_source')).toBe('getspurly');
    expect(url.searchParams.get('utm_medium')).toBe('website');
    expect(url.searchParams.get('utm_campaign')).toBe('blog-some-post');
    expect(url.searchParams.has('item-share-cb')).toBe(false);
    expect(campaignFor('/')).toBe('home');
  });
});
