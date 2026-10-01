import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { stubGateway } from './gateway.js';

/**
 * The Invitations page (plan M2): Sent (withdraw), Received (accept / decline),
 * Rules (both off by default), the no-account state and the refusals the server
 * can give (a cap). Also the lead drawer's follow / endorse block. Shapes are the
 * server's own responses (spurly.backend hub/invitations).
 */
const NOW = Date.now();
const DAY = 86400_000;

const sentItem = (n, over = {}) => ({
  unipileInvitationId: `inv${n}`, invitedProviderId: `P${n}`, invitedPublicId: `person-${n}`, invitedName: `Person ${n}`,
  invitedHeadline: `Headline ${n}`, note: '', sentAt: new Date(NOW - 5 * DAY).toISOString(), ageDays: 5, stale: false, ...over,
});
const recvItem = (n, over = {}) => ({
  unipileInvitationId: `r${n}`, sharedSecret: `secret${n}`, inviterProviderId: `Q${n}`, inviterName: `Inviter ${n}`,
  inviterHeadline: `Founder ${n}`, inviterPublicIdentifier: '', inviterProfileUrl: '', inviterPictureUrl: '', message: `Hello ${n}`,
  receivedAt: new Date(NOW - 2 * DAY).toISOString(), actionable: true, ...over,
});
const rulesBody = (over = {}) => ({
  autoWithdraw: { enabled: false, afterDays: 21 }, autoAccept: { enabled: false, acceptAll: false, headlineKeywords: [] },
  lastRunAt: null, lastRun: null, ...over,
});
const apiError = (status, code, message) => Object.assign(new Error(message), { code, response: { status, data: { code, message } } });

const state = {
  sent: [], received: [], rules: rulesBody(), sentError: null, withdrawError: null, respondError: null,
  calls: { withdraw: [], respond: [], saveRules: [], follow: [], endorse: [], receivedGets: 0, rulesGets: 0 },
  skills: { skills: [], endorsableCount: 0 },
};

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/invitations/sent': async () => {
    if (state.sentError) throw state.sentError;
    return { success: true, data: { items: state.sent, cursor: null, staleAfterDays: 21 } };
  },
  'DELETE /hub/invitations/sent/*': async (url) => {
    state.calls.withdraw.push(decodeURIComponent(url.split('/').pop()));
    if (state.withdrawError) throw state.withdrawError;
    return { success: true, message: 'Invitation withdrawn', data: {} };
  },
  'GET /hub/invitations/received': async () => {
    state.calls.receivedGets += 1;
    return { success: true, data: { items: state.received, cursor: null } };
  },
  'POST /hub/invitations/received/*/respond': async (url, body) => {
    state.calls.respond.push({ id: decodeURIComponent(url.split('/')[4]), body });
    if (state.respondError) throw state.respondError;
    return { success: true, message: 'ok', data: {} };
  },
  'GET /hub/invitations/rules': async () => { state.calls.rulesGets += 1; return { success: true, data: state.rules }; },
  'PUT /hub/invitations/rules': async (_url, body) => { state.calls.saveRules.push(body); return { success: true, data: { ...state.rules, ...body } }; },
  'GET /hub/invitations/usage': { success: true, data: { connected: true, usage: { withdraw_invite: { usedDay: 3, usedHour: 1, dailyCap: 30, hourlyCap: 10 }, respond_invite: { usedDay: 0, usedHour: 0, dailyCap: 50, hourlyCap: 15 } } } },
  'POST /hub/leads/*/follow': async (url) => { state.calls.follow.push(url); return { success: true, message: 'Now following', data: {} }; },
  'GET /hub/leads/*/skills': async () => ({ success: true, data: state.skills }),
  'POST /hub/leads/*/endorse': async (url, body) => { state.calls.endorse.push(body); return { success: true, message: 'Skill endorsed', data: {} }; },
  'GET /*': { success: true, data: [] },
}));

const { renderWithProviders } = await import('./helpers.jsx');
const { HubInvitationsPage } = await import('src/products/pages/invitations/index.jsx');
const { NetworkActions } = await import('src/products/pages/leads/components/NetworkActions.jsx');
const { failureKind, errorText } = await import('src/products/invitations/hooks/useInvitationsPage.js');
const { rulesError, parseKeywords } = await import('src/products/invitations/rulesDraft.js');
const { stepError, STEP_TYPE_MAP, makeStep } = await import('src/products/sequences/stepTypes.js');

beforeEach(() => {
  state.sent = [];
  state.received = [];
  state.rules = rulesBody();
  state.sentError = null;
  state.withdrawError = null;
  state.respondError = null;
  state.skills = { skills: [], endorsableCount: 0 };
  state.calls = { withdraw: [], respond: [], saveRules: [], follow: [], endorse: [], receivedGets: 0, rulesGets: 0 };
});

const open = () => renderWithProviders(<HubInvitationsPage />, { route: '/hub/invitations' });

describe('Sent tab', () => {
  it('lists pending invitations with age and a Stale flag, and the usage line', async () => {
    state.sent = [sentItem(1), sentItem(2, { ageDays: 30, stale: true })];
    open();
    await waitFor(() => expect(screen.getByText('Person 1')).toBeInTheDocument());
    expect(screen.getByText('5 days ago')).toBeInTheDocument();
    expect(screen.getByText('30 days ago')).toBeInTheDocument();
    expect(screen.getAllByText('Stale')).toHaveLength(1);
    await waitFor(() => expect(screen.getByText(/Withdrawn in the last 24 h: 3 of 30/)).toBeInTheDocument());
  });

  it('empty state says nothing is pending', async () => {
    open();
    await waitFor(() => expect(screen.getByText('No pending invitations')).toBeInTheDocument());
  });

  it('Withdraw asks first, then calls the server and removes only that row', async () => {
    state.sent = [sentItem(1), sentItem(2)];
    open();
    await waitFor(() => expect(screen.getByText('Person 1')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button', { name: 'Withdraw' })[0]);
    expect(state.calls.withdraw).toEqual([]); // not before the confirmation
    fireEvent.click(screen.getAllByRole('button', { name: 'Withdraw' }).at(-1)); // the dialog's confirm button
    await waitFor(() => expect(state.calls.withdraw).toEqual(['inv1']));
    await waitFor(() => expect(screen.queryByText('Person 1')).not.toBeInTheDocument());
    expect(screen.getByText('Person 2')).toBeInTheDocument();
  });

  it('a cap keeps the row and shows the server’s own sentence', async () => {
    state.sent = [sentItem(1)];
    state.withdrawError = apiError(429, 'ACTION_CAP', 'Today’s limit for this kind of action is reached.');
    open();
    await waitFor(() => expect(screen.getByText('Person 1')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Withdraw' }).at(-1));
    await waitFor(() => expect(state.calls.withdraw).toEqual(['inv1']));
    await waitFor(() => expect(screen.getByText(/limit for this kind of action/)).toBeInTheDocument());
    expect(screen.getByText('Person 1')).toBeInTheDocument();
  });

  it('no connected account shows the connect notice instead of a list', async () => {
    state.sentError = apiError(409, 'NO_ACCOUNT', 'Connect your LinkedIn account first');
    open();
    await waitFor(() => expect(screen.getByText('Connect your LinkedIn account first')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Open LinkedIn settings' })).toBeInTheDocument();
    expect(screen.queryByText('No pending invitations')).not.toBeInTheDocument();
  });
});

describe('Received tab', () => {
  it('loads only when opened, then lists with Accept and Decline', async () => {
    state.received = [recvItem(1), recvItem(2, { actionable: false, sharedSecret: '' })];
    open();
    await waitFor(() => expect(screen.getByText('No pending invitations')).toBeInTheDocument());
    expect(state.calls.receivedGets).toBe(0);
    fireEvent.click(screen.getByRole('tab', { name: /Received/ }));
    await waitFor(() => expect(screen.getByText('Inviter 1')).toBeInTheDocument());
    expect(state.calls.receivedGets).toBe(1);
    expect(screen.getAllByRole('button', { name: 'Accept' })).toHaveLength(1);
    expect(screen.getByText('Answer on LinkedIn')).toBeInTheDocument();
  });

  it('Accept sends the invitation’s own secret and removes the row', async () => {
    state.received = [recvItem(1)];
    open();
    fireEvent.click(await screen.findByRole('tab', { name: /Received/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Accept' }));
    await waitFor(() => expect(state.calls.respond).toEqual([{ id: 'r1', body: { action: 'accept', sharedSecret: 'secret1' } }]));
    await waitFor(() => expect(screen.queryByText('Inviter 1')).not.toBeInTheDocument());
  });
});

describe('Rules tab', () => {
  const openRules = async () => {
    open();
    fireEvent.click(await screen.findByRole('tab', { name: /Rules/ }));
    await screen.findByText('Withdraw stale invitations');
  };

  it('both automations start off', async () => {
    await openRules();
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBeGreaterThanOrEqual(3);
    expect(switches[0]).not.toBeChecked();
    expect(switches[1]).not.toBeChecked();
  });

  it('auto-accept without keywords cannot be saved', async () => {
    await openRules();
    fireEvent.click(screen.getAllByRole('switch')[1]);
    expect(await screen.findByText(/Add at least one keyword/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save rules' })).toBeDisabled();
  });

  it('saves a valid rule set in the shape the server wants', async () => {
    await openRules();
    fireEvent.click(screen.getAllByRole('switch')[0]);
    fireEvent.click(screen.getAllByRole('switch')[1]);
    fireEvent.change(screen.getByPlaceholderText('founder, cto, head of growth'), { target: { value: 'Founder, CTO' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save rules' }));
    await waitFor(() => expect(state.calls.saveRules).toHaveLength(1));
    expect(state.calls.saveRules[0]).toEqual({
      autoWithdraw: { enabled: true, afterDays: 21 },
      autoAccept: { enabled: true, acceptAll: false, headlineKeywords: ['founder', 'cto'] },
    });
  });
});

describe('helpers', () => {
  it('failureKind separates account, cap and other', () => {
    expect(failureKind(apiError(409, 'NO_ACCOUNT', 'x'))).toBe('account');
    expect(failureKind(apiError(409, 'ACCOUNT_NOT_READY', 'x'))).toBe('account');
    expect(failureKind(apiError(429, 'ACTION_CAP', 'x'))).toBe('cap');
    expect(failureKind(new Error('x'))).toBe('other');
  });
  it('a cap shows its own sentence, not the generic 429 line', () => {
    expect(errorText(apiError(429, 'ACTION_CAP', 'Your own words here.'), 'fallback')).toContain('Your own words here.');
  });
  it('rules validation mirrors the server', () => {
    expect(rulesError({ afterDays: '3', acceptEnabled: false, acceptAll: false, keywordsText: '' })).toMatch(/7 to 90/);
    expect(rulesError({ afterDays: '21', acceptEnabled: true, acceptAll: false, keywordsText: ' , ' })).toMatch(/keyword/);
    expect(rulesError({ afterDays: '21', acceptEnabled: true, acceptAll: true, keywordsText: '' })).toBeNull();
    expect(parseKeywords(' Founder, founder ,CTO ')).toEqual(['founder', 'cto']);
  });
  it('the sequence builder knows the follow step and it needs no config', () => {
    expect(STEP_TYPE_MAP.follow.label).toBe('Follow');
    expect(makeStep('follow')).toEqual({ type: 'follow', config: {}, delayDays: 0 });
    expect(stepError({ type: 'follow', config: {} })).toBeNull();
  });
});

describe('Lead drawer network actions', () => {
  const lead = { _id: 'L1', name: 'Ada' };

  it('Follow posts once and then reads Following', async () => {
    renderWithProviders(<NetworkActions lead={lead} />);
    fireEvent.click(screen.getByRole('button', { name: 'Follow' }));
    await waitFor(() => expect(state.calls.follow).toHaveLength(1));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Following' })).toBeDisabled());
  });

  it('Endorse lists only endorsable skills and endorses the one clicked', async () => {
    state.skills = { skills: [{ name: 'Node.js', endorsable: true }, { name: 'Go', endorsable: false }], endorsableCount: 1 };
    renderWithProviders(<NetworkActions lead={lead} />);
    fireEvent.click(screen.getByRole('button', { name: 'Endorse a skill' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Node.js' }));
    await waitFor(() => expect(state.calls.endorse).toEqual([{ skillName: 'Node.js' }]));
    expect(screen.queryByRole('button', { name: 'Go' })).not.toBeInTheDocument();
  });

  it('a non-connection says why nothing can be endorsed', async () => {
    state.skills = { skills: [{ name: 'Go', endorsable: false }], endorsableCount: 0 };
    renderWithProviders(<NetworkActions lead={lead} />);
    fireEvent.click(screen.getByRole('button', { name: 'Endorse a skill' }));
    await waitFor(() => expect(screen.getByText(/only be endorsed for your 1st-degree connections/)).toBeInTheDocument());
  });
});
