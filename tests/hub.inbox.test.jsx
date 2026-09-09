import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { stubGateway } from './gateway.js';

/**
 * The hub inbox.
 *
 * Five things worth pinning, and every one of them looks fine in a screenshot:
 *
 *  1. AN EMPTY INBOX HAS FOUR CAUSES AND THEY LOOK IDENTICAL. No LinkedIn, no
 *     sweep queued, a sweep still running, and a genuinely empty account. A
 *     blank screen that cannot say which one it is gets read as broken.
 *  2. `you:` ON THE PREVIEW is the only thing telling a glance whether the ball
 *     is in their court. Getting the sender backwards is the one rendering bug
 *     in a messaging product nobody forgives.
 *  3. AN UNCONFIRMED SEND IS NOT A FAILURE AND NOT A SUCCESS. LinkedIn never
 *     answered; the message may have gone out. The draft must survive and the
 *     copy must say to go and look — never offer a cheerful retry.
 *  4. A READ-ONLY CONVERSATION SHOWS NO COMPOSER. A box you can type into and
 *     never send from invites the work, then refuses it.
 *  5. STRICTMODE MUST NOT EAT THE RESPONSES. A cleanup-only mountedRef leaves
 *     every guard false for the life of the real mount — invisible in
 *     production, and it cost an afternoon in Phase 3.
 */

let summary = null;
let chats = [];
let thread = null;
let sendBehaviour = () => ({ success: true, data: { sent: true } });
const posted = [];

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/inbox': () => ({ success: true, data: summary }),
  'GET /hub/inbox/chats': () => ({
    success: true,
    data: { chats, pagination: { page: 1, limit: 30, total: chats.length } },
  }),
  'GET /hub/inbox/chats/*': () => ({ success: true, data: thread }),
  'POST /hub/inbox/chats/*/messages': (url, config) => {
    posted.push(config);
    return sendBehaviour();
  },
  'POST /hub/inbox/chats/*/read': { success: true, data: { ok: true } },
  'POST /hub/inbox/sync': { success: true, data: { sync: { _id: 's1' } } },
  'GET /*': { success: true, data: {} },
  'POST /*': { success: true, data: {} },
}));

const { AuthContext } = await import('src/platform/auth/AuthContext');
const { SubscriptionContext } = await import('src/platform/billing/SubscriptionContext');
import { SubscriptionSummary } from 'src/platform/billing/Subscription';

/**
 * The REAL summary entity, not a hand-rolled `{ isActive: () => true }`.
 * These stubs stood in for a domain object and drifted from it: the day
 * hasHub() was added, every one of them started throwing inside HubGate.
 */
const hubSubscriber = SubscriptionSummary.fromResponse({ status: 'active', features: { hub: true } });

const { ToastProvider, ConfirmProvider } = await import('src/ui/primitives');
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

const aSummary = (over = {}) => ({
  connected: true,
  accountStatus: 'OK',
  sync: { status: 'done', phase: 'done', chatsSeen: 45, messagesImported: 348, error: '' },
  chats: 45,
  archived: 5,
  unread: 2,
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

const aThread = (over = {}) => ({
  chat: aChat(over.chat),
  messages: over.messages ?? [
    { _id: 'm1', text: 'Hi Priya, thanks for connecting', isSender: true, isEvent: false, timestamp: '2026-09-01T10:00:00.000Z' },
    { _id: 'm2', text: 'Sounds good, send it over', isSender: false, isEvent: false, timestamp: '2026-09-02T11:00:00.000Z' },
  ],
  pagination: { page: 1, limit: 50, total: 2 },
  historyPending: false,
  ...over,
});

beforeEach(() => {
  summary = aSummary();
  chats = [aChat()];
  thread = aThread();
  sendBehaviour = () => ({ success: true, data: { sent: true } });
  posted.length = 0;
});

describe('an empty inbox says WHY it is empty', () => {
  it('names a missing LinkedIn connection and points at settings', async () => {
    summary = aSummary({ connected: false, accountStatus: null, sync: null, chats: 0, unread: 0 });
    chats = [];
    renderAt('/hub/inbox');

    expect(await screen.findByText(/LinkedIn is not connected/i)).toBeInTheDocument();
    // Exact label, not /settings/i — the sidebar has its own Settings button
    // and a loose matcher finds both.
    expect(screen.getByRole('button', { name: 'Go to settings' })).toBeInTheDocument();
  });

  it('offers to start a sweep when one has never been queued', async () => {
    summary = aSummary({ sync: null, chats: 0, unread: 0 });
    chats = [];
    renderAt('/hub/inbox');

    expect(await screen.findByText(/Nothing synced yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sync now/i })).toBeInTheDocument();
  });

  it('says it is still fetching rather than offering a button that changes nothing', async () => {
    summary = aSummary({ sync: { status: 'running', phase: 'messages', chatsSeen: 12, messagesImported: 40, error: '' }, chats: 0, unread: 0 });
    chats = [];
    renderAt('/hub/inbox');

    expect(await screen.findByText(/Fetching your conversations/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sync now/i })).not.toBeInTheDocument();
  });

  it('surfaces the reason a sweep failed instead of a generic empty', async () => {
    summary = aSummary({ sync: { status: 'failed', phase: 'chats', chatsSeen: 0, messagesImported: 0, error: 'Your LinkedIn connection needs attention.' }, chats: 0, unread: 0 });
    chats = [];
    renderAt('/hub/inbox');

    expect(await screen.findByText(/Your LinkedIn connection needs attention/i)).toBeInTheDocument();
  });

  it('an account with genuinely no conversations says so, and does not blame the sync', async () => {
    summary = aSummary({ chats: 0, unread: 0 });
    chats = [];
    renderAt('/hub/inbox');

    expect(await screen.findByText(/No conversations$/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sync now/i })).not.toBeInTheDocument();
  });
});

describe('the conversation list', () => {
  it('renders under StrictMode instead of sitting on Loading', async () => {
    // The Phase 3 bug: a cleanup-only mountedRef leaves every guard false for
    // the life of the real mount, so responses that plainly arrived are all
    // discarded. Invisible in production, which is why it is pinned here.
    renderAt('/hub/inbox');
    expect(await screen.findByText('Priya Raman')).toBeInTheDocument();
  });

  it('marks OUR last message with "you:" and leaves theirs unmarked', async () => {
    chats = [
      aChat({ _id: 'chat-1', display: { name: 'Priya Raman' }, lastMessageText: 'On my way', lastMessageIsSender: true }),
      aChat({ _id: 'chat-2', display: { name: 'Sam Ellis' }, lastMessageText: 'Any update?', lastMessageIsSender: false }),
    ];
    renderAt('/hub/inbox');

    await screen.findByText('Priya Raman');
    expect(screen.getByText('you:')).toBeInTheDocument();
    expect(screen.getByText('Any update?')).toBeInTheDocument();
  });

  it('says a conversation is still being fetched rather than "No messages"', async () => {
    chats = [aChat({ backfilledAt: null, lastMessageText: '' })];
    renderAt('/hub/inbox');

    expect(await screen.findByText(/Fetching history/i)).toBeInTheDocument();
  });

  it('a row is a link, so a conversation can be opened in a new tab', async () => {
    renderAt('/hub/inbox');
    const row = await screen.findByRole('link', { name: /Priya Raman/i });
    expect(row).toHaveAttribute('href', '/hub/inbox?chat=chat-1');
  });
});

describe('the thread', () => {
  it('opens from the URL and shows both sides', async () => {
    renderAt('/hub/inbox?chat=chat-1');

    expect(await screen.findByText('Hi Priya, thanks for connecting')).toBeInTheDocument();
    expect(screen.getAllByText('Sounds good, send it over').length).toBeGreaterThan(0);
  });

  it('warns that history is incomplete rather than implying the conversation is short', async () => {
    thread = aThread({ historyPending: true, messages: [] });
    renderAt('/hub/inbox?chat=chat-1');

    expect(await screen.findByText(/Still fetching this conversation/i)).toBeInTheDocument();
    expect(screen.queryByText(/No messages in this conversation/i)).not.toBeInTheDocument();
  });

  it('shows NO composer on a read-only conversation', async () => {
    // Not a disabled textarea — a box you can type into and never send from
    // invites the work and then refuses it.
    thread = aThread({ chat: { readOnly: true } });
    renderAt('/hub/inbox?chat=chat-1');

    expect(await screen.findByText(/read-only/i)).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /reply/i })).not.toBeInTheDocument();
  });

  it('sends a reply and clears the draft', async () => {
    const user = userEvent.setup();
    renderAt('/hub/inbox?chat=chat-1');

    const box = await screen.findByRole('textbox', { name: /reply/i });
    await user.type(box, 'Sending it now');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toMatchObject({ text: 'Sending it now' });
    await waitFor(() => expect(box).toHaveValue(''));
  });

  it('KEEPS the draft when LinkedIn never confirmed, and does not offer a retry', async () => {
    // The most consequential failure on this page. The message may already be
    // in someone's LinkedIn; clearing the box would lose what they wrote, and
    // a retry button would be a coin flip on sending it twice.
    const user = userEvent.setup();
    sendBehaviour = () => {
      const err = new Error('unconfirmed');
      err.response = { data: { code: 'SEND_UNCONFIRMED', message: 'no confirmation' }, status: 502 };
      throw err;
    };
    renderAt('/hub/inbox?chat=chat-1');

    const box = await screen.findByRole('textbox', { name: /reply/i });
    await user.type(box, 'Might have gone out');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText(/Check the conversation there before sending again/i)).toBeInTheDocument();
    expect(box).toHaveValue('Might have gone out');
    expect(screen.queryByRole('button', { name: /try again|retry/i })).not.toBeInTheDocument();
  });
});
