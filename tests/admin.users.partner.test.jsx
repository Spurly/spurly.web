import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { stubGateway } from './gateway.js';
import { signedInAs } from './helpers.jsx';

/**
 * Admin Users: partner badge and partner filter.
 *
 * A partner-managed user's email is a neutral placeholder that does not name the
 * partner, so the badge is the only place an operator can see whose account a
 * row is. The filter asks the SERVER (the search box only filters the current
 * page), and must start over from page one.
 */

const requested = [];
const DEXKOR = {
  slug: 'dexkor', name: 'Dexkor', partnerStatus: 'active', accountId: 'acc1', externalId: 'u1:slot1', closed: false, closedAt: null,
};
const user = (over) => ({ _id: 'u', name: 'Someone', email: 'someone@example.com', creditBalance: 0, createdAt: '2026-10-01T00:00:00.000Z', planId: null, partner: null, ...over });

let allUsers;
let partners;

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /admin/users': (url) => {
    requested.push(url);
    const slug = new URL(url, 'http://x').searchParams.get('partner') || '';
    const users = slug ? allUsers.filter((u) => u.partner?.slug === slug) : allUsers;
    return { success: true, data: { users, partners, pagination: { total: users.length, limit: 20, skip: 0, pages: 1 } } };
  },
}));

const { AuthContext } = await import('src/core/auth/hooks/AuthContext');
const { SubscriptionContext } = await import('src/core/billing/hooks/SubscriptionContext');
const { ToastProvider, ConfirmProvider } = await import('src/core/primitives');
const { AdminUsersPage } = await import('src/core/pages/admin/Users/index.jsx');
const { PartnerCell } = await import('src/core/pages/admin/Users/PartnerCell.jsx');
const adminGateway = await import('src/core/admin/gateway/admin.js');
const apiGateway = (await import('src/shared/gateway/apiGateway.js')).default;

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
  requested.length = 0;
  partners = [{ slug: 'dexkor', name: 'Dexkor', status: 'active' }, { slug: 'other', name: 'Other Co', status: 'active' }];
  allUsers = [
    user({ _id: 'p1', name: 'Acme', email: 'acct.aaaaaaaaaaaaaaaaaa@managed.getspurly.com', partner: DEXKOR }),
    user({ _id: 'p2', name: 'Beta', email: 'acct.bbbbbbbbbbbbbbbbbb@managed.getspurly.com', partner: { ...DEXKOR, accountId: 'acc2', closed: true, closedAt: '2026-10-20T00:00:00.000Z' } }),
    user({ _id: 'p3', name: 'Gamma', email: 'acct.cccccccccccccccccc@managed.getspurly.com', partner: { ...DEXKOR, slug: 'other', name: 'Other Co', partnerStatus: 'suspended' } }),
    user({ _id: 'n1', name: 'Plain Person', email: 'plain@example.com' }),
  ];
});

describe('the Partner column', () => {
  it('names the partner on managed rows and leaves ordinary users blank', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Plain Person')).toBeInTheDocument());

    const rowOf = (name) => screen.getByText(name).closest('tr');
    expect(within(rowOf('Acme')).getByText('Partner: dexkor')).toBeInTheDocument();
    expect(within(rowOf('Beta')).getByText('Partner: dexkor')).toBeInTheDocument();
    expect(within(rowOf('Beta')).getByText('Closed')).toBeInTheDocument();
    expect(within(rowOf('Acme')).queryByText('Closed')).not.toBeInTheDocument();
    expect(within(rowOf('Gamma')).getByText('Partner: other')).toBeInTheDocument();
    expect(within(rowOf('Gamma')).getByText('Suspended')).toBeInTheDocument();
    expect(within(rowOf('Plain Person')).queryByText(/partner:/i)).not.toBeInTheDocument();
  });

  it("puts the partner's own id for the account in the tooltip", () => {
    render(<PartnerCell partner={DEXKOR} />);
    expect(screen.getByText('Partner: dexkor').closest('[title]')).toHaveAttribute('title', "Partner's id: u1:slot1");
  });
});

describe('the partner filter', () => {
  it('asks the server for one partner and shows only its accounts', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Plain Person')).toBeInTheDocument());
    expect(requested.at(-1)).toBe('/admin/users?limit=20&skip=0');

    await userEvent.click(screen.getByRole('button', { name: /filter by partner/i }));
    await userEvent.click(await screen.findByRole('option', { name: 'Dexkor' }));

    await waitFor(() => expect(requested.at(-1)).toBe('/admin/users?limit=20&skip=0&partner=dexkor'));
    await waitFor(() => expect(screen.queryByText('Plain Person')).not.toBeInTheDocument());
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument();

    // Back to everyone.
    await userEvent.click(screen.getByRole('button', { name: /filter by partner/i }));
    await userEvent.click(await screen.findByRole('option', { name: 'All users' }));
    await waitFor(() => expect(screen.getByText('Plain Person')).toBeInTheDocument());
    expect(requested.at(-1)).toBe('/admin/users?limit=20&skip=0');
  });

  it('is not offered when there are no partners', async () => {
    partners = [];
    renderPage();
    await waitFor(() => expect(screen.getByText('Plain Person')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /filter by partner/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });
});

describe('admin gateway', () => {
  it('sends no partner parameter unless one is chosen, and encodes it when it is', async () => {
    apiGateway.get.mockClear();
    await adminGateway.getAllUsers(20, 40);
    expect(apiGateway.get).toHaveBeenLastCalledWith('/admin/users?limit=20&skip=40');
    await adminGateway.getAllUsers(20, 0, 'a b&c');
    expect(apiGateway.get).toHaveBeenLastCalledWith('/admin/users?limit=20&skip=0&partner=a+b%26c');
  });
});
