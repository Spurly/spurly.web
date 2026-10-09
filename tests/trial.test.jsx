import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SubscriptionSummary } from 'src/core/billing/entities/Subscription.js';
import { SubscriptionContext } from 'src/core/billing/hooks/SubscriptionContext.jsx';
import { trialDaysLeft } from 'src/core/billing/trialDaysLeft.js';
import { TrialBanner } from 'src/core/layout/TrialBanner.jsx';

const DAY = 24 * 60 * 60 * 1000;
const iso = (offsetMs) => new Date(Date.now() + offsetMs).toISOString();

describe('SubscriptionSummary — free trial states', () => {
  it('a running app trial is active AND flagged as a trial (so SubscribePage lets them stay)', () => {
    const s = SubscriptionSummary.fromResponse({ status: 'active', appTrial: true, trialing: true, trialEndsAt: iso(3 * DAY) });
    expect(s.isActive()).toBe(true);
    expect(s.isAppTrial()).toBe(true);
    expect(s.isTrialEnded()).toBe(false);
    expect(s.canCancel()).toBe(false); // nothing to cancel: no subscription exists
  });

  it('trial over and unpaid → locked, with "trial ended" copy available', () => {
    const s = SubscriptionSummary.fromResponse({ status: 'none', trialEndedAt: iso(-DAY) });
    expect(s.isActive()).toBe(false);
    expect(s.isTrialEnded()).toBe(true);
    expect(s.isAppTrial()).toBe(false);
  });

  it('a paying subscriber is not an app trial', () => {
    const s = SubscriptionSummary.fromResponse({ status: 'active', razorpayStatus: 'active' });
    expect(s.isAppTrial()).toBe(false);
    expect(s.canCancel()).toBe(true);
  });

  it('never-subscribed, no trial record (an old account) is not "trial ended"', () => {
    expect(SubscriptionSummary.fromResponse({ status: 'none' }).isTrialEnded()).toBe(false);
  });
});

describe('trialDaysLeft', () => {
  it('rounds up and bottoms out at 0', () => {
    const now = Date.parse('2026-10-09T10:00:00Z');
    expect(trialDaysLeft(new Date(now + 3 * DAY), now)).toBe(3);
    expect(trialDaysLeft(new Date(now + 2.2 * DAY), now)).toBe(3);
    expect(trialDaysLeft(new Date(now + 60 * 1000), now)).toBe(1);
    expect(trialDaysLeft(new Date(now - 1000), now)).toBe(0);
    expect(trialDaysLeft('not a date', now)).toBe(0);
  });
});

function renderBanner(data) {
  const status = data ? SubscriptionSummary.fromResponse(data) : null;
  return render(
    <MemoryRouter>
      <SubscriptionContext.Provider value={{ status }}>
        <TrialBanner />
      </SubscriptionContext.Provider>
    </MemoryRouter>,
  );
}

describe('TrialBanner', () => {
  it('shows days left and an Add payment button during the trial', () => {
    renderBanner({ status: 'active', appTrial: true, trialEndsAt: iso(2.5 * DAY) });
    expect(screen.getByTestId('trial-banner')).toBeTruthy();
    expect(screen.getByText(/3 days left/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add payment' })).toBeTruthy();
  });

  it('says so on the last day', () => {
    renderBanner({ status: 'active', appTrial: true, trialEndsAt: iso(30 * 60 * 1000) });
    expect(screen.getByText(/1 day left/)).toBeTruthy();
  });

  it.each([
    ['a paying subscriber', { status: 'active', razorpayStatus: 'active' }],
    ['a comped account', { status: 'active', exempt: true }],
    ['a locked-out account', { status: 'none', trialEndedAt: iso(-DAY) }],
    ['no status yet', null],
  ])('renders nothing for %s', (_label, data) => {
    renderBanner(data);
    expect(screen.queryByTestId('trial-banner')).toBeNull();
  });
});
