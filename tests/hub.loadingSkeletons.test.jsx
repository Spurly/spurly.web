import { StrictMode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { stubGateway } from './gateway.js';

/**
 * Every hub screen must be SHAPED while it loads, not a word.
 *
 * The thing being pinned is easy to regress and invisible in a screenshot of
 * the finished page: each of these routes spent a release rendering the string
 * "Loading…" into an otherwise empty card, so the whole Automated section read
 * as broken on every cold load and jumped when the data landed.
 *
 * A never-resolving gateway holds each page in its loading state for the life
 * of the assertion — the only way to look at a state that normally exists for
 * a few hundred milliseconds.
 */

const NEVER = () => new Promise(() => {});

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /*': NEVER,
  'POST /*': NEVER,
}));

const { AuthContext } = await import('src/platform/auth/hooks/AuthContext');
const { SubscriptionContext } = await import('src/platform/billing/hooks/SubscriptionContext');
const { SubscriptionSummary } = await import('src/platform/billing/entities/Subscription');
const { ToastProvider, ConfirmProvider } = await import('src/ui/primitives');
const { AppRoutes } = await import('src/app/routes');
const { signedInAs } = await import('./helpers.jsx');

const hubSubscriber = SubscriptionSummary.fromResponse({ status: 'active', features: { hub: true } });

function renderAt(route) {
  return render(
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
}

const ROUTES = [
  ['campaigns', '/hub/campaigns'],
  ['sequences', '/hub/sequences'],
  ['the inbox', '/hub/inbox'],
  ['one campaign', '/hub/campaigns/camp-1'],
  ['one sequence', '/hub/sequences/seq-1'],
];

describe('the hub loads into a skeleton, never into the word "Loading"', () => {
  it.each(ROUTES)('%s', async (_name, route) => {
    const { container } = renderAt(route);

    // aria-busy is what every loading state in the app carries — the page-level
    // skeleton wrappers set it, and so does DataTable while it draws skeleton
    // rows. Finding one means the page drew its own shape rather than a
    // sentence about waiting.
    await waitFor(() => {
      expect(container.querySelectorAll('[aria-busy="true"]').length).toBeGreaterThan(0);
    });

    // The regression itself: the literal string, alone in an empty card.
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
  });
});
