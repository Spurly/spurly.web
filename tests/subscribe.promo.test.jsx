import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { stubGateway } from './gateway.js';
import { renderWithProviders } from './helpers.jsx';

/**
 * The promo code box on the payment screen (/subscribe).
 *
 * Real SubscribePage, controller, gateway shape and SubscriptionProvider; only
 * the network seam is stubbed. What is pinned: the box stays out of the way
 * until asked for; a good code sends exactly the typed text, starts the trial
 * and leaves for the app ONLY once the app-wide status shows it (the gates
 * would bounce a user back otherwise); a refused code shows the server's own
 * words and keeps the user on the page; and the box is not offered on screens
 * where it can never apply.
 */

let me;
let redeemResult;

vi.mock('src/shared/gateway/apiGateway.js', () =>
  stubGateway({
    'GET /subscriptions/me': () => ({ success: true, data: me }),
    'GET /subscriptions/pricing': {
      success: true,
      data: {
        region: 'IN',
        currency: 'INR',
        amount: 1499,
        trialDays: 0,
        trialEligible: false,
        firstChargeAt: null,
        checkoutAvailable: true,
        exempt: false,
      },
    },
    'POST /subscriptions/promo/redeem': () => redeemResult(),
  })
);

const apiGateway = (await import('src/shared/gateway/apiGateway.js')).default;
const { SubscriptionProvider } = await import('src/core/billing/hooks/SubscriptionContext.jsx');
const { default: SubscribePage } = await import('src/core/pages/auth/SubscribePage.jsx');

const DAY = 24 * 60 * 60 * 1000;
const trialMe = () => ({ status: 'active', appTrial: true, trialing: true, trialEndsAt: new Date(Date.now() + 7 * DAY).toISOString() });

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/subscribe" element={<SubscriptionProvider><SubscribePage /></SubscriptionProvider>} />
      <Route path="/dashboard" element={<div>DASHBOARD</div>} />
    </Routes>,
    { route: '/subscribe' }
  );
}

async function openPromoBox() {
  await userEvent.click(await screen.findByRole('button', { name: 'Have a promo code?' }));
  return screen.getByLabelText('Promo code');
}

beforeEach(() => {
  vi.clearAllMocks();
  me = { status: 'none' };
  redeemResult = () => ({ success: true, data: trialMe() });
});

describe('promo box on /subscribe', () => {
  it('is a quiet link until asked for, then an input with Apply disabled while empty', async () => {
    renderPage();
    expect(await screen.findByRole('button', { name: 'Have a promo code?' })).toBeTruthy();
    expect(screen.queryByLabelText('Promo code')).toBeNull();

    const input = await openPromoBox();
    expect(screen.queryByRole('button', { name: 'Have a promo code?' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Apply' }).disabled).toBe(true);
    await userEvent.type(input, '   ');
    expect(screen.getByRole('button', { name: 'Apply' }).disabled).toBe(true);
  });

  it('a good code: sends what was typed, starts the trial, and enters the app once status shows it', async () => {
    renderPage();
    const input = await openPromoBox();
    await userEvent.type(input, 'spurly7');
    // The server flips the account to a trial; the next /me read reports it.
    redeemResult = () => {
      me = trialMe();
      return { success: true, data: me };
    };
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await screen.findByText('DASHBOARD');
    expect(apiGateway.post).toHaveBeenCalledWith('/subscriptions/promo/redeem', { code: 'spurly7' });
  });

  it('Enter in the box submits it too', async () => {
    renderPage();
    const input = await openPromoBox();
    redeemResult = () => {
      me = trialMe();
      return { success: true, data: me };
    };
    await userEvent.type(input, 'SPURLY7{Enter}');
    await screen.findByText('DASHBOARD');
  });

  it('a refused code shows the server’s own words, keeps the user here, and can be retried', async () => {
    redeemResult = () => ({ success: false, message: "That promo code isn't valid." });
    renderPage();
    const input = await openPromoBox();
    await userEvent.type(input, 'NOPE');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect((await screen.findByRole('alert')).textContent).toBe("That promo code isn't valid.");
    expect(screen.queryByText('DASHBOARD')).toBeNull();
    // Editing clears the error, and the user can try again.
    await userEvent.type(input, 'X');
    expect(screen.queryByText("That promo code isn't valid.")).toBeNull();
    expect(screen.getByRole('button', { name: 'Apply' }).disabled).toBe(false);
  });

  it('an ineligible account sees the exact reason (already used)', async () => {
    redeemResult = () => ({ success: false, message: 'This account has already used its free trial.' });
    renderPage();
    await userEvent.type(await openPromoBox(), 'SPURLY7');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect((await screen.findByRole('alert')).textContent).toBe('This account has already used its free trial.');
  });

  it('never leaves for the app on the code alone: if status does not show the trial, it says so instead', async () => {
    // Redeem "succeeds" but /me still reports no access (stale read).
    renderPage();
    await userEvent.type(await openPromoBox(), 'SPURLY7');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/has not updated yet/);
    expect(screen.queryByText('DASHBOARD')).toBeNull();
  });

  it('while it is being applied the box and the Subscribe button are locked', async () => {
    let release;
    redeemResult = () =>
      new Promise((resolve) => {
        release = () => {
          me = trialMe();
          resolve({ success: true, data: me });
        };
      });
    renderPage();
    await userEvent.type(await openPromoBox(), 'SPURLY7');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(screen.getByLabelText('Promo code').disabled).toBe(true));
    expect(screen.getByRole('button', { name: /Applying/ }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: /Subscribe · / }).disabled).toBe(true);
    release();
    await screen.findByText('DASHBOARD');
  });

  it.each([
    ['the trial has already ended', { status: 'none', trialEndedAt: new Date(Date.now() - DAY).toISOString() }],
    ['the payment failed (past due)', { status: 'past_due' }],
  ])('is not offered when %s', async (_label, data) => {
    me = data;
    renderPage();
    await screen.findByRole('button', { name: /Subscribe · |Subscribe/ });
    expect(screen.queryByRole('button', { name: 'Have a promo code?' })).toBeNull();
  });
});
