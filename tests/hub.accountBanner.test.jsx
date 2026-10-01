import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { stubGateway } from './gateway.js';

/**
 * Plan M7 row 2: the reconnect banner the app shell shows on every page.
 *
 * Pinned: it appears for each state that stops sending, it is absent for the
 * quiet states (the server returns `attention: null` for those, and the shell
 * must not second-guess it), it is NOT shown on the settings page that already
 * has the fuller card, and Reconnect leads there.
 */
const state = { summary: {} };

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/summary': { success: true, get data() { return state.summary; } },
  'GET /credits*': { success: true, data: { balance: 100 } },
  'GET /*': { success: true, data: [] },
}));

const { renderWithProviders } = await import('./helpers.jsx');
const { DashboardLayout } = await import('src/core/layout/DashboardLayout.jsx');
const { Routes, Route, useLocation } = await import('react-router-dom');

function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>;
}

function renderAt(route) {
  return renderWithProviders(
    <Routes>
      <Route path="*" element={<DashboardLayout title="Leads"><Where /></DashboardLayout>} />
    </Routes>,
    { route },
  );
}

const reconnect = (status, extra = {}) => ({
  account: { status, attention: { kind: 'reconnect', status, connectionMethod: 'cookies', ...extra } },
});

beforeEach(() => { state.summary = {}; });

describe('account status banner', () => {
  it.each([
    ['CREDENTIALS', /needs you to reconnect/i],
    ['STOPPED', /connection stopped/i],
    ['DELETED', /was disconnected/i],
  ])('shows for %s', async (status, title) => {
    state.summary = reconnect(status);
    renderAt('/hub/leads');
    const banner = await screen.findByTestId('account-status-banner');
    expect(banner).toHaveTextContent(title);
    expect(banner).toHaveTextContent(/sign out of the browser/i);
  });

  it('is absent when the server reports nothing to do', async () => {
    state.summary = { account: { status: 'OK', attention: null } };
    renderAt('/hub/leads');
    await screen.findByText('Leads', { selector: 'h1' });
    await waitFor(() => expect(screen.queryByTestId('account-status-banner')).toBeNull());
  });

  it('survives a summary with no account field at all', async () => {
    state.summary = { leadsTotal: 3 };
    renderAt('/hub/leads');
    await screen.findByText('Leads', { selector: 'h1' });
    expect(screen.queryByTestId('account-status-banner')).toBeNull();
  });

  it('is not repeated on the LinkedIn settings page', async () => {
    state.summary = reconnect('CREDENTIALS');
    renderAt('/dashboard/settings/linkedin');
    await screen.findByText('Leads', { selector: 'h1' });
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByTestId('account-status-banner')).toBeNull();
  });

  it('Reconnect leads to the LinkedIn settings page', async () => {
    state.summary = reconnect('CREDENTIALS');
    renderAt('/hub/leads');
    const banner = await screen.findByTestId('account-status-banner');
    fireEvent.click(banner.querySelector('button'));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/dashboard/settings/linkedin'));
  });
});
