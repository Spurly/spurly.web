import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stubGateway } from './gateway.js';

/**
 * LinkedIn settings for a partner-managed account with a direct login: the
 * Reconnect button must actually open the sign-in dialog (it is not rendered
 * for other managed accounts), and the hosted fallback is never offered.
 */
const state = { account: null };
vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/account': { success: true, get data() { return { account: state.account }; } },
  'GET /hub/account/connect/options': { success: true, data: { detectedCountry: 'IN' } },
  'GET /credits*': { success: true, data: { balance: 100 } },
  'GET /*': { success: true, data: [] },
}));

const { renderWithProviders, signedInAs } = await import('./helpers.jsx');
const { LinkedInSettingsPage } = await import('src/products/pages/settings/index.jsx');

const ROUTE = '/dashboard/settings/linkedin';
const expired = (overrides = {}) => ({
  connected: false, status: 'CREDENTIALS', needsReconnect: true, linkedinName: 'Jane Rep', publicIdentifier: 'jane',
  knownProfile: true, connectionMethod: 'credentials', connectFlow: 'credentials', ...overrides,
});
const managedWithLogin = signedInAs({ isManaged: true, hasDirectLogin: true, email: 'jane@acme.com' });

describe('Reconnect for a managed account with a direct login', () => {
  beforeEach(() => {
    localStorage.setItem('authToken', 'test-token');
    state.account = null;
  });

  it('Reconnect opens the sign-in dialog', async () => {
    state.account = expired();
    const user = userEvent.setup();
    renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE, auth: managedWithLogin });
    await user.click(await screen.findByRole('button', { name: /reconnect/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /disconnect/i })).not.toBeInTheDocument();
  });

  it('no direct login: status only, no Reconnect', async () => {
    state.account = expired();
    renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE, auth: signedInAs({ isManaged: true }) });
    expect(await screen.findByText(/app you came from/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reconnect/i })).not.toBeInTheDocument();
  });

  it('unknown member id or the hosted flow: no Reconnect', async () => {
    state.account = expired({ knownProfile: false });
    const { unmount } = renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE, auth: managedWithLogin });
    expect(await screen.findByText(/app you came from/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reconnect/i })).not.toBeInTheDocument();
    unmount();
    state.account = expired({ connectFlow: 'hosted' });
    renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE, auth: managedWithLogin });
    expect(await screen.findByText(/app you came from/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reconnect/i })).not.toBeInTheDocument();
  });
});
