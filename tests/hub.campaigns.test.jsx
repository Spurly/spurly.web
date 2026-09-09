import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { stubGateway } from './gateway.js';

/**
 * Hub campaigns.
 *
 * Four things worth pinning, every one of which looks fine in a screenshot and
 * is wrong in use:
 *
 *  1. A RUNNING CAMPAIGN THAT IS NOT SENDING MUST SAY WHY. Pacing means a
 *     healthy campaign is idle most of the day; without the server's verdict
 *     on the page, "Running" over a count that never moves reads as broken.
 *  2. THE NOTE FIELD IS ABSENT ON A FREE ACCOUNT, not merely ignored. LinkedIn
 *     silently drops notes there after about five a month, so offering the
 *     field would promise personalisation the product cannot deliver.
 *  3. THE WEEKLY NUMBER IS EVERYTHING THE USER SENDS, extension included. It
 *     will not match this campaign's own count, and unexplained that reads as
 *     a bug.
 *  4. CREATING FROM A SELECTION SENDS NOTHING. The campaign starts as a draft;
 *     any copy implying otherwise is the worst thing to be vague about in a
 *     product that contacts real people.
 */

let campaigns = [];
let detail = null;
let members = [];
const posted = [];

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/campaigns': () => ({ success: true, data: { campaigns } }),
  'GET /hub/campaigns/*/members': () => ({
    success: true,
    data: { members, pagination: { page: 1, limit: 50, total: members.length } },
  }),
  'GET /hub/campaigns/*': () => ({ success: true, data: detail }),
  'GET /hub/searches': { success: true, data: { searches: [] } },
  'GET /hub/leads': () => ({
    success: true,
    data: {
      leads: [{
        _id: 'lead-1',
        name: 'Asha Menon',
        headline: 'Head of Sales',
        connectionDegree: 3,
        profileUrl: 'https://www.linkedin.com/in/asha',
      }],
      pagination: { page: 1, limit: 50, total: 1 },
    },
  }),
  'POST /hub/campaigns': (url, config) => {
    posted.push(config);
    return { success: true, data: { campaign: { _id: 'camp-1', name: 'Auto named' }, enrolled: 1 } };
  },
  'GET /*': { success: true, data: {} },
  'POST /*': { success: true, data: {} },
  'PATCH /*': { success: true, data: {} },
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

const aDetail = (over = {}) => ({
  campaign: { _id: 'camp-1', name: 'Q3 founders', status: 'running', note: '', error: '', ...over.campaign },
  counts: { total: 3, pending: 2, invited: 1, skipped: 0, failed: 0, ...over.counts },
  account: { status: 'OK', isPremium: false, notesAllowed: false, noteCap: 200, ...over.account },
  sender: { expected: true, stale: false, lastRunAt: new Date().toISOString(), staleAfterMs: 300000, ...over.sender },
  pacing: {
    ok: false,
    reason: 'outside-hours',
    message: 'Outside your sending hours — this picks up again in the next window.',
    timezone: 'Asia/Kolkata',
    window: { startHour: 9, endHour: 18, days: [1, 2, 3, 4, 5] },
    hourlyCap: 6,
    dailyCap: 25,
    sentLastHour: 0,
    weekUsed: 12,
    weeklyLimit: 200,
    weeklyRemaining: 188,
    dayUsed: 1,
    ...over.pacing,
  },
});

beforeEach(() => {
  campaigns = [];
  members = [];
  detail = aDetail();
  posted.length = 0;
});

describe('campaigns list', () => {
  it('resolves the lazy chunk and points at the leads page when there is nothing yet', async () => {
    renderAt('/hub/campaigns');
    await waitFor(() => expect(screen.getByText(/no campaigns yet/i)).toBeInTheDocument());
    // Campaigns are built from an audience, so the empty state is a signpost
    // rather than a create button that would make an empty campaign.
    expect(screen.getByRole('button', { name: /go to leads/i })).toBeInTheDocument();
  });

  it('shows counts, never a progress bar', async () => {
    campaigns = [{
      _id: 'camp-1',
      name: 'Q3 founders',
      status: 'running',
      counts: { total: 40, pending: 33, invited: 6, skipped: 1, failed: 0 },
    }];

    renderAt('/hub/campaigns');

    await waitFor(() => expect(screen.getByText(/6 invited/i)).toBeInTheDocument());
    expect(screen.getByText(/33 queued/i)).toBeInTheDocument();
    expect(document.querySelector('progress')).toBeNull();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});

describe('campaign detail', () => {
  it('explains why a running campaign is sending nothing', async () => {
    renderAt('/hub/campaigns/camp-1');
    await waitFor(() =>
      expect(screen.getByText(/outside your sending hours/i)).toBeInTheDocument(),
    );
  });

  it('says the weekly budget covers everything the user sends, not just this campaign', async () => {
    renderAt('/hub/campaigns/camp-1');
    await waitFor(() => expect(screen.getByText(/12 of 200 invitations used this week/i)).toBeInTheDocument());
    expect(screen.getByText(/across everything you send/i)).toBeInTheDocument();
  });

  it('offers no note field on a free account, and explains the absence', async () => {
    renderAt('/hub/campaigns/camp-1');
    await waitFor(() => expect(screen.getByText(/plain connection request/i)).toBeInTheDocument());
    expect(screen.queryByLabelText(/connection note/i)).not.toBeInTheDocument();
    expect(screen.getByText(/need linkedin premium/i)).toBeInTheDocument();
  });

  it('gives Premium a note field, capped at the tier LinkedIn actually allows', async () => {
    detail = aDetail({ account: { isPremium: true, notesAllowed: true, noteCap: 300 }, campaign: { status: 'draft' } });

    renderAt('/hub/campaigns/camp-1');

    const field = await screen.findByLabelText(/connection note/i);
    expect(field).toHaveAttribute('maxLength', '300');
  });

  it('locks the note while running, because the people already invited got the old one', async () => {
    detail = aDetail({ account: { isPremium: true, notesAllowed: true, noteCap: 300 }, campaign: { status: 'running' } });

    renderAt('/hub/campaigns/camp-1');

    const field = await screen.findByLabelText(/connection note/i);
    expect(field).toBeDisabled();
    expect(screen.getByText(/pause the campaign to change the note/i)).toBeInTheDocument();
  });

  it('names the reason a member was skipped, including the extension’s own sends', async () => {
    members = [{
      _id: 'm1',
      name: 'Asha Menon',
      headline: 'Head of Sales',
      status: 'skipped',
      skipReason: 'already-invited',
      profileUrl: 'https://www.linkedin.com/in/asha',
    }];

    renderAt('/hub/campaigns/camp-1');

    await waitFor(() => expect(screen.getByText(/already invited — including from the extension/i)).toBeInTheDocument());
  });
});

/**
 * StrictMode double-invokes effects in development: mount, clean up, mount
 * again. Every page here guards its setState on a `mountedRef`, and a ref that
 * is only ever cleared stays false through the real mount — so the data
 * arrives, is discarded, and the page sits on "Loading…" forever.
 *
 * It never reaches production, where the double invoke does not happen, which
 * is precisely why it needs a test: `npm run dev` was broken while every test
 * and the build were green. Observed 2026-09-08 on both hub pages.
 */
/**
 * The heartbeat.
 *
 * "Running" is what the user asked for; it is not evidence that anything is
 * acting on it. A dead cron is completely silent, so without this the page
 * would keep reporting a paced, healthy campaign over a worker that stopped
 * hours ago — the exact failure the user most needs to see.
 */
describe('the sender heartbeat', () => {
  it('mentions the last check-in quietly when everything is fine', async () => {
    renderAt('/hub/campaigns/camp-1');
    await waitFor(() => expect(screen.getByText(/sender last checked in/i)).toBeInTheDocument());
    expect(screen.queryByText(/nothing has picked it up/i)).not.toBeInTheDocument();
  });

  it('contradicts the campaign’s own status when nothing has picked it up', async () => {
    detail = aDetail({ sender: { expected: true, stale: true, lastRunAt: '2026-09-08T09:00:00.000Z' } });

    renderAt('/hub/campaigns/camp-1');

    await waitFor(() => expect(screen.getByText(/nothing has picked it up/i)).toBeInTheDocument());
    expect(screen.getByText(/no invitations are going out/i)).toBeInTheDocument();
    // The pacing banner is suppressed: describing rules nothing is applying is
    // the most confident lie this page could tell.
    expect(screen.queryByText(/sending now, a few at a time/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/outside your sending hours/i)).not.toBeInTheDocument();
  });

  it('says nothing at all about a campaign that is not running', async () => {
    detail = aDetail({ campaign: { status: 'paused' }, sender: { expected: false, stale: false, lastRunAt: null } });

    renderAt('/hub/campaigns/camp-1');

    await waitFor(() => expect(screen.getByText(/plain connection request/i)).toBeInTheDocument());
    expect(screen.queryByText(/nothing has picked it up/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sender last checked in/i)).not.toBeInTheDocument();
  });
});

describe('under StrictMode', () => {
  const renderStrict = (route) => render(
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

  it('the campaigns list still renders its rows after a remount', async () => {
    campaigns = [{
      _id: 'camp-1',
      name: 'Q3 founders',
      status: 'running',
      counts: { total: 3, pending: 2, invited: 1, skipped: 0, failed: 0 },
    }];

    renderStrict('/hub/campaigns');

    await waitFor(() => expect(screen.getByText('Q3 founders')).toBeInTheDocument());
    expect(screen.queryByText(/^Loading…$/)).not.toBeInTheDocument();
  });

  it('the campaign detail still renders after a remount', async () => {
    renderStrict('/hub/campaigns/camp-1');
    await waitFor(() => expect(screen.getByText(/outside your sending hours/i)).toBeInTheDocument());
  });

  it('the leads table still fills after a remount', async () => {
    renderStrict('/hub/leads');
    await waitFor(() => expect(screen.getByText('Asha Menon')).toBeInTheDocument());
  });
});

describe('creating from a selection', () => {
  it('creates in one click and promises that nothing has been sent', async () => {
    const user = userEvent.setup();
    renderAt('/hub/leads');

    await waitFor(() => expect(screen.getByText('Asha Menon')).toBeInTheDocument());

    // The row checkbox, not the header one — selecting everything would not
    // prove the selection reaches the request.
    const boxes = screen.getAllByRole('checkbox');
    await user.click(boxes[boxes.length - 1]);

    await user.click(await screen.findByRole('button', { name: /create campaign/i }));

    await waitFor(() => expect(posted.length).toBe(1));
    expect(posted[0].leadIds).toEqual(['lead-1']);
    // No name is asked for and none is sent: the server names it, the same
    // call the extension's campaigns already made.
    expect(posted[0].name).toBeUndefined();
    expect(await screen.findByText(/nothing sends until you start it/i)).toBeInTheDocument();
  });
});
