import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stubGateway } from './gateway.js';
import { renderWithProviders, signedInAs } from './helpers.jsx';
import { isOrgSessionFor, markOrgSession, clearOrgSession } from 'src/shared/utils/orgSession.js';

/**
 * Settings -> Organization: counts, usage, the org's LinkedIn accounts, and
 * disconnect (after a confirm). Plus the marker that decides who sees the tab.
 */

const deleted = [];
let accounts;

const org = {
  id: 'o1', externalId: 'abc@example.com', name: 'ABC Ltd', status: 'active', role: 'owner',
  accounts: { connected: 2, total: 3 },
  usage: { connected: 2, distinct: 4, peak: { count: 3, at: '2026-11-01T00:00:00.000Z' } },
};
const account = (over) => ({ id: 'a', orgId: 'o1', status: 'OK', name: 'Someone', publicIdentifier: 'someone', connectedAt: '2026-10-21T00:00:00.000Z', disconnectedAt: null, ...over });

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /org': () => ({ success: true, data: { orgs: [org] } }),
  'GET /org/accounts': () => ({ success: true, data: { items: accounts, total: accounts.length, page: 1, limit: 50 } }),
  'DELETE /org/accounts/*': (url) => {
    deleted.push(url);
    accounts = accounts.filter((a) => !url.endsWith(`/${a.id}`));
    return { success: true, data: { id: 'a1', status: 'DELETED' } };
  },
}));

const apiGateway = (await import('src/shared/gateway/apiGateway.js')).default;
const { OrganizationTab } = await import('src/products/pages/accountSettings/components/OrganizationTab.jsx');

beforeEach(() => {
  deleted.length = 0;
  localStorage.clear();
  accounts = [account({ id: 'a1', name: 'Jo Doe' }), account({ id: 'a2', name: 'Sam Roe' })];
});

describe('Settings -> Organization', () => {
  it('shows connected count, peak, distinct members and each account', async () => {
    renderWithProviders(<OrganizationTab />, { auth: signedInAs({ _id: 'u9' }) });
    expect(await screen.findByText('Jo Doe')).toBeInTheDocument();
    expect(screen.getByText('Sam Roe')).toBeInTheDocument();
    expect(screen.getByText('Connected now')).toBeInTheDocument();
    expect(screen.getByText('30-day peak')).toBeInTheDocument();
    expect(apiGateway.get).toHaveBeenCalledWith('/org/accounts?orgId=o1&page=1&limit=50');
    const peak = screen.getByText('30-day peak').closest('div');
    expect(within(peak.parentElement).getAllByText('3').length).toBeGreaterThan(0);
  });

  it('disconnects only after confirming, then reloads the list', async () => {
    renderWithProviders(<OrganizationTab />, { auth: signedInAs({ _id: 'u9' }) });
    const row = (await screen.findByText('Jo Doe')).closest('div.flex');
    await userEvent.click(within(row).getByRole('button', { name: 'Disconnect' }));
    expect(deleted).toHaveLength(0);
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Disconnect' }));

    await waitFor(() => expect(deleted).toEqual(['/org/accounts/a1']));
    await waitFor(() => expect(screen.queryByText('Jo Doe')).not.toBeInTheDocument());
    expect(screen.getByText('Sam Roe')).toBeInTheDocument();
  });

  it('does nothing when the confirmation is cancelled', async () => {
    renderWithProviders(<OrganizationTab />, { auth: signedInAs({ _id: 'u9' }) });
    const row = (await screen.findByText('Jo Doe')).closest('div.flex');
    await userEvent.click(within(row).getByRole('button', { name: 'Disconnect' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(deleted).toHaveLength(0);
  });

  it('shows an already-disconnected account without a Disconnect button', async () => {
    accounts = [account({ id: 'a3', name: 'Old Member', status: 'DELETED' })];
    renderWithProviders(<OrganizationTab />, { auth: signedInAs({ _id: 'u9' }) });
    const row = (await screen.findByText('Old Member')).closest('div.flex');
    expect(within(row).getByText('Disconnected')).toBeInTheDocument();
    expect(within(row).queryByRole('button')).toBeNull();
  });

  it('says so when the org has no accounts yet', async () => {
    accounts = [];
    renderWithProviders(<OrganizationTab />, { auth: signedInAs({ _id: 'u9' }) });
    expect(await screen.findByText('No LinkedIn accounts are connected yet.')).toBeInTheDocument();
  });
});

describe('who sees the Organization tab', () => {
  it('only the user the org marker names', () => {
    markOrgSession('u9');
    expect(isOrgSessionFor({ _id: 'u9' })).toBe(true);
    expect(isOrgSessionFor({ _id: 'someone-else' })).toBe(false);
    expect(isOrgSessionFor(null)).toBe(false);
    clearOrgSession();
    expect(isOrgSessionFor({ _id: 'u9' })).toBe(false);
  });
});
