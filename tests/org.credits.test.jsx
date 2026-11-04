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


describe('Settings -> Organization: credit pool (V3c.3)', () => {
  it('shows the shared pool when the workspace is on', async () => {
    org = makeOrg({ workspaceEnabled: true, credits: 300 });
    renderWithProviders(<OrganizationTab />, { auth: signedInAs({ _id: 'u9' }) });
    expect(await screen.findByText(/Your organization has 300 credits left/)).toBeInTheDocument();
  });
  it('says nothing about credits while the workspace is off', async () => {
    org = makeOrg({ workspaceEnabled: false, credits: null });
    renderWithProviders(<OrganizationTab />, { auth: signedInAs({ _id: 'u9' }) });
    await screen.findByText('Workspace');
    expect(screen.queryByText(/credits left/)).toBeNull();
  });
  it('uses the singular for one credit', async () => {
    org = makeOrg({ workspaceEnabled: true, credits: 1 });
    renderWithProviders(<OrganizationTab />, { auth: signedInAs({ _id: 'u9' }) });
    expect(await screen.findByText(/has 1 credit left/)).toBeInTheDocument();
  });
});
