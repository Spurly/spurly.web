import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { stubGateway } from './gateway.js';
import { signedInAs } from './helpers.jsx';

/**
 * Admin -> Orgs: the list shows partner, connected count and 30-day peak; a row
 * opens the detail (members, accounts); suspend / resume asks first, then PATCHes
 * the status and refreshes both the drawer and the list.
 */

const patched = [];
const listUrls = [];
const partner = { id: 'p1', name: 'Acme Partners', slug: 'acme', kind: 'external', status: 'active' };
let orgs;

const usage = { connected: 2, distinct: 3, peak: { count: 2, at: '2026-11-01T00:00:00.000Z' } };
const org = (over) => ({
  id: 'o1', externalId: 'abc@example.com', name: 'ABC Ltd', status: 'active', kind: 'partner',
  createdAt: '2026-10-20T00:00:00.000Z', accounts: { connected: 2, total: 3 }, partner, usage, ...over,
});

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /admin/orgs': (url) => {
    listUrls.push(url);
    return { success: true, data: { items: orgs, total: orgs.length, page: 1, limit: 20 } };
  },
  'GET /admin/orgs/*': () => ({
    success: true,
    data: {
      ...orgs[0],
      members: [{ role: 'owner', name: 'Ann', email: 'abc@example.com' }],
      accountList: [
        { id: 'a1', orgId: 'o1', status: 'OK', name: 'Jo Doe', publicIdentifier: 'jodoe', connectedAt: '2026-10-21T00:00:00.000Z', disconnectedAt: null },
        { id: 'a2', orgId: 'o1', status: 'DELETED', name: 'Old Member', publicIdentifier: 'old', connectedAt: '2026-10-21T00:00:00.000Z', disconnectedAt: '2026-10-25T00:00:00.000Z' },
      ],
    },
  }),
  'PATCH /admin/orgs/*': (url) => {
    patched.push(url);
    return { success: true, data: { id: 'o1', status: 'suspended', changed: true } };
  },
}));

const { AuthContext } = await import('src/core/auth/hooks/AuthContext');
const { SubscriptionContext } = await import('src/core/billing/hooks/SubscriptionContext');
const { ToastProvider, ConfirmProvider } = await import('src/core/primitives');
const { AdminOrgsPage } = await import('src/core/pages/admin/Orgs/index.jsx');
const apiGateway = (await import('src/shared/gateway/apiGateway.js')).default;

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={['/admin/orgs']}>
        <AuthContext.Provider value={{ ...signedInAs({ isAdmin: true }), user: { _id: 'a1', name: 'Admin', email: 'admin@example.com', isAdmin: true } }}>
          <SubscriptionContext.Provider value={{ status: 'active', loading: false, ready: true }}>
            <ToastProvider><ConfirmProvider><AdminOrgsPage /></ConfirmProvider></ToastProvider>
          </SubscriptionContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

beforeEach(() => {
  patched.length = 0;
  listUrls.length = 0;
  orgs = [org({}), org({ id: 'o2', externalId: 'zed@example.com', name: '', status: 'suspended', accounts: { connected: 0, total: 1 }, usage: { connected: 0, distinct: 1, peak: { count: 1, at: null } } })];
});

describe('Admin Orgs list', () => {
  it('shows the partner, status, connected count and peak per org', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('ABC Ltd')).toBeInTheDocument());
    const row = screen.getByText('ABC Ltd').closest('tr');
    expect(within(row).getByText('Acme Partners')).toBeInTheDocument();
    expect(within(row).getByText('Active')).toBeInTheDocument();
    const cells = within(row).getAllByRole('cell').map((c) => c.textContent);
    expect(cells).toContain('2');
    const suspended = screen.getByText('zed@example.com').closest('tr');
    expect(within(suspended).getByText('Suspended')).toBeInTheDocument();
  });

  it('loads page one from the server with no status filter', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('ABC Ltd')).toBeInTheDocument());
    expect(listUrls[0]).toContain('page=1');
    expect(listUrls[0]).not.toContain('status=');
  });
});

describe('Admin Orgs detail', () => {
  it('opens members and accounts for a row', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('ABC Ltd')).toBeInTheDocument());
    await userEvent.click(screen.getByText('ABC Ltd'));
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByText('Jo Doe');
    expect(within(dialog).getByText('Connected')).toBeInTheDocument();
    expect(within(dialog).getByText('Disconnected')).toBeInTheDocument();
    expect(within(dialog).getByText(/Ann · abc@example.com/)).toBeInTheDocument();
    expect(within(dialog).getByText('owner')).toBeInTheDocument();
  });

  it('suspends only after confirming, then refreshes the list', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('ABC Ltd')).toBeInTheDocument());
    await userEvent.click(screen.getByText('ABC Ltd'));
    const drawer = await screen.findByRole('dialog');
    await within(drawer).findByText('Jo Doe');
    const listCalls = listUrls.length;

    await userEvent.click(within(drawer).getByRole('button', { name: 'Suspend organization' }));
    expect(patched).toHaveLength(0);
    await userEvent.click(await screen.findByRole('button', { name: 'Suspend' }));

    await waitFor(() => expect(patched).toEqual(['/admin/orgs/o1/status']));
    expect(apiGateway.patch).toHaveBeenCalledWith('/admin/orgs/o1/status', { status: 'suspended' });
    await waitFor(() => expect(listUrls.length).toBeGreaterThan(listCalls));
  });

  it('does nothing when the confirmation is cancelled', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('ABC Ltd')).toBeInTheDocument());
    await userEvent.click(screen.getByText('ABC Ltd'));
    const drawer = await screen.findByRole('dialog');
    await within(drawer).findByText('Jo Doe');
    await userEvent.click(within(drawer).getByRole('button', { name: 'Suspend organization' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(patched).toHaveLength(0);
  });
});
