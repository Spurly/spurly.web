import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { stubGateway } from './gateway.js';

/**
 * V3b.5: the inbox for an organization's workspace (read only).
 *
 *  1. Several LinkedIn accounts => a picker, and each row says which account it came from.
 *     One account (or a solo user) => neither: nothing to choose.
 *  2. Picking an account narrows both the list and the summary on the server.
 *  3. A workspace that is off is an explanation with a way forward, not a toast.
 *  4. An organization's conversation shows no composer and says why.
 */

let summary = null;
let chats = [];
let thread = null;
let failWith = null;
const listCalls = [];

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/inbox': () => {
    if (failWith) throw failWith;
    return { success: true, data: summary };
  },
  'GET /hub/inbox/chats': (_url, config) => {
    if (failWith) throw failWith;
    listCalls.push(config?.params ?? {});
    return { success: true, data: { chats, pagination: { page: 1, limit: 30, total: chats.length } } };
  },
  'GET /hub/inbox/chats/*': () => ({ success: true, data: thread }),
  'POST /hub/inbox/chats/*/read': { success: true, data: { ok: true } },
  'GET /*': { success: true, data: {} },
  'POST /*': { success: true, data: {} },
}));

const { AuthContext } = await import('src/core/auth/hooks/AuthContext');
const { SubscriptionContext } = await import('src/core/billing/hooks/SubscriptionContext');
import { SubscriptionSummary } from 'src/core/billing/entities/Subscription';

const hubSubscriber = SubscriptionSummary.fromResponse({ status: 'active', features: { hub: true } });

const { ToastProvider, ConfirmProvider } = await import('src/core/primitives');
const { AppRoutes } = await import('src/app/routes');
const { signedInAs } = await import('./helpers.jsx');

function renderAt(route) {
  return render(
    <StrictMode>
      <HelmetProvider>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[route]}>
          <AuthContext.Provider value={signedInAs()}>
            <SubscriptionContext.Provider value={{ status: hubSubscriber, loading: false, ready: true }}>
              <ToastProvider><ConfirmProvider><AppRoutes /></ConfirmProvider></ToastProvider>
            </SubscriptionContext.Provider>
          </AuthContext.Provider>
        </MemoryRouter>
      </HelmetProvider>
    </StrictMode>,
  );
}

const ACCOUNTS = [
  { key: 'acc-1', name: 'Asha Rao', publicIdentifier: 'asharao', status: 'OK' },
  { key: 'acc-2', name: 'Vikram Shah', publicIdentifier: 'vikramshah', status: 'OK' },
];

const aSummary = (over = {}) => ({
  connected: true,
  accountStatus: 'OK',
  sync: { status: 'done', phase: 'done', chatsSeen: 4, messagesImported: 40, error: '' },
  chats: 2,
  archived: 0,
  unread: 0,
  unreadChats: 0,
  historyPending: 0,
  live: false,
  ...over,
});

const aChat = (over = {}) => ({
  _id: 'chat-1',
  display: { name: 'Priya Raman', headline: 'Head of Sales', pictureUrl: '', profileUrl: '', source: 'attendee' },
  connectionDegree: 2,
  unreadCount: 0,
  lastMessageAt: new Date().toISOString(),
  lastMessageText: 'Sounds good, send it over',
  lastMessageIsSender: false,
  backfilledAt: new Date().toISOString(),
  readOnly: false,
  ...over,
});

beforeEach(() => {
  failWith = null;
  listCalls.length = 0;
  summary = aSummary({ accounts: ACCOUNTS });
  chats = [
    aChat({ _id: 'chat-1', account: ACCOUNTS[0] }),
    aChat({ _id: 'chat-2', display: { name: 'Dev Patel', headline: '', pictureUrl: '', profileUrl: '', source: 'attendee' }, account: ACCOUNTS[1] }),
  ];
  thread = {
    chat: aChat({ account: ACCOUNTS[0] }),
    messages: [{ _id: 'm1', text: 'Hello from the prospect', isSender: false, isEvent: false, timestamp: '2026-09-02T11:00:00.000Z' }],
    pagination: { page: 1, limit: 50, total: 1 },
    historyPending: false,
  };
});

const forbidden = (error) => Object.assign(new Error('forbidden'), { response: { status: 403, data: { success: false, error, status: 403 } } });

describe('several LinkedIn accounts', () => {
  it('shows a picker and which account each conversation came from', async () => {
    renderAt('/hub/inbox');
    expect(await screen.findByText('Priya Raman')).toBeInTheDocument();
    const picker = screen.getByRole('radiogroup', { name: /filter by linkedin account/i });
    expect(within(picker).getByText('All accounts')).toBeInTheDocument();
    expect(within(picker).getByText('Vikram Shah')).toBeInTheDocument();
    expect(screen.getByText('via Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('via Vikram Shah')).toBeInTheDocument();
  });

  it('asks the server for one account when it is picked', async () => {
    const user = userEvent.setup();
    renderAt('/hub/inbox');
    await screen.findByText('Priya Raman');
    await user.click(within(screen.getByRole('radiogroup', { name: /filter by linkedin account/i })).getByText('Vikram Shah'));
    await waitFor(() => expect(listCalls.some((p) => p.accountId === 'acc-2')).toBe(true));
  });
});

describe('one account, or a solo user', () => {
  it('one account: no picker and no "via" labels', async () => {
    summary = aSummary({ accounts: [ACCOUNTS[0]] });
    chats = [aChat({ account: ACCOUNTS[0] })];
    renderAt('/hub/inbox');
    expect(await screen.findByText('Priya Raman')).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: /filter by linkedin account/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/^via /)).not.toBeInTheDocument();
  });

  it('solo: nothing changes (no accounts in the summary)', async () => {
    summary = aSummary();
    chats = [aChat()];
    renderAt('/hub/inbox');
    expect(await screen.findByText('Priya Raman')).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: /filter by linkedin account/i })).not.toBeInTheDocument();
    expect(listCalls.every((p) => p.accountId === undefined)).toBe(true);
  });
});

describe('the workspace is not available', () => {
  it('off: explains it and points at Organization settings, with no error toast', async () => {
    failWith = forbidden('WORKSPACE_FEATURE_OFF');
    renderAt('/hub/inbox');
    expect(await screen.findByText(/shared workspace is off/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /organization settings/i })).toBeInTheDocument();
    expect(screen.queryByText(/could not load your inbox/i)).not.toBeInTheDocument();
  });

  it('a plain member is told it is for owners', async () => {
    failWith = forbidden('WORKSPACE_OWNER_ONLY');
    renderAt('/hub/inbox');
    expect(await screen.findByText(/shared inbox is for owners/i)).toBeInTheDocument();
  });
});

describe('an organization conversation', () => {
  it('shows no composer and says it is read only', async () => {
    renderAt('/hub/inbox?chat=chat-1');
    expect(await screen.findByText('Hello from the prospect')).toBeInTheDocument();
    expect(screen.getByText(/shared workspace is read-only/i)).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /reply/i })).not.toBeInTheDocument();
  });
});
