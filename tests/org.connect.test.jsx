import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, within } from '@testing-library/react';
import { stubGateway } from './gateway.js';

/**
 * Settings -> Organization -> connect a LinkedIn account. Uses the same sign-in
 * dialog a solo member sees, pointed at /org/accounts/connect*. Pins: connecting
 * sends the org id, a checkpoint code carries the connectId, a refused profile
 * explains itself, "Reconnect" re-uses the existing account, and nothing is said
 * about campaigns or inbox (an org does not have those yet).
 */

const calls = [];
const replies = {};
const reply = (key) => (url, config) => {
  calls.push({ key, url, body: config });
  const next = replies[key]?.shift();
  if (!next) throw new Error(`test: no reply queued for ${key}`);
  return next();
};
const ok = (data) => () => ({ success: true, data });
const fail = (status, code, message, field) => () => {
  throw { success: false, status, message, error: code, ...(field ? { field } : {}) };
};

let accounts;
const org = {
  id: 'o1', externalId: 'abc@example.com', name: 'ABC Ltd', status: 'active', role: 'owner',
  accounts: { connected: 1, total: 1 },
  usage: { connected: 1, distinct: 1, peak: { count: 1, at: '2026-11-01T00:00:00.000Z' } },
};
const account = (over) => ({ id: 'a', orgId: 'o1', status: 'OK', name: 'Someone', publicIdentifier: 'someone', connectedAt: '2026-10-21T00:00:00.000Z', disconnectedAt: null, ...over });

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /org': () => ({ success: true, data: { orgs: [org] } }),
  'GET /org/accounts': () => ({ success: true, data: { items: accounts, total: accounts.length, page: 1, limit: 50 } }),
  'GET /org/accounts/connect/status': reply('status'),
  'POST /org/accounts/connect': reply('connect'),
  'POST /org/accounts/connect/checkpoint': reply('checkpoint'),
  'POST /org/accounts/connect/checkpoint/resend': reply('resend'),
  'POST /org/accounts/connect/checkpoint/another-way': reply('another'),
}));

const { renderWithProviders, signedInAs } = await import('./helpers.jsx');
const { OrganizationTab } = await import('src/products/pages/accountSettings/components/OrganizationTab.jsx');

const dialog = () => screen.getByRole('dialog');
const inDialog = () => within(dialog());

async function openConnect() {
  renderWithProviders(<OrganizationTab />, { auth: signedInAs({ _id: 'u9' }) });
  fireEvent.click(await screen.findByRole('button', { name: 'Connect LinkedIn account' }));
  await waitFor(() => expect(dialog()).toBeInTheDocument());
}

function signIn(email = 'me@x.com', password = 'secret-pw') {
  fireEvent.change(inDialog().getByLabelText('Email or phone'), { target: { value: email } });
  fireEvent.change(inDialog().getByLabelText('LinkedIn password'), { target: { value: password } });
  fireEvent.click(inDialog().getByRole('button', { name: /^connect linkedin$/i }));
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('authToken', 'test-token');
  calls.length = 0;
  Object.keys(replies).forEach((k) => delete replies[k]);
  accounts = [account({ id: 'a1', name: 'Jo Doe' })];
  org.status = 'active';
});

describe('connect a LinkedIn account from Settings', () => {
  it('sends the org id with the credentials, then shows the new account and org-accurate copy', async () => {
    replies.connect = [ok({ state: 'connected', account: account({ id: 'a2', name: 'Sam Roe' }) })];
    await openConnect();
    expect(inDialog().getByText('Connect a LinkedIn account')).toBeInTheDocument();
    accounts = [...accounts, account({ id: 'a2', name: 'Sam Roe' })];
    signIn();

    await waitFor(() => expect(inDialog().getByText('LinkedIn account connected')).toBeInTheDocument());
    expect(inDialog().getByText('Sam Roe')).toBeInTheDocument();
    expect(inDialog().queryByText(/campaigns|inbox/i)).not.toBeInTheDocument();
    expect(calls[0].body).toMatchObject({ orgId: 'o1', method: 'credentials', username: 'me@x.com', password: 'secret-pw' });
    expect(calls[0].body.accountId).toBeUndefined();

    fireEvent.click(inDialog().getByRole('button', { name: /^done$/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('Sam Roe')).toBeInTheDocument();
  });

  it('a verification code carries the connectId the server gave', async () => {
    replies.connect = [ok({ state: 'checkpoint', connectId: 'c-123', checkpoint: { type: 'OTP', expiresAt: null } })];
    replies.checkpoint = [ok({ state: 'connected', account: account({ id: 'a2', name: 'Sam Roe' }) })];
    await openConnect();
    signIn();

    await waitFor(() => expect(inDialog().getByLabelText('Verification code')).toBeInTheDocument());
    fireEvent.change(inDialog().getByLabelText('Verification code'), { target: { value: '482913' } });
    fireEvent.click(inDialog().getByRole('button', { name: /^verify$/i }));

    await waitFor(() => expect(inDialog().getByText('LinkedIn account connected')).toBeInTheDocument());
    expect(calls.find((c) => c.key === 'checkpoint').body).toEqual({ orgId: 'o1', connectId: 'c-123', code: '482913' });
  });

  it('a profile held by another org is explained in the server’s words, and the form stays', async () => {
    replies.connect = [fail(409, 'PROFILE_IN_USE', 'This LinkedIn profile is already connected to another organization.')];
    await openConnect();
    signIn();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('already connected to another organization');
    expect(inDialog().getByLabelText('Email or phone')).toBeInTheDocument();
  });

  it('Reconnect re-uses the existing account instead of making a second one', async () => {
    accounts = [account({ id: 'a1', name: 'Jo Doe', status: 'CREDENTIALS' })];
    replies.connect = [ok({ state: 'connected', account: account({ id: 'a1', name: 'Jo Doe' }) })];
    renderWithProviders(<OrganizationTab />, { auth: signedInAs({ _id: 'u9' }) });
    fireEvent.click(await screen.findByRole('button', { name: 'Reconnect' }));
    await waitFor(() => expect(dialog()).toBeInTheDocument());
    signIn();

    await waitFor(() => expect(inDialog().getByText('LinkedIn account connected')).toBeInTheDocument());
    expect(calls[0].body).toMatchObject({ orgId: 'o1', accountId: 'a1' });
  });

  it('a healthy account has no Reconnect button', async () => {
    renderWithProviders(<OrganizationTab />, { auth: signedInAs({ _id: 'u9' }) });
    await screen.findByText('Jo Doe');
    expect(screen.queryByRole('button', { name: 'Reconnect' })).not.toBeInTheDocument();
  });

  it('a suspended org shows the notice and no Connect button', async () => {
    org.status = 'suspended';
    renderWithProviders(<OrganizationTab />, { auth: signedInAs({ _id: 'u9' }) });
    expect(await screen.findByText('This organization is suspended.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Connect LinkedIn account' })).not.toBeInTheDocument();
  });
});
