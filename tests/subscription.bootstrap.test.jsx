import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { stubGateway } from './gateway.js';

const ME = {
  _id: 'u1',
  name: 'Test User',
  email: 't@example.com',
  onboardingComplete: true,
};

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /auth/me': { success: true, data: ME },
  'GET /subscriptions/me': { success: true, data: { status: 'active' } },
}));

const { AuthProvider } = await import('src/platform/auth/AuthContext');
const { SubscriptionProvider } = await import('src/platform/billing/SubscriptionContext');
const { ProtectedRoute } = await import('src/app/ProtectedRoute');
const { SubscribeGate } = await import('src/app/SubscribeGate');

/** Records every path the router actually settles on, redirects included. */
function TrackLocation({ into }) {
  const { pathname } = useLocation();
  if (into[into.length - 1] !== pathname) into.push(pathname);
  return null;
}

function renderApp(visited) {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      initialEntries={['/dashboard/people']}
    >
      <AuthProvider>
        <SubscriptionProvider>
          <TrackLocation into={visited} />
          <Routes>
            <Route
              path="/dashboard/people"
              element={<ProtectedRoute><SubscribeGate><div>people page</div></SubscribeGate></ProtectedRoute>}
            />
            <Route path="/login" element={<div>login page</div>} />
            <Route path="/subscribe" element={<div>subscribe page</div>} />
            <Route path="/onboarding" element={<div>onboarding survey</div>} />
            <Route path="/onboarding/install" element={<div>install extension</div>} />
          </Routes>
        </SubscriptionProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

/**
 * The refresh loop, end to end, through the REAL providers.
 *
 * A signed-in subscriber refreshing a dashboard page was being thrown out to
 * /subscribe and forwarded from there into onboarding, landing on
 * /onboarding/install with no way back. The cause was ordering, not state:
 * SubscriptionProvider reported `loading: false, status: null` while auth was
 * still bootstrapping, and SubscribeGate — which fails closed on a null
 * status — acted on that before the status fetch had even been kicked off.
 *
 * This is deliberately a full-provider test rather than a unit test of the
 * gate. The bug lived entirely in the ORDER the two providers settle in;
 * supplying either context by hand is exactly what hides it.
 */
describe('dashboard refresh with a cookie session', () => {
  beforeEach(() => {
    // No localStorage token or user: a Google / LinkedIn OAuth session. This
    // is the losing path — AuthProvider sets `user` and clears its loading
    // flag in the same batch, so there is no intermediate render for
    // SubscriptionProvider's effect to run in.
    localStorage.clear();
  });

  it('lands on the requested page and never detours through the paywall', async () => {
    const visited = [];
    renderApp(visited);

    await waitFor(() => expect(screen.getByText('people page')).toBeInTheDocument());

    expect(visited).toEqual(['/dashboard/people']);
    expect(screen.queryByText('subscribe page')).not.toBeInTheDocument();
    expect(screen.queryByText('install extension')).not.toBeInTheDocument();
  });

  it('holds a loader while the status is in flight instead of guessing', async () => {
    const visited = [];
    renderApp(visited);

    // Before anything resolves the gate must be waiting, not deciding.
    expect(screen.queryByText('subscribe page')).not.toBeInTheDocument();
    expect(screen.queryByText('people page')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('people page')).toBeInTheDocument());
    expect(visited).toEqual(['/dashboard/people']);
  });
});

describe('dashboard refresh with a stored session', () => {
  beforeEach(() => {
    localStorage.setItem('authToken', 'test-token');
    localStorage.setItem('user', JSON.stringify(ME));
  });

  it('still lands on the requested page', async () => {
    const visited = [];
    renderApp(visited);

    await waitFor(() => expect(screen.getByText('people page')).toBeInTheDocument());
    expect(visited).toEqual(['/dashboard/people']);
  });
});
