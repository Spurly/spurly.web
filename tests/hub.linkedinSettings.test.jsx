import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { stubGateway } from './gateway.js';
import { vi } from 'vitest';

/**
 * The LinkedIn settings page.
 *
 * What is worth pinning here is not that it renders — it is that the five
 * account states each produce different words and a different action. The
 * failure this guards against is the expensive one: a user staring at
 * "Connected" while nothing sends, or at "Not connected" after a link that
 * actually worked.
 *
 * The account is held in a mutable object rather than re-mocked per test,
 * because stubGateway resolves a route to a fixed value at module scope; the
 * object identity stays put and only its contents move.
 */
const state = { account: null };

/**
 * Successive GETs can differ. The connect flow depends on it: the page mounts
 * and reads a not-yet-connected account, then reads again after the redirect.
 * A single fixed response would let a page that never made the second call
 * pass anyway.
 */
const queue = [];
const accountRoute = {
  success: true,
  get data() {
    return { account: queue.length ? queue.shift() : state.account };
  },
};

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/account': accountRoute,
  'POST /hub/account/refresh': { success: true, data: state },
  'DELETE /hub/account': { success: true, data: {} },
  'GET /credits*': { success: true, data: { balance: 100 } },
  'GET /*': { success: true, data: [] },
}));

const { renderWithProviders } = await import('./helpers.jsx');
const { LinkedInSettingsPage } = await import('src/products/hub/settings/index.jsx');

const ROUTE = '/dashboard/settings/linkedin';

const connectedAccount = (overrides = {}) => ({
  connected: true,
  status: 'OK',
  linkedinName: 'Sarthak Vats',
  publicIdentifier: 'sarthak-vats-793128226',
  canPersonaliseNotes: false,
  isPremium: false,
  needsReconnect: false,
  connectionMethod: 'credentials',
  ...overrides,
});

describe('LinkedInSettingsPage', () => {
  beforeEach(() => {
    localStorage.setItem('authToken', 'test-token');
    state.account = null;
    queue.length = 0;
  });

  it('offers the hosted flow when nothing is connected, and promises the password is never stored', async () => {
    renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE });

    await waitFor(() => expect(screen.getByText('Not connected')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /connect linkedin/i })).toBeInTheDocument();
    // This sentence is the reason hosted auth was chosen over a credentials
    // form. If it ever disappears, the flow behind it has probably changed too.
    expect(screen.getByText(/never sees or stores your password/i)).toBeInTheDocument();
  });

  it('shows the linked identity and a disconnect, with no reconnect, when healthy', async () => {
    state.account = connectedAccount();
    renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE });

    await waitFor(() => expect(screen.getByText('Connected')).toBeInTheDocument());
    expect(screen.getByText('Sarthak Vats')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^reconnect$/i })).not.toBeInTheDocument();
  });

  it('warns a free account that notes are off, and says so only while it is free', async () => {
    state.account = connectedAccount();
    const { unmount } = renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE });
    await waitFor(() => expect(screen.getByText('Personalised invites')).toBeInTheDocument());
    unmount();

    state.account = connectedAccount({ isPremium: true, canPersonaliseNotes: true });
    renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE });
    await waitFor(() => expect(screen.getByText('Sarthak Vats')).toBeInTheDocument());
    expect(screen.queryByText('Personalised invites')).not.toBeInTheDocument();
  });

  it('asks for a reconnect when the session died, and explains how it died', async () => {
    state.account = connectedAccount({ status: 'CREDENTIALS', needsReconnect: true });
    renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE });

    await waitFor(() => expect(screen.getByText('Needs reconnecting')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /reconnect/i })).toBeInTheDocument();
    // The hint is keyed on connectionMethod — a cookie session and a credential
    // session die for different reasons and the user can only fix one of them.
    expect(screen.getByText(/revoked in LinkedIn’s settings/i)).toBeInTheDocument();
  });

  it('treats a DELETED account as not connected rather than as a connected-but-broken one', async () => {
    // The server keeps the row after an unlink so history survives. The page
    // must not read that row as "you have an account".
    state.account = connectedAccount({ status: 'DELETED', connected: false });
    renderWithProviders(<LinkedInSettingsPage />, { route: ROUTE });

    await waitFor(() => expect(screen.getByText('Not connected')).toBeInTheDocument());
    expect(screen.queryByText('Sarthak Vats')).not.toBeInTheDocument();
  });

  it('strips ?linked= from the URL so a refresh cannot replay the result', async () => {
    state.account = connectedAccount();
    // jsdom's window.location is not the router's location, so asserting on it
    // would pass no matter what the page did. Read the router's own instead.
    const Probe = () => <span data-testid="search">{useLocation().search || '(empty)'}</span>;

    renderWithProviders(
      <><LinkedInSettingsPage /><Probe /></>,
      { route: `${ROUTE}?linked=1` },
    );

    await waitFor(() => expect(screen.getByText('LinkedIn connected')).toBeInTheDocument());
    // A bookmarked or shared ?linked=1 would otherwise keep claiming a success
    // that never happened.
    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent('(empty)'));
  });

  it('re-reads the account after the redirect, not just on mount', async () => {
    // The account is created by a vendor callback that may land after the page
    // has already mounted and read "nothing connected". If the post-redirect
    // read is skipped — or started and then cancelled by the param strip
    // re-running the effect — the user is told they connected and then shown a
    // page saying they have not.
    queue.push(null);
    state.account = connectedAccount();

    renderWithProviders(<LinkedInSettingsPage />, { route: `${ROUTE}?linked=1` });

    await waitFor(() => expect(screen.getByText('Sarthak Vats')).toBeInTheDocument());
  });
});
