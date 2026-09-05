import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from 'src/platform/auth/AuthContext';
import { SubscriptionContext } from 'src/platform/billing/SubscriptionContext';
import { anonymousAuth, signedInAs } from './helpers.jsx';
import { ProtectedRoute } from 'src/app/ProtectedRoute';
import { SubscribeGate } from 'src/app/SubscribeGate';

const Secret = () => <div>secret content</div>;

function renderAt(ui, { auth = signedInAs(), sub = { status: null, loading: false }, route = '/dashboard' } = {}) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[route]}>
      <AuthContext.Provider value={auth}>
        <SubscriptionContext.Provider value={sub}>
          <Routes>
            <Route path="/dashboard" element={ui} />
            <Route path="/login" element={<div>login page</div>} />
            <Route path="/subscribe" element={<div>subscribe page</div>} />
          </Routes>
        </SubscriptionContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('sends an anonymous visitor to /login', () => {
    renderAt(<ProtectedRoute><Secret /></ProtectedRoute>, { auth: anonymousAuth });
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('secret content')).not.toBeInTheDocument();
  });

  it('renders the page for a signed-in user', () => {
    renderAt(<ProtectedRoute><Secret /></ProtectedRoute>);
    expect(screen.getByText('secret content')).toBeInTheDocument();
  });
});

describe('SubscribeGate', () => {
  // The gate FAILS CLOSED on purpose: anything that is not an active
  // subscription redirects, including the not-yet-loaded null state. That is
  // the behaviour worth pinning — a regression here gives away the product.
  it('redirects when there is no subscription', () => {
    renderAt(<SubscribeGate><Secret /></SubscribeGate>, { sub: { status: null, loading: false } });
    expect(screen.getByText('subscribe page')).toBeInTheDocument();
  });

  it('redirects when the subscription is not active', () => {
    renderAt(<SubscribeGate><Secret /></SubscribeGate>,
      { sub: { status: { isActive: () => false }, loading: false } });
    expect(screen.getByText('subscribe page')).toBeInTheDocument();
  });

  it('renders the page when the subscription is active', () => {
    renderAt(<SubscribeGate><Secret /></SubscribeGate>,
      { sub: { status: { isActive: () => true }, loading: false } });
    expect(screen.getByText('secret content')).toBeInTheDocument();
  });

  it('shows a loader rather than redirecting while still loading', () => {
    renderAt(<SubscribeGate><Secret /></SubscribeGate>, { sub: { status: null, loading: true } });
    expect(screen.queryByText('subscribe page')).not.toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
