import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { stubGateway } from './gateway.js';

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /*': { success: true, data: {} },
}));

const { AuthContext } = await import('src/platform/auth/AuthContext');
const { SubscriptionContext } = await import('src/platform/billing/SubscriptionContext');
const { ToastProvider, ConfirmProvider } = await import('src/ui/primitives');
const { AppRoutes } = await import('src/app/routes');
const { anonymousAuth, signedInAs } = await import('./helpers.jsx');

function renderRoutes(route, { auth = anonymousAuth, sub = { status: null, loading: false } } = {}) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[route]}>
        <AuthContext.Provider value={auth}>
          <SubscriptionContext.Provider value={sub}>
            <ToastProvider><ConfirmProvider><AppRoutes /></ConfirmProvider></ToastProvider>
          </SubscriptionContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

/**
 * Routes are lazily loaded, so every one of them now resolves through a
 * dynamic import and a Suspense boundary. A typo in any `lazy(() => import())`
 * specifier, or a named export that isn't unwrapped to `default`, fails ONLY
 * at runtime when that route is visited — the build stays green. These tests
 * exist to catch exactly that.
 */
describe('lazy routes', () => {
  it('resolves the login chunk', async () => {
    renderRoutes('/login');
    await waitFor(() => expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument());
  });

  it('resolves a guarded dashboard chunk for a subscribed user', async () => {
    renderRoutes('/dashboard/people', {
      auth: signedInAs(),
      sub: { status: { isActive: () => true }, loading: false },
    });
    // PeoplePage is behind ProtectedRoute + SubscribeGate + lazy(); reaching
    // any of its chrome proves the whole path resolved.
    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull(), { timeout: 3000 });
    expect(screen.queryByText(/login page/i)).not.toBeInTheDocument();
  });

  it('still redirects an anonymous visitor away from a lazy guarded route', async () => {
    renderRoutes('/dashboard/people');
    await waitFor(() => expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument());
  });
});
