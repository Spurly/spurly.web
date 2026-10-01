import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, within } from '@testing-library/react';
import { vi } from 'vitest';
import { stubGateway } from './gateway.js';

/**
 * The Profile viewers page: nothing stored yet, a stored list, a free account's
 * "limited" banner, private viewers, and the refusals the server can give (no
 * LinkedIn account, throttled, LinkedIn's query rejected, a vendor failure).
 * Shapes are the server's own responses (spurly.backend hub/profileViewers).
 */
const NOW = Date.now();
const HOUR = 3600_000;

const emptyPayload = () => ({
  viewers: [], total: 0, page: 1, limit: 25,
  summary: { identifiedTotal: 0, last7d: 0, last30d: 0, partialCount: 0, lockedCount: 0 },
  partial: [],
  state: { lastSyncAt: null, lastAttemptAt: null, nextSyncAllowedAt: null, lastError: '', lastErrorCode: '', limited: false },
  account: { connected: true, premium: true },
});

const state = { payload: emptyPayload(), syncError: null, syncCalls: 0, listCalls: [] };

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/profile-viewers': async (_url, config) => {
    state.listCalls.push(config?.params);
    return { success: true, data: state.payload };
  },
  'POST /hub/profile-viewers/sync': async () => {
    state.syncCalls += 1;
    if (state.syncError) throw state.syncError;
    return { success: true, message: 'Profile viewers updated', data: { result: { pages: 1, identified: 2 } } };
  },
  'GET /*': { success: true, data: [] },
}));

const { renderWithProviders } = await import('./helpers.jsx');
const { HubProfileViewersPage } = await import('src/products/pages/profileViewers/index.jsx');
const { syncFailureKind, retryAfterMinutes } = await import('src/products/profileViewers/hooks/useProfileViewersPage.js');
const { formatViewed, formatViewedAgo } = await import('src/products/profileViewers/format.js');

const viewer = (n, over = {}) => ({
  providerId: `ACoA${n}`, fullName: `Viewer ${n}`, headline: `Headline ${n}`, photoUrl: '', connectionDegree: 2,
  profileUrl: `https://www.linkedin.com/in/viewer-${n}`, firstSeenAt: new Date(NOW - 5 * HOUR).toISOString(),
  lastViewedAt: new Date(NOW - 5 * HOUR).toISOString(), lastViewedPrecision: 'hour', viewsSeen: 1, ...over,
});

const stored = (over = {}) => ({
  ...emptyPayload(),
  viewers: [viewer(1), viewer(2, { connectionDegree: 1, viewsSeen: 3, lastViewedAt: new Date(NOW - 14 * 24 * HOUR).toISOString(), lastViewedPrecision: 'week' })],
  total: 2,
  summary: { identifiedTotal: 2, last7d: 1, last30d: 2, partialCount: 0, lockedCount: 0 },
  state: { lastSyncAt: new Date(NOW - 2 * HOUR).toISOString(), lastAttemptAt: new Date(NOW - 2 * HOUR).toISOString(), nextSyncAllowedAt: null, lastError: '', lastErrorCode: '', limited: false },
  ...over,
});

beforeEach(() => {
  state.payload = emptyPayload();
  state.syncError = null;
  state.syncCalls = 0;
  state.listCalls = [];
});

describe('Profile viewers page', () => {
  it('before any sync: the empty state offers Sync now, and nothing is invented', async () => {
    renderWithProviders(<HubProfileViewersPage />, { route: '/hub/viewers' });
    await waitFor(() => expect(screen.getByText('No viewers stored yet')).toBeInTheDocument());
    expect(screen.getAllByRole('button', { name: 'Sync now' }).length).toBeGreaterThan(0);
    expect(screen.queryByText(/free accounts only/i)).not.toBeInTheDocument();
  });

  it('a stored list shows name, headline, degree, an "about" time and times seen', async () => {
    state.payload = stored();
    renderWithProviders(<HubProfileViewersPage />, { route: '/hub/viewers' });
    await waitFor(() => expect(screen.getByText('Viewer 1')).toBeInTheDocument());
    expect(screen.getByText('Viewer 2')).toBeInTheDocument();
    expect(screen.getByText('Headline 1')).toBeInTheDocument();
    expect(screen.getByText('about 5 hours ago')).toBeInTheDocument();
    expect(screen.getByText('about 2 weeks ago')).toBeInTheDocument();
    // each degree appears twice: once as a filter pill, once in a row
    expect(screen.getAllByText('2nd')).toHaveLength(2);
    expect(screen.getAllByText('1st')).toHaveLength(2);
  });

  it('the tiles show the last 7 days, 30 days, everyone saved and private viewers', async () => {
    state.payload = stored({ summary: { identifiedTotal: 40, last7d: 6, last30d: 19, partialCount: 4, lockedCount: 0 } });
    renderWithProviders(<HubProfileViewersPage />, { route: '/hub/viewers' });
    await waitFor(() => expect(screen.getByText('Last 7 days')).toBeInTheDocument());
    for (const [label, value] of [['Last 7 days', '6'], ['Last 30 days', '19'], ['Viewers saved', '40'], ['Private viewers', '4']]) {
      expect(screen.getByText(label).closest('div').parentElement.textContent).toContain(value);
    }
  });

  it('loading the page never calls LinkedIn: only the stored list is read', async () => {
    state.payload = stored();
    renderWithProviders(<HubProfileViewersPage />, { route: '/hub/viewers' });
    await waitFor(() => expect(screen.getByText('Viewer 1')).toBeInTheDocument());
    expect(state.syncCalls).toBe(0);
  });

  it('a free account sees the limited banner, driven by the server state', async () => {
    state.payload = stored({ state: { ...stored().state, limited: true }, account: { connected: true, premium: false } });
    renderWithProviders(<HubProfileViewersPage />, { route: '/hub/viewers' });
    await waitFor(() => expect(screen.getByText('LinkedIn shows free accounts only 3 viewers')).toBeInTheDocument());
    expect(screen.getByText(/Premium shows the full list/)).toBeInTheDocument();
  });

  it('private viewers are listed as descriptors only, with an honest age', async () => {
    state.payload = stored({
      summary: { identifiedTotal: 2, last7d: 1, last30d: 2, partialCount: 2, lockedCount: 0 },
      partial: [{ descriptor: 'Someone at Acme', viewedAgo: { value: 1, unit: 'd' } }, { descriptor: 'Recruiter at Globex', viewedAgo: { value: 6, unit: 'h' } }],
    });
    renderWithProviders(<HubProfileViewersPage />, { route: '/hub/viewers' });
    await waitFor(() => expect(screen.getByText('Private viewers', { selector: 'p' })).toBeInTheDocument());
    expect(screen.getByText('Someone at Acme')).toBeInTheDocument();
    expect(screen.getByText('about a day ago')).toBeInTheDocument();
    expect(screen.getByText('about 6 hours ago')).toBeInTheDocument();
    expect(screen.getByText(/browse in private mode/)).toBeInTheDocument();
  });

  it('no connected account points at the settings page and disables Sync now', async () => {
    state.payload = { ...emptyPayload(), account: { connected: false, premium: null } };
    renderWithProviders(<HubProfileViewersPage />, { route: '/hub/viewers' });
    await waitFor(() => expect(screen.getByText('Connect your LinkedIn account first')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Open LinkedIn settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sync now' })).toBeDisabled();
  });

  it('Sync now posts once, then reloads the stored list from page 1', async () => {
    renderWithProviders(<HubProfileViewersPage />, { route: '/hub/viewers' });
    fireEvent.click((await screen.findAllByRole('button', { name: 'Sync now' }))[0]);
    await waitFor(() => expect(state.syncCalls).toBe(1));
    await waitFor(() => expect(state.listCalls.length).toBeGreaterThanOrEqual(2));
    expect(state.listCalls.at(-1)).toMatchObject({ page: 1 });
  });

  it('the degree filter asks the server for that degree and starts at page 1', async () => {
    state.payload = stored();
    renderWithProviders(<HubProfileViewersPage />, { route: '/hub/viewers' });
    await waitFor(() => expect(screen.getByText('Viewer 1')).toBeInTheDocument());
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Connection level' })).getByRole('radio', { name: '2nd' }));
    await waitFor(() => expect(state.listCalls.at(-1)).toMatchObject({ degree: 2, page: 1 }));
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Connection level' })).getByRole('radio', { name: '3rd+' }));
    await waitFor(() => expect(state.listCalls.at(-1)).toMatchObject({ degree: 3 }));
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Connection level' })).getByRole('radio', { name: 'All' }));
    await waitFor(() => expect(state.listCalls.at(-1)).not.toHaveProperty('degree'));
  });

  it('a filter with no matches says so, instead of the first-sync empty state', async () => {
    state.payload = stored();
    renderWithProviders(<HubProfileViewersPage />, { route: '/hub/viewers' });
    await waitFor(() => expect(screen.getByText('Viewer 1')).toBeInTheDocument());
    state.payload = { ...stored(), viewers: [], total: 0 };
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'Connection level' })).getByRole('radio', { name: '3rd+' }));
    await waitFor(() => expect(screen.getByText('No viewers with this connection level')).toBeInTheDocument());
  });

  it('a missing account on sync shows the account notice, not a toast', async () => {
    state.syncError = { success: false, code: 'NO_ACCOUNT', message: 'Connect your LinkedIn account first' };
    renderWithProviders(<HubProfileViewersPage />, { route: '/hub/viewers' });
    fireEvent.click((await screen.findAllByRole('button', { name: 'Sync now' }))[0]);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open LinkedIn settings' })).toBeInTheDocument());
  });

  it('a throttled sync tells the person how long to wait', async () => {
    state.syncError = { success: false, code: 'SYNC_THROTTLED', message: 'x', data: { retryAfterMs: 5 * 60_000 } };
    renderWithProviders(<HubProfileViewersPage />, { route: '/hub/viewers' });
    fireEvent.click((await screen.findAllByRole('button', { name: 'Sync now' }))[0]);
    await waitFor(() => expect(screen.getByText('Checked a moment ago. Try again in 5 min.')).toBeInTheDocument());
  });

  it('LinkedIn rejecting the query shows an honest banner and keeps the saved list', async () => {
    state.payload = stored();
    state.syncError = { success: false, code: 'VIEWERS_QUERY_REJECTED', message: 'x' };
    renderWithProviders(<HubProfileViewersPage />, { route: '/hub/viewers' });
    await waitFor(() => expect(screen.getByText('Viewer 1')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Sync now' }));
    await waitFor(() => expect(screen.getByText(/LinkedIn changed something on their side/)).toBeInTheDocument());
    expect(screen.getByText('Viewer 1')).toBeInTheDocument();
  });

  it('a remembered rejection (state.lastErrorCode) shows the same banner on a fresh load', async () => {
    state.payload = stored({ state: { ...stored().state, lastError: 'rejected', lastErrorCode: 'BAD_REQUEST' } });
    renderWithProviders(<HubProfileViewersPage />, { route: '/hub/viewers' });
    await waitFor(() => expect(screen.getByText(/LinkedIn changed something on their side/)).toBeInTheDocument());
    expect(screen.queryByText(/last check did not finish/)).not.toBeInTheDocument();
  });

  it('any other remembered failure says the last check did not finish, with the saved list still shown', async () => {
    state.payload = stored({ state: { ...stored().state, lastError: 'boom', lastErrorCode: 'PROVIDER_ERROR' } });
    renderWithProviders(<HubProfileViewersPage />, { route: '/hub/viewers' });
    await waitFor(() => expect(screen.getByText(/last check did not finish/)).toBeInTheDocument());
    expect(screen.getByText('Viewer 1')).toBeInTheDocument();
  });
});

describe('profile viewers helpers', () => {
  it('classifies sync failures', () => {
    expect(syncFailureKind({ code: 'NO_ACCOUNT' })).toBe('account');
    expect(syncFailureKind({ code: 'ACCOUNT_NOT_READY' })).toBe('account');
    expect(syncFailureKind({ code: 'SYNC_THROTTLED' })).toBe('throttled');
    expect(syncFailureKind({ code: 'VIEWERS_QUERY_REJECTED' })).toBe('rejected');
    expect(syncFailureKind({ response: { data: { code: 'SYNC_THROTTLED' } } })).toBe('throttled');
    expect(syncFailureKind({ code: 'X' })).toBe('other');
  });

  it('rounds the throttle wait up to whole minutes', () => {
    expect(retryAfterMinutes({ data: { retryAfterMs: 61000 } })).toBe(2);
    expect(retryAfterMinutes({ data: { retryAfterMs: 500 } })).toBe(1);
    expect(retryAfterMinutes({})).toBeNull();
  });
});

describe('formatViewed: always "about", never finer than the stored precision', () => {
  const at = (hoursAgo) => new Date(NOW - hoursAgo * HOUR).toISOString();
  it.each([
    [1, 'hour', 'about an hour ago'],
    [5, 'hour', 'about 5 hours ago'],
    [23, 'hour', 'about 23 hours ago'],
    [30, 'hour', 'about 1 day ago'.replace('1 day', 'a day')],
    [24 * 5, 'day', 'about 5 days ago'],
    [24 * 14, 'week', 'about 2 weeks ago'],
    [24 * 21, 'week', 'about 3 weeks ago'],
    [24 * 70, 'month', 'about 2 months ago'],
  ])('%sh ago at %s precision -> %s', (hours, precision, expected) => {
    expect(formatViewed(at(hours), precision, NOW)).toBe(expected);
  });

  it('a week-precision reading younger than a week is never shown finer than a week', () => {
    expect(formatViewed(at(24 * 2), 'week', NOW)).toBe('about a week ago');
  });

  it('an unknown precision, a missing or invalid time reads "recently"', () => {
    expect(formatViewed(at(3), 'unknown', NOW)).toBe('recently');
    expect(formatViewed(null, 'hour', NOW)).toBe('recently');
    expect(formatViewed('not a date', 'hour', NOW)).toBe('recently');
  });

  it('a private viewer\'s reading is worded from LinkedIn\'s own unit', () => {
    expect(formatViewedAgo({ value: 1, unit: 'd' })).toBe('about a day ago');
    expect(formatViewedAgo({ value: 8, unit: 'h' })).toBe('about 8 hours ago');
    expect(formatViewedAgo({ value: 1, unit: 'h' })).toBe('about an hour ago');
    expect(formatViewedAgo({ value: 2, unit: 'w' })).toBe('about 2 weeks ago');
    expect(formatViewedAgo({ value: 1, unit: 'mo' })).toBe('about a month ago');
    expect(formatViewedAgo({ value: 5, unit: 'y' })).toBe('');
    expect(formatViewedAgo(null)).toBe('');
  });
});
