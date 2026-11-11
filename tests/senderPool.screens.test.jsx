import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { stubGateway } from './gateway.js';

/**
 * M6.4, M6.5, M6.8 (D97): the pool screens. Solo and single-account pages must show nothing new; a pool shows who sends,
 * each account's pacing, the Sent-from column, the badge and the Rebalance action (only when it can work), and never a
 * raw error code.
 */
let campaigns = [];
let sequences = [];
let detail = null;
let members = [];
let rebalanceResult = { success: true, data: { moved: 2, refused: [] } };
let rebalanceError = null;
const rebalanced = [];

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/campaigns': () => ({ success: true, data: { campaigns } }),
  'GET /hub/campaigns/*/members': () => ({ success: true, data: { members, pagination: { page: 1, limit: 50, total: members.length } } }),
  'GET /hub/campaigns/*': () => ({ success: true, data: detail }),
  'POST /hub/campaigns/*/rebalance': (url) => {
    rebalanced.push(url);
    if (rebalanceError) throw rebalanceError;
    return rebalanceResult;
  },
  'GET /hub/sequences': () => ({ success: true, data: { sequences } }),
  'GET /hub/summary': { success: true, data: {} },
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
    <HelmetProvider>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[route]}>
        <AuthContext.Provider value={signedInAs()}>
          <SubscriptionContext.Provider value={{ status: hubSubscriber, loading: false, ready: true }}>
            <ToastProvider><ConfirmProvider><AppRoutes /></ConfirmProvider></ToastProvider>
          </SubscriptionContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

const pacing = { action: 'connect', ok: true, reason: '', message: '', timezone: 'Asia/Kolkata', quiet: { enabled: false }, hourlyCap: 6, dailyCap: 25, sentLastHour: 0, weekUsed: 1, weeklyLimit: 100, weeklyRemaining: 99, dayUsed: 1 };
const sender = (over) => ({ accountId: 'a1', name: 'Asha', accountStatus: 'OK', removed: false, usable: true, state: 'active', health: 'active', pausedReason: '', counts: { pending: 3, invited: 2, total: 5 }, ...over });

const aDetail = ({ status = 'paused', senders = null, pacingBySender = null } = {}) => ({
  campaign: { _id: 'camp-1', name: 'Pool run', status, note: '', error: '', ...(senders ? { senderMode: 'pool' } : {}) },
  counts: { total: 10, pending: 6, invited: 4, skipped: 0, failed: 0 },
  account: { status: 'OK', isPremium: false, notesAllowed: false, noteCap: 200 },
  sender: { expected: false, stale: false, lastRunAt: null, staleAfterMs: 300000 },
  pacing,
  ...(senders ? { senders } : {}),
  ...(pacingBySender ? { pacingBySender } : {}),
});

beforeEach(() => {
  campaigns = []; sequences = []; members = []; rebalanced.length = 0; rebalanceError = null;
  rebalanceResult = { success: true, data: { moved: 2, refused: [] } };
  detail = aDetail({ status: 'running' });
});

describe('pool campaign detail (M6.4)', () => {
  it('a solo / single-account campaign shows no senders panel, no Sent-from column, no Rebalance', async () => {
    members = [{ _id: 'm1', name: 'Lead One', status: 'pending' }];
    renderAt('/hub/campaigns/camp-1');
    await screen.findByText('Pool run');
    expect(screen.queryByTestId('senders-panel')).not.toBeInTheDocument();
    expect(screen.queryByText('Sent from')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /move waiting people/i })).not.toBeInTheDocument();
  });

  it('a pool shows one row per sender with its own pacing, and the Sent-from column', async () => {
    detail = aDetail({
      status: 'running',
      senders: [sender({}), sender({ accountId: 'a2', name: 'Ben', counts: { pending: 1, invited: 0, total: 1 } })],
      pacingBySender: [
        { accountId: 'a1', name: 'Asha', ok: true, reason: '', message: '', dayUsed: 4, dailyCap: 25, weekUsed: 4, weeklyLimit: 100 },
        { accountId: 'a2', name: 'Ben', ok: false, reason: 'daily-cap', message: 'Ben reached the daily limit.', dayUsed: 25, dailyCap: 25, weekUsed: 9, weeklyLimit: 100 },
      ],
    });
    members = [{ _id: 'm1', name: 'Lead One', status: 'pending', senderAccountId: 'a1', senderName: 'Asha' }];
    renderAt('/hub/campaigns/camp-1');
    const panel = await screen.findByTestId('senders-panel');
    expect(within(panel).getByText('Asha')).toBeInTheDocument();
    expect(within(panel).getByText('Ben')).toBeInTheDocument();
    expect(panel).toHaveTextContent('Sending now');
    expect(panel).toHaveTextContent('Ben reached the daily limit.');
    expect(panel).toHaveTextContent('4 of 25 today');
    expect(panel).toHaveTextContent('25 of 25 today');
    expect(await screen.findByText('Sent from')).toBeInTheDocument();
    // no solo pacing banner over a pool (it would describe the wrong account)
    expect(screen.queryByText(/across everything you send/i)).not.toBeInTheDocument();
  });

  it('Rebalance is offered only with a paused sender, enabled only when the campaign is paused, and posts', async () => {
    const senders = [sender({}), sender({ accountId: 'a2', name: 'Ben', health: 'paused', state: 'paused', pausedReason: 'breaker' })];
    detail = aDetail({ status: 'running', senders });
    const { unmount } = renderAt('/hub/campaigns/camp-1');
    const disabled = await screen.findByRole('button', { name: /move waiting people/i });
    expect(disabled).toBeDisabled();
    expect(disabled).toHaveAttribute('title', expect.stringMatching(/pause it first/i));
    unmount();

    detail = aDetail({ status: 'paused', senders });
    renderAt('/hub/campaigns/camp-1');
    const btn = await screen.findByRole('button', { name: /move waiting people/i });
    expect(btn).toBeEnabled();
    expect(btn).toHaveAttribute('title');
    await userEvent.click(btn);
    await waitFor(() => expect(rebalanced).toEqual(['/hub/campaigns/camp-1/rebalance']));
  });

  it('with every sender active there is no Rebalance button at all', async () => {
    detail = aDetail({ status: 'paused', senders: [sender({}), sender({ accountId: 'a2', name: 'Ben' })] });
    renderAt('/hub/campaigns/camp-1');
    await screen.findByTestId('senders-panel');
    expect(screen.queryByRole('button', { name: /move waiting people/i })).not.toBeInTheDocument();
  });

  it('a failed rebalance shows a sentence, never the raw code (D97); every non-active sender says why', async () => {
    detail = aDetail({ status: 'paused', senders: [sender({}), sender({ accountId: 'a2', name: 'Ben', health: 'removed', removed: true, usable: false, pausedReason: 'sender-removed' })] });
    rebalanceError = Object.assign(new Error('x'), { response: { status: 409, data: { code: 'PAUSE_FIRST', message: 'PAUSE_FIRST' } } });
    renderAt('/hub/campaigns/camp-1');
    const panel = await screen.findByTestId('senders-panel');
    expect(panel).toHaveTextContent(/this account was removed/i);
    await userEvent.click(await screen.findByRole('button', { name: /move waiting people/i }));
    await waitFor(() => expect(rebalanced).toHaveLength(1));
    expect(await screen.findByText(/pause it first, then move the waiting people/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/PAUSE_FIRST/);
    expect(panel.textContent).not.toMatch(/[A-Z]{3,}_[A-Z_]{3,}/);
  });
});

describe('lists (M6.5)', () => {
  const row = (over) => ({ _id: 'c1', name: 'Solo run', status: 'running', type: 'connect', counts: { total: 2, pending: 1, invited: 1 }, ...over });

  it('campaigns: "N accounts" badge and a "Several accounts" filter appear only when a pool exists', async () => {
    campaigns = [row({}), row({ _id: 'c2', name: 'Pool run', senderMode: 'pool', senders: [{ orgAccountId: 'a1' }, { orgAccountId: 'a2' }, { orgAccountId: 'a3' }] })];
    const { unmount } = renderAt('/hub/campaigns');
    expect(await screen.findByText('3 accounts')).toBeInTheDocument();
    const pill = screen.getByRole('radio', { name: /several accounts/i });
    await userEvent.click(pill);
    expect(screen.getByText('Pool run')).toBeInTheDocument();
    expect(screen.queryByText('Solo run')).not.toBeInTheDocument();
    unmount();

    campaigns = [row({})];
    renderAt('/hub/campaigns');
    await screen.findByText('Solo run');
    expect(screen.queryByText(/accounts$/)).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /several accounts/i })).not.toBeInTheDocument();
  });

  it('sequences: the badge and the filter, only for a pool', async () => {
    const seq = (over) => ({ _id: 's1', name: 'Solo seq', status: 'running', steps: [{ type: 'connect' }], ...over });
    sequences = [seq({}), seq({ _id: 's2', name: 'Pool seq', senderMode: 'pool', senders: [{ orgAccountId: 'a1' }, { orgAccountId: 'a2' }] })];
    renderAt('/hub/sequences');
    expect(await screen.findByText('2 accounts')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /several accounts/i })).toBeInTheDocument();
  });

  it('empty and loading states are unchanged for a user with no pool', async () => {
    renderAt('/hub/campaigns');
    expect(await screen.findByText(/no campaigns yet/i)).toBeInTheDocument();
  });
});
