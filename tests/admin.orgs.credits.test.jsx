import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { stubGateway } from './gateway.js';
import { signedInAs } from './helpers.jsx';

/**
 * (V3c.3) Admin -> Orgs drawer: the credit pool and "Add credits". Header of the sibling test follows. Workspace switch (V3b.2). It shows the org's state, asks before
 * switching, PATCHes /admin/orgs/:id/workspace with a boolean, refreshes the drawer and the list,
 * and shows the server's refusal instead of pretending it worked.
 */

const patched = [];
const listUrls = [];
let workspaceEnabled = true;
let refuse = false;
let credits = 300;
const posted = [];

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
  'GET /admin/orgs/*': () => ({ success: true, data: { ...baseOrg(), members: [], accountList: [], credits: workspaceEnabled ? credits : null } }),
  'POST /admin/orgs/*/credits': (url, body) => {
    posted.push({ url, body });
    if (refuse) { const e = new Error('amount must be a whole number from 1 to 100000'); e.status = 400; e.error = 'INVALID_FIELD'; throw e; }
    credits += body.amount;
    return { success: true, data: { creditBalance: credits, added: body.amount } };
  },
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


beforeEach(() => { posted.length = 0; credits = 300; workspaceEnabled = true; refuse = false; });

describe('Admin -> Orgs drawer: credit pool', () => {
  it('shows the pool and adds whole credits, then shows the new balance', async () => {
    const drawer = await openDrawer();
    expect(await within(drawer).findByText('300')).toBeInTheDocument();
    const add = within(drawer).getByRole('button', { name: 'Add credits' });
    expect(add).toBeDisabled();
    await userEvent.type(within(drawer).getByLabelText('Credits to add'), '50');
    await userEvent.click(add);
    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0].body).toMatchObject({ amount: 50 });
    expect(posted[0].url).toContain('/admin/orgs/o1/credits');
    expect(await within(drawer).findByText('350')).toBeInTheDocument();
  });

  it('does not offer a top-up before the workspace exists (no pool)', async () => {
    workspaceEnabled = false;
    const drawer = await openDrawer();
    expect(within(drawer).queryByText('Credits in the pool')).toBeNull();
    expect(within(drawer).queryByRole('button', { name: 'Add credits' })).toBeNull();
  });

  it('a decimal or zero amount keeps the button disabled and sends nothing', async () => {
    const drawer = await openDrawer();
    const input = within(drawer).getByLabelText('Credits to add');
    await userEvent.type(input, '1.5');
    expect(within(drawer).getByRole('button', { name: 'Add credits' })).toBeDisabled();
    await userEvent.clear(input);
    await userEvent.type(input, '0');
    expect(within(drawer).getByRole('button', { name: 'Add credits' })).toBeDisabled();
    expect(posted).toHaveLength(0);
  });
});
