import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { stubGateway } from './gateway.js';
import { signedInAs } from './helpers.jsx';

/**
 * Admin -> Orgs drawer: the Workspace switch (V3b.2). It shows the org's state, asks before
 * switching, PATCHes /admin/orgs/:id/workspace with a boolean, refreshes the drawer and the list,
 * and shows the server's refusal instead of pretending it worked.
 */

const patched = [];
const listUrls = [];
let workspaceEnabled;
let refuse;

const partner = { id: 'p1', name: 'Acme Partners', slug: 'acme', kind: 'external', status: 'active' };
const usage = { connected: 0, distinct: 0, peak: { count: 0, at: null } };
const baseOrg = () => ({
  id: 'o1', externalId: 'abc@example.com', name: 'ABC Ltd', status: 'active', kind: 'partner', workspaceEnabled,
  createdAt: '2026-10-20T00:00:00.000Z', accounts: { connected: 0, total: 0 }, partner, usage,
});

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /admin/orgs': (url) => {
    listUrls.push(url);
    return { success: true, data: { items: [baseOrg()], total: 1, page: 1, limit: 20 } };
  },
  'GET /admin/orgs/partners': () => ({ success: true, data: { items: [partner] } }),
  'GET /admin/orgs/*': () => ({ success: true, data: { ...baseOrg(), members: [], accountList: [] } }),
  'PATCH /admin/orgs/*/workspace': (url) => {
    patched.push(url);
    if (refuse) {
      const error = new Error('This organization has no owner yet. Someone must sign in to it first.');
      error.status = 409;
      error.error = 'ORG_HAS_NO_OWNER';
      throw error;
    }
    workspaceEnabled = !workspaceEnabled;
    return { success: true, data: { id: 'o1', workspaceEnabled, changed: true } };
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

async function openDrawer() {
  renderPage();
  await waitFor(() => expect(screen.getByText('ABC Ltd')).toBeInTheDocument());
  await userEvent.click(screen.getByText('ABC Ltd'));
  const drawer = await screen.findByRole('dialog');
  await within(drawer).findByText('Workspace');
  return drawer;
}

beforeEach(() => {
  patched.length = 0;
  listUrls.length = 0;
  workspaceEnabled = false;
  refuse = false;
});

describe('Admin Orgs drawer: workspace', () => {
  it('shows Off with a Turn on button for an org whose workspace is off', async () => {
    const drawer = await openDrawer();
    expect(within(drawer).getByText('Off')).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: 'Turn on' })).toBeInTheDocument();
    expect(within(drawer).getByText(/Nothing of this organization is stored/)).toBeInTheDocument();
  });

  it('turns it on only after confirming, sends enabled:true, then refreshes the drawer and the list', async () => {
    const drawer = await openDrawer();
    const listCalls = listUrls.length;
    await userEvent.click(within(drawer).getByRole('button', { name: 'Turn on' }));
    expect(patched).toHaveLength(0);
    const dialogs = await screen.findAllByRole('dialog');
    await userEvent.click(within(dialogs.at(-1)).getByRole('button', { name: 'Turn on' }));

    await waitFor(() => expect(patched).toEqual(['/admin/orgs/o1/workspace']));
    expect(apiGateway.patch).toHaveBeenCalledWith('/admin/orgs/o1/workspace', { enabled: true });
    await waitFor(() => expect(within(drawer).getByRole('button', { name: 'Turn off' })).toBeInTheDocument());
    expect(within(drawer).getByText('On')).toBeInTheDocument();
    await waitFor(() => expect(listUrls.length).toBeGreaterThan(listCalls));
  });

  it('turns it off with enabled:false when it is on', async () => {
    workspaceEnabled = true;
    const drawer = await openDrawer();
    await userEvent.click(within(drawer).getByRole('button', { name: 'Turn off' }));
    const dialogs = await screen.findAllByRole('dialog');
    await userEvent.click(within(dialogs.at(-1)).getByRole('button', { name: 'Turn off' }));
    await waitFor(() => expect(apiGateway.patch).toHaveBeenCalledWith('/admin/orgs/o1/workspace', { enabled: false }));
    await waitFor(() => expect(within(drawer).getByRole('button', { name: 'Turn on' })).toBeInTheDocument());
  });

  it('does nothing when the confirmation is cancelled', async () => {
    const drawer = await openDrawer();
    await userEvent.click(within(drawer).getByRole('button', { name: 'Turn on' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(patched).toHaveLength(0);
    expect(within(drawer).getByText('Off')).toBeInTheDocument();
  });

  it('stays Off and tells the admin when the server refuses', async () => {
    refuse = true;
    const drawer = await openDrawer();
    await userEvent.click(within(drawer).getByRole('button', { name: 'Turn on' }));
    const dialogs = await screen.findAllByRole('dialog');
    await userEvent.click(within(dialogs.at(-1)).getByRole('button', { name: 'Turn on' }));
    await waitFor(() => expect(patched).toHaveLength(1));
    expect(await screen.findByText(/no owner yet/i)).toBeInTheDocument();
    expect(within(drawer).getByText('Off')).toBeInTheDocument();
  });
});
