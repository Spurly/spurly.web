import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { stubGateway } from './gateway.js';
import { renderWithProviders, signedInAs } from './helpers.jsx';

/**
 * V3a.4: navigation for an organization member comes from the server (GET /org/state), not from the
 * browser marker. A member who signed in with a password or Google (no marker) still gets the org
 * navigation; a solo user keeps the full sidebar and costs exactly one request; a failed request
 * never blocks anyone; managed sessions never ask.
 */

let state;
let failState = false;
const orgFixture = {
  id: 'o1', externalId: 'abc@example.com', name: 'ABC Ltd', status: 'active', role: 'owner',
  accounts: { connected: 0, total: 0 },
  usage: { connected: 0, distinct: 0, peak: { count: 0, at: null } },
};

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /org/state': () => {
    if (failState) throw Object.assign(new Error('boom'), { status: 500 });
    return { success: true, data: state };
  },
  'GET /org': () => ({ success: true, data: { orgs: [orgFixture], isMember: true, features: state.features } }),
  'GET /org/accounts': () => ({ success: true, data: { items: [], total: 0, page: 1, limit: 50 } }),
  'GET /hub/summary': () => ({ success: true, data: {} }),
}));

const apiGateway = (await import('src/shared/gateway/apiGateway.js')).default;
const { resetOrgState } = await import('src/core/org/hooks/useOrgState.js');
const { DashboardLayout } = await import('src/core/layout/DashboardLayout');
const { SettingsPage } = await import('src/products/pages/accountSettings/index.jsx');
const { LinkedInSettingsPage } = await import('src/products/pages/settings/index.jsx');

const off = { inbox: false, campaigns: false, leads: false, sequences: false };
const stateCalls = () => apiGateway.get.mock.calls.filter(([url]) => url === '/org/state').length;

beforeEach(() => {
  localStorage.clear();
  resetOrgState();
  failState = false;
  state = { isMember: false, features: off };
});

function nav() {
  return within(screen.getByRole('navigation'));
}
const member = () => { state = { isMember: true, features: off }; };

describe('sidebar', () => {
  it('a solo user keeps the full sidebar and makes exactly one /org/state request', async () => {
    const first = renderWithProviders(<DashboardLayout title="t">x</DashboardLayout>);
    await waitFor(() => expect(stateCalls()).toBe(1));
    for (const label of ['Home', 'Discover', 'Leads', 'Inbox', 'Campaigns', 'Settings', 'LinkedIn']) expect(nav().getByText(label)).toBeInTheDocument();
    // Another page, same session: the answer is shared, no second request.
    first.unmount();
    renderWithProviders(<DashboardLayout title="t2">y</DashboardLayout>);
    await screen.findByRole('navigation');
    expect(stateCalls()).toBe(1);
  });

  it('a member who signed in without the browser marker gets Settings only', async () => {
    member();
    renderWithProviders(<DashboardLayout title="t">x</DashboardLayout>);
    await waitFor(() => expect(nav().queryByText('Inbox')).not.toBeInTheDocument());
    expect(nav().getByText('Settings')).toBeInTheDocument();
    for (const label of ['Home', 'Discover', 'Leads', 'Network', 'Profile viewers', 'Invitations', 'Enrichment', 'Import', 'Campaigns', 'Sequences', 'Posts', 'Templates', 'LinkedIn']) {
      expect(nav().queryByText(label)).not.toBeInTheDocument();
    }
  });

  it('with the browser marker alone the first paint already uses the member sidebar (no flash of personal rows)', () => {
    member();
    localStorage.setItem('orgSessionUser', 'u1');
    renderWithProviders(<DashboardLayout title="t">x</DashboardLayout>);
    expect(nav().queryByText('Inbox')).not.toBeInTheDocument();
    expect(nav().getByText('Settings')).toBeInTheDocument();
  });

  it('a feature the server switches on adds its own rows', async () => {
    state = { isMember: true, features: { ...off, inbox: true } };
    renderWithProviders(<DashboardLayout title="t">x</DashboardLayout>);
    expect(await nav().findByText('Inbox')).toBeInTheDocument();
    expect(nav().queryByText('Campaigns')).not.toBeInTheDocument();
    expect(nav().queryByText('LinkedIn')).not.toBeInTheDocument();
  });

  it('the leads feature brings every row that sources or contacts people; content brings Posts', async () => {
    state = { isMember: true, features: { ...off, leads: true, content: true } };
    renderWithProviders(<DashboardLayout title="t">x</DashboardLayout>);
    expect(await nav().findByText('Discover')).toBeInTheDocument();
    for (const label of ['Home', 'Leads', 'Network', 'Profile viewers', 'Invitations', 'Enrichment', 'Import', 'Posts']) {
      expect(nav().getByText(label)).toBeInTheDocument();
    }
    expect(nav().queryByText('Inbox')).not.toBeInTheDocument();
    expect(nav().queryByText('LinkedIn')).not.toBeInTheDocument();
  });

  it('a failed request leaves the full sidebar and breaks nothing', async () => {
    failState = true;
    renderWithProviders(<DashboardLayout title="t">x</DashboardLayout>);
    await waitFor(() => expect(stateCalls()).toBe(1));
    expect(nav().getByText('Inbox')).toBeInTheDocument();
    expect(nav().getByText('LinkedIn')).toBeInTheDocument();
  });

  it('a managed (partner) session never asks', async () => {
    renderWithProviders(<DashboardLayout title="t">x</DashboardLayout>, { auth: signedInAs({ isManaged: true }) });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(stateCalls()).toBe(0);
    expect(nav().getByText('Inbox')).toBeInTheDocument();
  });
});

describe('settings', () => {
  it('a member sees only Account, Organization and Billing, whatever tab was asked for', async () => {
    member();
    renderWithProviders(<SettingsPage />, { route: '/dashboard/settings?tab=limits' });
    await waitFor(() => expect(screen.queryByRole('tab', { name: 'Sending limits' })).not.toBeInTheDocument());
    const tabs = screen.getAllByRole('tab').map((tab) => tab.textContent);
    expect(tabs).toEqual(['Account', 'Billing', 'Organization']);
  });

  it('a member can open the Organization tab without the browser marker', async () => {
    member();
    renderWithProviders(<SettingsPage />, { route: '/dashboard/settings?tab=organization' });
    expect(await screen.findByText('LinkedIn accounts')).toBeInTheDocument();
  });

  it('a solo user never sees the Organization tab and cannot open it by URL', async () => {
    renderWithProviders(<SettingsPage />, { route: '/dashboard/settings?tab=organization' });
    await waitFor(() => expect(stateCalls()).toBe(1));
    expect(screen.queryByRole('tab', { name: 'Organization' })).not.toBeInTheDocument();
    expect(screen.queryByText('LinkedIn accounts')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'LinkedIn' })).toBeInTheDocument();
  });
});

describe('Settings -> LinkedIn', () => {
  function Where() {
    const location = useLocation();
    return <div data-testid="where">{location.pathname + location.search}</div>;
  }

  it('redirects a member to Settings -> Organization', async () => {
    member();
    renderWithProviders(
      <Routes>
        <Route path="/dashboard/settings/linkedin" element={<LinkedInSettingsPage />} />
        <Route path="*" element={<Where />} />
      </Routes>,
      { route: '/dashboard/settings/linkedin' },
    );
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/dashboard/settings?tab=organization'));
  });
});
