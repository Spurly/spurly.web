import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { stubGateway } from './gateway.js';

/**
 * The Network page: nothing synced yet, a sync in progress, a synced list,
 * and the two refusals the server can give (no LinkedIn account, throttled).
 * Shapes are the server's own responses (spurly.backend hub/sourcing/networkSync.js).
 */
const state = { network: { exists: false }, leads: [], syncPost: null, syncCalls: 0, listParams: null };

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/network': { success: true, get data() { return { network: state.network }; } },
  'POST /hub/network/sync': async () => {
    state.syncCalls += 1;
    if (state.syncPost?.error) throw state.syncPost.error;
    return { success: true, message: 'Syncing your connections. This starts shortly.', data: { network: state.syncPost?.network } };
  },
  'GET /hub/leads': async (_url, config) => {
    state.listParams = config?.params;
    return { success: true, data: { leads: state.leads, pagination: { page: 1, limit: 50, total: state.leads.length } } };
  },
  'GET /*': { success: true, data: [] },
}));

const { renderWithProviders } = await import('./helpers.jsx');
const { HubNetworkPage } = await import('src/products/pages/network/index.jsx');
const { describeSearch } = await import('src/products/leads/hooks/audience.js');
const { syncFailureKind, retryAfterMinutes } = await import('src/products/network/hooks/useNetworkPage.js');

const synced = (over = {}) => ({
  exists: true, audienceId: 'aud1', name: 'Your LinkedIn connections', status: 'done', syncing: false,
  firstSyncDone: true, connectionCount: 2, notice: null, error: null,
  lastCheckedAt: new Date(Date.now() - 3600_000).toISOString(),
  lastFullAt: null, nextCheckAt: new Date(Date.now() + 5 * 3600_000).toISOString(), ...over,
});

const lead = (n) => ({
  _id: `l${n}`, name: `Person ${n}`, headline: `Headline ${n}`, connectionDegree: 1,
  connectedAt: new Date(Date.now() - n * 86400_000).toISOString(), enrichmentStatus: 'none',
});

beforeEach(() => {
  state.network = { exists: false };
  state.leads = [];
  state.syncPost = null;
  state.syncCalls = 0;
  state.listParams = null;
});

describe('Network page', () => {
  it('before the first sync it offers one primary action and no stats', async () => {
    renderWithProviders(<HubNetworkPage />, { route: '/hub/network' });
    await waitFor(() => expect(screen.getByText('Your connections are not here yet')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Sync my connections' })).toBeInTheDocument();
    expect(screen.queryByText('Connections')).not.toBeInTheDocument();
  });

  it('starting the first sync posts once and shows the working line', async () => {
    state.syncPost = { network: synced({ status: 'queued', syncing: true, firstSyncDone: false, connectionCount: 0 }) };
    renderWithProviders(<HubNetworkPage />, { route: '/hub/network' });
    fireEvent.click(await screen.findByRole('button', { name: 'Sync my connections' }));
    await waitFor(() => expect(screen.getByText(/Pulling in your connections/)).toBeInTheDocument());
    expect(state.syncCalls).toBe(1);
  });

  it('a synced network lists connections newest first via the network audience', async () => {
    state.network = synced();
    state.leads = [lead(1), lead(2)];
    renderWithProviders(<HubNetworkPage />, { route: '/hub/network' });
    await waitFor(() => expect(screen.getByText('Person 1')).toBeInTheDocument());
    expect(screen.getByText('Person 2')).toBeInTheDocument();
    expect(state.listParams).toMatchObject({ searchId: 'aud1', sort: 'connected' });
    expect(screen.getByRole('button', { name: 'Check for new connections' })).toBeEnabled();
  });

  it('a syncing network disables the check button', async () => {
    state.network = synced({ status: 'running', syncing: true });
    renderWithProviders(<HubNetworkPage />, { route: '/hub/network' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Check for new connections' })).toBeDisabled());
  });

  it('a missing LinkedIn account points at the settings page instead of a toast', async () => {
    state.syncPost = { error: { success: false, code: 'NO_LINKEDIN_ACCOUNT', message: 'x' } };
    renderWithProviders(<HubNetworkPage />, { route: '/hub/network' });
    fireEvent.click(await screen.findByRole('button', { name: 'Sync my connections' }));
    await waitFor(() => expect(screen.getByText('Connect your LinkedIn account first')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Open LinkedIn settings' })).toBeInTheDocument();
  });
});

describe('network helpers', () => {
  it('classifies sync failures', () => {
    expect(syncFailureKind({ code: 'NO_LINKEDIN_ACCOUNT' })).toBe('account');
    expect(syncFailureKind({ code: 'LINKEDIN_ACCOUNT_NOT_READY' })).toBe('account');
    expect(syncFailureKind({ code: 'SYNC_THROTTLED' })).toBe('throttled');
    expect(syncFailureKind({ code: 'X' })).toBe('other');
  });

  it('rounds the throttle wait up to whole minutes', () => {
    expect(retryAfterMinutes({ data: { retryAfterMs: 61000 } })).toBe(2);
    expect(retryAfterMinutes({ data: { retryAfterMs: 500 } })).toBe(1);
    expect(retryAfterMinutes({})).toBeNull();
  });

  it('labels the network audience', () => {
    expect(describeSearch({ mode: 'network' })).toBe('Your LinkedIn connections');
  });
});
