import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { stubGateway } from './gateway.js';
import { signedInAs } from './helpers.jsx';

/**
 * Admin Users: an organization member shows as org in its own column. The v1
 * Partner column keeps showing managed accounts only, so an org member never
 * reads as a partner account.
 */

const user = (over) => ({ _id: 'u', name: 'Someone', email: 'someone@example.com', creditBalance: 0, createdAt: '2026-10-01T00:00:00.000Z', planId: null, partner: null, org: null, ...over });
let allUsers;

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /admin/users': () => ({
    success: true,
    data: { users: allUsers, partners: [], pagination: { total: allUsers.length, limit: 20, skip: 0, pages: 1 } },
  }),
}));

const { AuthContext } = await import('src/core/auth/hooks/AuthContext');
const { SubscriptionContext } = await import('src/core/billing/hooks/SubscriptionContext');
const { ToastProvider, ConfirmProvider } = await import('src/core/primitives');
const { AdminUsersPage } = await import('src/core/pages/admin/Users/index.jsx');

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={['/admin/users']}>
        <AuthContext.Provider value={{ ...signedInAs({ isAdmin: true }), user: { _id: 'a1', name: 'Admin', email: 'admin@example.com', isAdmin: true } }}>
          <SubscriptionContext.Provider value={{ status: 'active', loading: false, ready: true }}>
            <ToastProvider><ConfirmProvider><AdminUsersPage /></ConfirmProvider></ToastProvider>
          </SubscriptionContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

beforeEach(() => {
  allUsers = [
    user({ _id: 'o1', name: 'Owner Person', email: 'abc@example.com', org: { orgId: 'org1', name: 'ABC Ltd', status: 'active', role: 'owner' } }),
    user({ _id: 'o2', name: 'Gone Person', email: 'zed@example.com', org: { orgId: 'org2', name: 'zed@example.com', status: 'suspended', role: 'member' } }),
    user({ _id: 'n1', name: 'Plain Person', email: 'plain@example.com' }),
  ];
});

describe('the Organization column', () => {
  it('names the org on member rows, flags a suspended org, and leaves ordinary users blank', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Plain Person')).toBeInTheDocument());
    const rowOf = (name) => screen.getByText(name).closest('tr');

    expect(within(rowOf('Owner Person')).getByText('Org: ABC Ltd')).toBeInTheDocument();
    expect(within(rowOf('Owner Person')).getByText('Org: ABC Ltd').closest('[title]')).toHaveAttribute('title', 'Owner of ABC Ltd');
    expect(within(rowOf('Owner Person')).queryByText('Suspended')).not.toBeInTheDocument();
    expect(within(rowOf('Gone Person')).getByText('Suspended')).toBeInTheDocument();
    expect(within(rowOf('Plain Person')).queryByText(/org:/i)).not.toBeInTheDocument();
  });

  it('never shows an org member in the Partner column', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Owner Person')).toBeInTheDocument());
    expect(screen.queryByText(/partner:/i)).not.toBeInTheDocument();
  });
});
