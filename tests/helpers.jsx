import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from 'src/platform/auth/AuthContext';
import { ToastProvider, ConfirmProvider } from 'src/ui/primitives';

/**
 * The app's real provider tree, with auth supplied directly rather than by
 * AuthProvider — a test should say "signed in as X" in one line instead of
 * driving a login flow to arrange it.
 *
 * Network is stubbed at ONE seam: shared/gateway/apiGateway. Everything above
 * it (controllers, hooks, components) is the real code, so these tests break
 * when behaviour breaks rather than when internals move.
 */
export const anonymousAuth = {
  user: null, loading: false, error: null, isAuthenticated: false,
  login: () => {}, logout: () => {}, register: () => {},
};

export function signedInAs(overrides = {}) {
  return {
    ...anonymousAuth,
    isAuthenticated: true,
    user: { _id: 'u1', name: 'Test User', email: 't@example.com', role: 'user', ...overrides },
  };
}

export function renderWithProviders(ui, { auth = signedInAs(), route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthContext.Provider value={auth}>
        <ToastProvider>
          <ConfirmProvider>{ui}</ConfirmProvider>
        </ToastProvider>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}
