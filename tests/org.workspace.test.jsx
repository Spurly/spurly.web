import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stubGateway } from './gateway.js';
import { renderWithProviders, signedInAs } from './helpers.jsx';

/**
 * Settings -> Organization: the Workspace card (V3b.2). Everyone sees the state; only an owner
 * gets a button; ON is offered only for a direct org (a partner org is switched on by Spurly);
 * OFF always asks first and sends { orgId, enabled:false }; a refusal is shown.
 */

const patched = [];
let org;
let refuse;

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /org': () => ({ success: true, data: { orgs: [org] } }),
  'GET /org/accounts': () => ({ success: true, data: { items: [], total: 0, page: 1, limit: 50 } }),
  'PATCH /org/workspace': (url, body) => {
    patched.push(body);
    if (refuse) {
      const error = new Error('Only an owner of the organization can change this.');
      error.status = 403;
      error.error = 'WORKSPACE_OWNER_ONLY';
      throw error;
    }
    org = { ...org, workspaceEnabled: Boolean(body?.enabled) };
    return { success: true, data: { id: 'o1', workspaceEnabled: org.workspaceEnabled, changed: true } };
  },
}));

const apiGateway = (await import('src/shared/gateway/apiGateway.js')).default;
const { OrganizationTab } = await import('src/products/pages/accountSettings/components/OrganizationTab.jsx');

const makeOrg = (over) => ({
  id: 'o1', externalId: 'abc@example.com', name: 'ABC Ltd', status: 'active', role: 'owner', kind: 'direct', workspaceEnabled: false,
  accounts: { connected: 0, total: 0 }, usage: { connected: 0, distinct: 0, peak: { count: 0, at: null } }, ...over,
});

beforeEach(() => {
  patched.length = 0;
  refuse = false;
  localStorage.clear();
  org = makeOrg({});
});

describe('Settings -> Organization: workspace card', () => {
  it('an owner of a direct org can turn the workspace on', async () => {
    renderWithProviders(<OrganizationTab />, { auth: signedInAs({ _id: 'u9' }) });
    await userEvent.click(await screen.findByRole('button', { name: 'Turn on' }));
    expect(patched).toHaveLength(0);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/read-only/i)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Turn on' }));
    await waitFor(() => expect(apiGateway.patch).toHaveBeenCalledWith('/org/workspace', { orgId: 'o1', enabled: true }));
    expect(await screen.findByRole('button', { name: 'Turn off' })).toBeInTheDocument();
    expect(screen.getByText(/keeps your organization.s inbox in the app/i)).toBeInTheDocument();
  });

  it('an owner can turn it off, but only after confirming', async () => {
    org = makeOrg({ workspaceEnabled: true });
    renderWithProviders(<OrganizationTab />, { auth: signedInAs({ _id: 'u9' }) });
    await userEvent.click(await screen.findByRole('button', { name: 'Turn off' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(patched).toHaveLength(0);

    await userEvent.click(screen.getByRole('button', { name: 'Turn off' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Nothing is deleted/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Turn off' }));
    await waitFor(() => expect(patched).toEqual([{ orgId: 'o1', enabled: false }]));
    expect(await screen.findByRole('button', { name: 'Turn on' })).toBeInTheDocument();
  });

  it('a partner org that is off shows no Turn on button: Spurly switches it on', async () => {
    org = makeOrg({ kind: 'partner' });
    renderWithProviders(<OrganizationTab />, { auth: signedInAs({ _id: 'u9' }) });
    expect(await screen.findByText(/Spurly turns the workspace on for organizations like yours/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Turn on' })).toBeNull();
  });

  it('a partner org that is on can still be turned off by its owner', async () => {
    org = makeOrg({ kind: 'partner', workspaceEnabled: true });
    renderWithProviders(<OrganizationTab />, { auth: signedInAs({ _id: 'u9' }) });
    expect(await screen.findByRole('button', { name: 'Turn off' })).toBeInTheDocument();
  });

  it('a plain member sees the state and no button', async () => {
    org = makeOrg({ role: 'member', workspaceEnabled: true });
    renderWithProviders(<OrganizationTab />, { auth: signedInAs({ _id: 'u9' }) });
    expect(await screen.findByText(/keeps your organization.s inbox in the app/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Turn (on|off)$/ })).toBeNull();
  });

  it('a suspended org offers no switch', async () => {
    org = makeOrg({ status: 'suspended' });
    renderWithProviders(<OrganizationTab />, { auth: signedInAs({ _id: 'u9' }) });
    await screen.findByText('Workspace');
    expect(screen.queryByRole('button', { name: /^Turn (on|off)$/ })).toBeNull();
  });

  it('shows the server refusal and leaves the state as it was', async () => {
    refuse = true;
    renderWithProviders(<OrganizationTab />, { auth: signedInAs({ _id: 'u9' }) });
    await userEvent.click(await screen.findByRole('button', { name: 'Turn on' }));
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Turn on' }));
    expect(await screen.findByText(/Only an owner of the organization can change this/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Turn on' })).toBeInTheDocument();
  });
});
