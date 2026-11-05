import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { stubGateway } from './gateway.js';
import { signedInAs } from './helpers.jsx';

/**
 * Admin -> Orgs drawer: the Inbox control (D50). It shows the org's setting and what that means, PATCHes
 * /admin/orgs/:id/inbox with the chosen mode, refreshes the drawer, and shows the server's refusal.
 */

const patched = [];
let inboxMode;
let kind;
let refuse;

const partner = { id: 'p1', name: 'Acme Partners', slug: 'acme', kind: 'external', status: 'active' };
const usage = { connected: 0, distinct: 0, peak: { count: 0, at: null } };
const baseOrg = () => ({
  id: 'o1', externalId: 'abc@example.com', name: 'ABC Ltd', status: 'active', kind, workspaceEnabled: true, inboxMode,
  createdAt: '2026-10-20T00:00:00.000Z', accounts: { connected: 0, total: 0 }, partner, usage,
});

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /admin/orgs': () => ({ success: true, data: { items: [baseOrg()], total: 1, page: 1, limit: 20 } }),
  'GET /admin/orgs/partners': () => ({ success: true, data: { items: [partner] } }),
  'GET /admin/orgs/*': () => ({ success: true, data: { ...baseOrg(), members: [], accountList: [] } }),
  'PATCH /admin/orgs/*/inbox': (url, config) => {
    patched.push(url);
    if (refuse) {
      const error = new Error('mode must be on, off or default');
      error.status = 400;
      error.error = 'INVALID_FIELD';
      throw error;
    }
    return { success: true, data: { id: 'o1', inboxMode, inbox: true, changed: true } };
  },
}));

const { AuthContext } = await import('src/core/auth/hooks/AuthContext');
const { SubscriptionContext } = await import('src/core/billing/hooks/SubscriptionContext');
const { ToastProvider, ConfirmProvider } = await import('src/core/primitives');
const { AdminOrgsPage } = await import('src/core/pages/admin/Orgs/index.jsx');
const apiGateway = (await import('src/shared/gateway/apiGateway.js')).default;

async function openDrawer() {
  render(
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
  await waitFor(() => expect(screen.getByText('ABC Ltd')).toBeInTheDocument());
  await userEvent.click(screen.getByText('ABC Ltd'));
  const drawer = await screen.findByRole('dialog');
  await within(drawer).findByText('Workspace');
  return drawer;
}

beforeEach(() => {
  patched.length = 0;
  inboxMode = null;
  kind = 'partner';
  refuse = false;
  vi.clearAllMocks();
});

describe('Admin Orgs drawer: inbox', () => {
  it('a partner org on the default says Spurly does not sync conversations', async () => {
    const drawer = await openDrawer();
    expect(within(drawer).getByText(/does not sync conversations; the partner's app does/)).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: 'Inbox' })).toHaveTextContent('Default for this kind');
  });

  it('a direct org on the default says Spurly syncs its conversations', async () => {
    kind = 'direct';
    const drawer = await openDrawer();
    expect(within(drawer).getByText(/Spurly syncs this organization's conversations/)).toBeInTheDocument();
  });

  it('choosing On sends mode:on', async () => {
    const drawer = await openDrawer();
    await userEvent.click(within(drawer).getByRole('button', { name: 'Inbox' }));
    await userEvent.click(await screen.findByRole('option', { name: 'On' }));
    await waitFor(() => expect(patched).toEqual(['/admin/orgs/o1/inbox']));
    expect(apiGateway.patch).toHaveBeenCalledWith('/admin/orgs/o1/inbox', { mode: 'on' });
  });

  it('an explicit Off is shown as Off and choosing it again sends nothing', async () => {
    inboxMode = 'off';
    kind = 'direct';
    const drawer = await openDrawer();
    expect(within(drawer).getByRole('button', { name: 'Inbox' })).toHaveTextContent('Off');
    expect(within(drawer).getByText(/does not sync conversations/)).toBeInTheDocument();
    await userEvent.click(within(drawer).getByRole('button', { name: 'Inbox' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Off' }));
    expect(patched).toHaveLength(0);
  });

  it('shows the server refusal', async () => {
    refuse = true;
    const drawer = await openDrawer();
    await userEvent.click(within(drawer).getByRole('button', { name: 'Inbox' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Off' }));
    expect(await screen.findByText(/mode must be on, off or default/i)).toBeInTheDocument();
  });
});
