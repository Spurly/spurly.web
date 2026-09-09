import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { stubGateway } from './gateway.js';

/**
 * The hub entitlement gate, in the browser.
 *
 * Three claims worth a test, because each one has already been got wrong once
 * in this codebase or its neighbour:
 *
 *  1. NOT ENTITLED lands on the upgrade page, not on a blank hub.
 *  2. ENTITLED is not slowed down or bounced by the gate at all.
 *  3. A status we have NOT FETCHED YET is not a refusal. Reading `!loading`
 *     instead of `ready` is what used to throw paid users back into
 *     onboarding on every refresh; the same mistake here would flash an
 *     upgrade page at a hub customer on every load.
 */

const ME = { _id: 'u1', name: 'Test User', email: 't@example.com', onboardingComplete: true };

let subscriptionResponse = { status: 'active', features: { hub: true } };

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /auth/me': { success: true, data: ME },
  'GET /subscriptions/me': () => ({ success: true, data: subscriptionResponse }),
}));

const { AuthProvider } = await import('src/platform/auth/AuthContext');
const { SubscriptionProvider } = await import('src/platform/billing/SubscriptionContext');
const { ProtectedRoute } = await import('src/app/ProtectedRoute');
const { SubscribeGate } = await import('src/app/SubscribeGate');
const { HubGate } = await import('src/app/HubGate');
const { SubscriptionSummary } = await import('src/platform/billing/Subscription');

function TrackLocation({ into }) {
  const { pathname } = useLocation();
  if (into[into.length - 1] !== pathname) into.push(pathname);
  return null;
}

function renderHub(visited) {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      initialEntries={['/hub/leads']}
    >
      <AuthProvider>
        <SubscriptionProvider>
          <TrackLocation into={visited} />
          <Routes>
            <Route
              path="/hub/leads"
              element={(
                <ProtectedRoute>
                  <SubscribeGate><HubGate><div>hub leads</div></HubGate></SubscribeGate>
                </ProtectedRoute>
              )}
            />
            <Route path="/hub/upgrade" element={<div>upgrade page</div>} />
            <Route path="/subscribe" element={<div>subscribe page</div>} />
            <Route path="/login" element={<div>login page</div>} />
          </Routes>
        </SubscriptionProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  subscriptionResponse = { status: 'active', features: { hub: true } };
});

describe('SubscriptionSummary.hasHub', () => {
  it('needs the feature AND an active subscription', () => {
    expect(SubscriptionSummary.fromResponse({ status: 'active', features: { hub: true } }).hasHub()).toBe(true);
    expect(SubscriptionSummary.fromResponse({ status: 'active', features: { hub: false } }).hasHub()).toBe(false);
    expect(SubscriptionSummary.fromResponse({ status: 'past_due', features: { hub: true } }).hasHub()).toBe(false);
  });

  it('reads a missing features block as no entitlement, never as yes', () => {
    // An older backend, a truncated response, a failed plan read — none of
    // those are evidence that this account owns hub.
    expect(SubscriptionSummary.fromResponse({ status: 'active' }).hasHub()).toBe(false);
  });
});

describe('HubGate', () => {
  it('sends a subscriber without hub to the upgrade page', async () => {
    subscriptionResponse = { status: 'active', features: { hub: false } };
    const visited = [];
    const { getByText } = renderHub(visited);

    await waitFor(() => expect(getByText('upgrade page')).toBeTruthy());
    expect(visited).toContain('/hub/upgrade');
  });

  it('lets an entitled subscriber straight through', async () => {
    const visited = [];
    const { getByText } = renderHub(visited);

    await waitFor(() => expect(getByText('hub leads')).toBeTruthy());
    expect(visited).not.toContain('/hub/upgrade');
  });

  it('sends an UNPAID account to /subscribe, not to the upgrade page', async () => {
    // Ordering: pay first, then upgrade. Offering a tier to someone who owes
    // for the current one sends them to a checkout that cannot help them.
    subscriptionResponse = { status: 'past_due', features: { hub: true } };
    const visited = [];
    const { getByText } = renderHub(visited);

    await waitFor(() => expect(getByText('subscribe page')).toBeTruthy());
    expect(visited).not.toContain('/hub/upgrade');
  });

  it('never flashes the upgrade page before the status has arrived', async () => {
    const visited = [];
    const { getByText } = renderHub(visited);

    // The gate waits on `ready`. If it read `!loading` the first render would
    // see status: null and redirect a paying hub customer on every load.
    expect(visited).toEqual(['/hub/leads']);
    await waitFor(() => expect(getByText('hub leads')).toBeTruthy());
  });
});
