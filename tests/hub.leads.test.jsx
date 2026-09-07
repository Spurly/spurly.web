import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { stubGateway } from './gateway.js';

/**
 * The hub leads page and the workspace switcher.
 *
 * Three things worth pinning, all of which look fine in a screenshot and are
 * wrong in use:
 *
 *  1. THE HUB CHUNK ACTUALLY RESOLVES. Routes are lazy, so a typo in the
 *     import specifier or an unwrapped named export fails only when someone
 *     visits — the build stays green either way.
 *  2. PROGRESS IS A COUNT, NEVER A BAR. Classic LinkedIn search returns no
 *     total, so a percentage would need an invented denominator.
 *  3. NO CONNECTED ACCOUNT IS A DIFFERENT PAGE, NOT A TOAST. The fix lives
 *     somewhere else, and a toast that vanishes cannot say where.
 */

let searches = [];

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/searches': () => ({ success: true, data: { searches } }),
  'GET /hub/leads': {
    success: true,
    data: {
      leads: [
        {
          _id: 'lead-1',
          name: 'Asha Menon',
          headline: 'Head of Sales',
          location: 'Bengaluru',
          followersCount: 4211,
          connectionDegree: 2,
          profileUrl: 'https://www.linkedin.com/in/asha',
        },
      ],
      pagination: { page: 1, limit: 50, total: 1 },
    },
  },
  'GET /*': { success: true, data: {} },
  'POST /*': { success: true, data: {} },
}));

const { AuthContext } = await import('src/platform/auth/AuthContext');
const { SubscriptionContext } = await import('src/platform/billing/SubscriptionContext');
const { ToastProvider, ConfirmProvider } = await import('src/ui/primitives');
const { AppRoutes } = await import('src/app/routes');
const { signedInAs } = await import('./helpers.jsx');

function renderAt(route) {
  return render(
    <HelmetProvider>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[route]}>
        <AuthContext.Provider value={signedInAs()}>
          <SubscriptionContext.Provider value={{ status: { isActive: () => true }, loading: false }}>
            <ToastProvider><ConfirmProvider><AppRoutes /></ConfirmProvider></ToastProvider>
          </SubscriptionContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

beforeEach(() => {
  searches = [];
});

describe('hub leads', () => {
  it('resolves the lazy hub chunk and renders the import form', async () => {
    renderAt('/hub/leads');
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/linkedin\.com\/search\/results/i)).toBeInTheDocument(),
    );
  });

  it('/hub lands on leads rather than 404ing', async () => {
    renderAt('/hub');
    await waitFor(() => expect(screen.getByRole('heading', { name: /leads/i })).toBeInTheDocument());
  });

  it('reports progress as a running count, with no percentage anywhere', async () => {
    searches = [
      { _id: 's1', name: 'Sales heads', searchUrl: 'https://www.linkedin.com/search/results/people/', status: 'running', importedCount: 412 },
    ];

    renderAt('/hub/leads');

    await waitFor(() => expect(screen.getByText(/412 imported/i)).toBeInTheDocument());
    expect(screen.getByText('Importing')).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    expect(document.querySelector('progress')).toBeNull();
  });

  it('says an import stopped short instead of reporting it complete', async () => {
    // The backend distinguishes an exhausted audience from LinkedIn declining
    // to return more. "Imported 240" alone would be a number the user plans
    // around, so the reason has to reach the page.
    searches = [
      {
        _id: 's1',
        name: 'Sales heads',
        searchUrl: 'https://www.linkedin.com/search/results/people/',
        status: 'done',
        importedCount: 240,
        error: 'LinkedIn stopped returning results before the search was exhausted.',
      },
    ];

    renderAt('/hub/leads');

    const row = await screen.findByText('Sales heads');
    await userEvent.click(row);
    await waitFor(() => expect(screen.getByText(/stopped returning results/i)).toBeInTheDocument());
  });

  it('renders an imported lead with its normalised degree', async () => {
    renderAt('/hub/leads');
    await waitFor(() => expect(screen.getByText('Asha Menon')).toBeInTheDocument());
    // 2, stored normalised, must render as "2nd" — not as the vendor's
    // DISTANCE_2 and not as a bare number.
    expect(screen.getByText('2nd')).toBeInTheDocument();
  });

  it('shows no Company or Industry column, because search returns neither', async () => {
    // A column empty on every row reads as a broken import. Company exists
    // only behind the per-lead profile lookup this module avoids.
    //
    // Rendered FIRST and awaited: a queryBy assertion against a page that was
    // never rendered passes for the wrong reason, which is how a test like
    // this quietly stops checking anything.
    renderAt('/hub/leads');
    await screen.findByText('Asha Menon');

    expect(screen.queryByText('Company')).not.toBeInTheDocument();
    expect(screen.queryByText('Industry')).not.toBeInTheDocument();
  });

  it('shows the follower count', async () => {
    renderAt('/hub/leads');
    await waitFor(() => expect(screen.getByText('4,211')).toBeInTheDocument());
  });

  it('offers the workspace switcher, with both workspaces named', async () => {
    renderAt('/hub/leads');
    const trigger = await screen.findByRole('button', { name: /switch workspace/i });
    await userEvent.click(trigger);
    expect(screen.getByRole('menuitem', { name: /Hub/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Capture/ })).toBeInTheDocument();
  });
});
