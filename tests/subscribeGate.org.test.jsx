import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { stubGateway } from './gateway.js';
import { signedInAs } from './helpers.jsx';

/**
 * An org member is a real user with an exempt, no-end-date billing record, so the
 * subscription status is 'active' and SubscribeGate lets them through to the
 * dashboard instead of the paywall. A suspended org (exemption ended) still gets
 * the paywall, which proves this test can fail.
 */

let me;

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /subscriptions/me': () => ({ success: true, data: me }),
}));

const { AuthContext } = await import('src/core/auth/hooks/AuthContext');
const { SubscriptionProvider } = await import('src/core/billing/hooks/SubscriptionContext');
const { SubscribeGate } = await import('src/app/SubscribeGate.jsx');

function renderGate() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={['/dashboard']}>
      <AuthContext.Provider value={signedInAs({ _id: 'u9', email: 'abc@example.com', isManaged: false })}>
        <SubscriptionProvider>
          <Routes>
            <Route path="/dashboard" element={<SubscribeGate><p>dashboard home</p></SubscribeGate>} />
            <Route path="/subscribe" element={<p>paywall</p>} />
          </Routes>
        </SubscriptionProvider>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  me = { status: 'active', exempt: true, exemptReason: 'Organization account', appTrial: false, trialing: false };
});

describe('SubscribeGate for an org member', () => {
  it('does not redirect an exempt, active org member to the paywall', async () => {
    renderGate();
    expect(await screen.findByText('dashboard home')).toBeInTheDocument();
    expect(screen.queryByText('paywall')).not.toBeInTheDocument();
  });

  it('still sends a suspended org member (exemption ended, no trial) to the paywall', async () => {
    me = { status: 'none', exempt: false, trialEndedAt: '2026-11-04T00:00:00.000Z' };
    renderGate();
    await waitFor(() => expect(screen.getByText('paywall')).toBeInTheDocument());
    expect(screen.queryByText('dashboard home')).not.toBeInTheDocument();
  });
});
