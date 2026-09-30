import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { stubGateway } from './gateway.js';

/**
 * The account-health card on the LinkedIn settings page.
 *
 * What is worth pinning: null must never read as "no" (LinkedIn reports null
 * for a balance it does not give, and the server stores null for anything a
 * failed call could not answer), the card must survive the first read of a
 * never-checked account (capabilities null, server still checking), and a
 * throttled refresh must say so instead of failing silently.
 *
 * Shapes are the server's own response, taken from the real 2026-09-30
 * captures: a Sales Navigator seat and a free account.
 */
const state = { account: null, health: null };
const queue = [];
const refreshCalls = { count: 0, response: null };

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/account': { success: true, get data() { return { account: state.account }; } },
  'GET /hub/account/health': {
    success: true,
    get data() { return { health: queue.length ? queue.shift() : state.health }; },
  },
  'POST /hub/account/health/refresh': async () => {
    refreshCalls.count += 1;
    const res = refreshCalls.response;
    if (res?.throttled) {
      // Real shape: apiGateway's interceptor rejects with the response body.
      throw { success: false, message: 'Checked a moment ago', data: { retryAfterMs: 20000 } };
    }
    return { success: true, data: { health: res ?? state.health } };
  },
  'POST /hub/account/refresh': { success: true, data: state },
  'DELETE /hub/account': { success: true, data: {} },
  'GET /credits*': { success: true, data: { balance: 100 } },
  'GET /*': { success: true, data: [] },
}));

const { renderWithProviders } = await import('./helpers.jsx');
const { LinkedInSettingsPage } = await import('src/products/pages/settings/index.jsx');

const ROUTE = '/dashboard/settings/linkedin';

const connectedAccount = (overrides = {}) => ({
  connected: true, status: 'OK', linkedinName: 'Shobhita Richard Samuel',
  isPremium: true, canPersonaliseNotes: true, needsReconnect: false, connectionMethod: 'credentials',
  ...overrides,
});

const health = (overrides = {}) => ({
  connected: true,
  status: 'OK',
  profile: { name: 'Shobhita Richard Samuel', headline: 'Lifelong Learner | Problem Solver', pictureUrl: '', location: 'Gurugram', openProfile: false },
  capabilities: {
    premium: true,
    salesNavigator: true,
    recruiter: false,
    companyPages: [{ id: '111552418', name: 'Spurly Labs', messagingEnabled: true, mailboxId: '83507002' }],
    inmailCredits: { premium: null, recruiter: null, salesNavigator: 150 },
    checkedAt: new Date().toISOString(),
  },
  capabilitiesError: '',
  checking: false,
  ...overrides,
});

describe('AccountHealthCard', () => {
  beforeEach(() => {
    localStorage.setItem('authToken', 'test-token');
    state.account = connectedAccount();
    state.health = health();
    queue.length = 0;
    refreshCalls.count = 0;
    refreshCalls.response = null;
  });

  it('shows who is connected, the plan flags, company pages and per-pool InMail credits', async () => {
    renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE });

    // The title also shows on the loading skeleton, so wait for real content.
    await waitFor(() => expect(screen.getByText('Lifelong Learner | Problem Solver')).toBeInTheDocument());
    expect(screen.getByText('Account health')).toBeInTheDocument();
    expect(screen.getByText('Sales Navigator')).toBeInTheDocument();
    expect(screen.getByText('Spurly Labs')).toBeInTheDocument();
    // Only the pool LinkedIn reported; the two nulls are not shown as zeros.
    expect(screen.getByText('Sales Navigator: 150')).toBeInTheDocument();
    expect(screen.queryByText(/Premium: /)).not.toBeInTheDocument();
    expect(screen.getByText(/Checked just now/i)).toBeInTheDocument();
  });

  it('renders a null flag as Unknown, never as "Not on this account"', async () => {
    state.health = health({
      capabilities: { ...health().capabilities, recruiter: null, inmailCredits: { premium: null, recruiter: null, salesNavigator: null } },
    });
    renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE });

    await waitFor(() => expect(screen.getByText('Recruiter')).toBeInTheDocument());
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText(/did not report a balance/i)).toBeInTheDocument();
  });

  it('says "Not on this account" for a flag that is really false', async () => {
    state.health = health({ capabilities: { ...health().capabilities, salesNavigator: false, recruiter: false } });
    renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE });

    await waitFor(() => expect(screen.getAllByText('Not on this account')).toHaveLength(2));
  });

  it('first read of a never-checked account: shows the checking state, then the data when it lands', async () => {
    queue.push(health({ capabilities: null, profile: null, checking: true }));
    state.health = health();
    renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE });

    await waitFor(() => expect(screen.getByText(/reading your linkedin account/i)).toBeInTheDocument());
    // The hook re-reads on a timer until the stored data arrives.
    await waitFor(() => expect(screen.getByText('Sales Navigator: 150')).toBeInTheDocument(), { timeout: 8000 });
  });

  it('a failed first check says so and keeps Refresh available', async () => {
    state.health = health({ capabilities: null, profile: null, capabilitiesError: 'down', checking: false });
    renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE });

    await waitFor(() => expect(screen.getByText(/could not read your linkedin account details/i)).toBeInTheDocument());
    // Two Refresh buttons on this page: the connection card's and the health card's.
    const buttons = screen.getAllByRole('button', { name: /^refresh$/i });
    expect(buttons).toHaveLength(2);
    expect(buttons[buttons.length - 1]).toBeEnabled();
  });

  it('Refresh calls the vendor-backed endpoint and shows the new data', async () => {
    renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE });
    await waitFor(() => expect(screen.getByText('Sales Navigator: 150')).toBeInTheDocument());

    refreshCalls.response = health({
      capabilities: { ...health().capabilities, inmailCredits: { premium: null, recruiter: null, salesNavigator: 149 } },
    });
    // The card's button, not the connection card's own Refresh.
    const buttons = screen.getAllByRole('button', { name: /^refresh$/i });
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => expect(screen.getByText('Sales Navigator: 149')).toBeInTheDocument());
    expect(refreshCalls.count).toBe(1);
  });

  it('a throttled refresh (429) tells the user to wait rather than failing silently', async () => {
    renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE });
    await waitFor(() => expect(screen.getByText('Sales Navigator: 150')).toBeInTheDocument());

    refreshCalls.response = { throttled: true };
    const buttons = screen.getAllByRole('button', { name: /^refresh$/i });
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => expect(screen.getByText(/checked a moment ago/i)).toBeInTheDocument());
  });

  it('renders no card, and makes no health request, when nothing is connected', async () => {
    state.account = { connected: false, status: null };
    renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE });

    await waitFor(() => expect(screen.getByText('Not connected')).toBeInTheDocument());
    expect(screen.queryByText('Account health')).not.toBeInTheDocument();
  });
});
