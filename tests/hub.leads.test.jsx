import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
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
let leadRows = [];
let slowLeads = false;
const getLeadsCalls = [];

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/searches': () => ({ success: true, data: { searches } }),
  'GET /hub/leads': async (url, config) => {
    getLeadsCalls.push(config?.params);
    // A real network round trip does not finish in the microtask that started
    // it. This delay is what lets the effect teardown land mid-flight, which
    // is the entire mechanism of the bug below.
    if (slowLeads) await new Promise((resolve) => { setTimeout(resolve, 20); });
    return {
      success: true,
      data: { leads: leadRows, pagination: { page: 1, limit: 50, total: leadRows.length } },
    };
  },
  'GET /*': { success: true, data: {} },
  'POST /*': { success: true, data: {} },
}));

const { AuthContext } = await import('src/core/auth/hooks/AuthContext');
const { SubscriptionContext } = await import('src/core/billing/hooks/SubscriptionContext');
import { SubscriptionSummary } from 'src/core/billing/entities/Subscription';

/**
 * The REAL summary entity, not a hand-rolled `{ isActive: () => true }`.
 * These stubs stood in for a domain object and drifted from it: the day
 * hasHub() was added, every one of them started throwing inside HubGate.
 */
const hubSubscriber = SubscriptionSummary.fromResponse({ status: 'active', features: { hub: true } });

const { ToastProvider, ConfirmProvider } = await import('src/core/primitives');
const { AppRoutes } = await import('src/app/routes');
const { signedInAs } = await import('./helpers.jsx');

function renderAt(route) {
  return render(
    <HelmetProvider>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[route]}>
        <AuthContext.Provider value={signedInAs()}>
          <SubscriptionContext.Provider value={{ status: hubSubscriber, loading: false, ready: true }}>
            <ToastProvider><ConfirmProvider><AppRoutes /></ConfirmProvider></ToastProvider>
          </SubscriptionContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

const ASHA = {
  _id: 'lead-1',
  name: 'Asha Menon',
  headline: 'Head of Sales',
  location: 'Bengaluru',
  followersCount: 4211,
  connectionDegree: 2,
  profileUrl: 'https://www.linkedin.com/in/asha',
};

beforeEach(() => {
  searches = [];
  leadRows = [ASHA];
  slowLeads = false;
  getLeadsCalls.length = 0;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('hub leads', () => {
  it('resolves the lazy hub chunk and parks the audiences dock', async () => {
    renderAt('/hub/leads');
    // The chunk resolving is the point; the dock pill is the cheapest proof
    // that this page's own code ran, rather than a shell that rendered with a
    // failed lazy import behind it.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^audiences/i })).toBeInTheDocument(),
    );
  });

  it('keeps the import form in the dock until it is asked for, and closes on Escape', async () => {
    renderAt('/hub/leads');
    const pill = await screen.findByRole('button', { name: /^audiences/i });

    // Closed is the resting state. A form permanently occupying the top of the
    // page was the thing the dock replaced, so a regression that renders it
    // inline again has to fail here.
    expect(screen.queryByPlaceholderText(/linkedin\.com\/search\/results/i)).not.toBeInTheDocument();

    await userEvent.click(pill);
    expect(await screen.findByPlaceholderText(/linkedin\.com\/search\/results/i)).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByPlaceholderText(/linkedin\.com\/search\/results/i)).not.toBeInTheDocument(),
    );
  });

  it('lets a pasted URL take over, switching the filters off', async () => {
    /**
     * A LinkedIn results URL already encodes its own filters, so the two can
     * never be combined — the backend would reject it. The UI has to say so
     * BEFORE the request rather than after, which means the filters visibly
     * switch off the moment a URL is present.
     *
     * Pinned because it is a rule about the vendor, not a style choice: the
     * obvious "improvement" of letting both be filled at once would produce a
     * form that looks more capable and fails on submit.
     */
    renderAt('/hub/leads');
    await userEvent.click(await screen.findByRole('button', { name: /^audiences/i }));

    const location = screen.getByPlaceholderText(/search a city or region/i);
    expect(location).not.toBeDisabled();

    await userEvent.type(
      screen.getByPlaceholderText(/linkedin\.com\/search\/results/i),
      'https://www.linkedin.com/search/results/people/?keywords=sales',
    );

    await waitFor(() => expect(location).toBeDisabled());
    expect(screen.getByText(/the filters below are off/i)).toBeInTheDocument();
  });

  it('rejects a profile URL at the field, with the fix rather than a verdict', async () => {
    // The mistake people actually make. It used to fail deep in the importer,
    // minutes later, as a generic failure.
    renderAt('/hub/leads');
    await userEvent.click(await screen.findByRole('button', { name: /^audiences/i }));

    await userEvent.type(
      screen.getByPlaceholderText(/linkedin\.com\/search\/results/i),
      'https://www.linkedin.com/in/asha',
    );

    expect(await screen.findByText(/that's a profile, not a search/i)).toBeInTheDocument();
    // The sidebar now shows Capture's own "Import" nav row at the same time
    // (both product groups render together since the switcher was removed),
    // so an unscoped query is ambiguous. The dock's Import button is not
    // inside the <nav> landmark, so exclude whichever match is.
    const nav = screen.getByRole('navigation');
    const importButtons = screen.getAllByRole('button', { name: /^import$/i });
    const dockImportButton = importButtons.find((btn) => !nav.contains(btn));
    expect(dockImportButton).toBeDisabled();
  });

  it('/hub lands on the dashboard, not leads, and not a 404', async () => {
    // Repointed 2026-09-19 (Blue Identity v3, Phase 4b): /hub used to
    // redirect straight to /hub/leads since Hub had no landing page of its
    // own. It now redirects to /hub/dashboard instead — see
    // docs/UI_REDESIGN_PLAN.md. The subtitle is a more stable assertion
    // than the h1, which includes a time-of-day greeting.
    renderAt('/hub');
    await waitFor(() => expect(screen.getByText(/what changed since you were last here/i)).toBeInTheDocument());
  });

  it('reports progress as a running count, with no percentage anywhere', async () => {
    /**
     * The count is on the page, not in the dock. Management moved behind a
     * panel; progress did not, because an import runs for minutes and somebody
     * is waiting on it — hiding that behind a control they have to open would
     * be worse than the permanent card it replaced.
     */
    searches = [
      { _id: 's1', name: 'Sales heads', searchUrl: 'https://www.linkedin.com/search/results/people/', status: 'running', importedCount: 412 },
    ];

    renderAt('/hub/leads');

    // Visible without opening anything.
    await waitFor(() => expect(screen.getByText(/412/)).toBeInTheDocument());
    expect(screen.getByText(/so far/i)).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    expect(document.querySelector('progress')).toBeNull();
  });

  it('hides the import strip entirely when nothing is running', async () => {
    // It reports a fact or it is not there. A strip that permanently says
    // "nothing is importing" is the card this replaced.
    searches = [
      { _id: 's1', name: 'Sales heads', searchUrl: 'https://www.linkedin.com/search/results/people/', status: 'done', importedCount: 412 },
    ];

    renderAt('/hub/leads');
    await screen.findByText('Asha Menon');
    expect(screen.queryByText(/so far/i)).not.toBeInTheDocument();
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

    await userEvent.click(await screen.findByRole('button', { name: /^audiences/i }));
    // A row inside the dock, not the (now separate) table dropdown option of
    // the same name.
    const row = await screen.findByRole('button', { name: /sales heads/i });
    await userEvent.click(row);
    await waitFor(() => expect(screen.getByText(/stopped returning results/i)).toBeInTheDocument());
  });

  it('filters by list from a plain dropdown on the table, defaulting to everyone', async () => {
    // The picker used to live only behind the "Audiences" dock, as a chip
    // fed by clicking a row there. It's now a dropdown right on the table
    // toolbar, defaulting to "All people" (no searchId sent at all).
    searches = [
      { _id: 's1', name: 'Sales heads', searchUrl: 'https://www.linkedin.com/search/results/people/', status: 'done', importedCount: 10 },
    ];

    renderAt('/hub/leads');
    await screen.findByText('Asha Menon');

    const dropdown = screen.getByRole('combobox', { name: /filter by list/i });
    expect(dropdown).toHaveValue('');
    expect(getLeadsCalls.at(-1)?.searchId).toBeUndefined();

    await userEvent.selectOptions(dropdown, 'Sales heads');
    await waitFor(() => expect(getLeadsCalls.at(-1)?.searchId).toBe('s1'));

    await userEvent.selectOptions(dropdown, 'All people');
    await waitFor(() => expect(getLeadsCalls.at(-1)?.searchId).toBeUndefined());
  });

  it('renders an imported lead with its normalised degree', async () => {
    renderAt('/hub/leads');
    await waitFor(() => expect(screen.getByText('Asha Menon')).toBeInTheDocument());
    // 2, stored normalised, must render as "2nd" — not as the vendor's
    // DISTANCE_2 and not as a bare number.
    expect(screen.getByText('2nd')).toBeInTheDocument();
  });

  it('shows Company and Title columns, blank until a lead is resolved — never an Industry column', async () => {
    // Phase 6 (1b): Company/Title exist now because the lazy resolve pass
    // (opening the lead drawer) actually fills them in — see columns.jsx's
    // header comment for why this reverses the earlier "no column" decision.
    // A search-only row (like this fixture) has neither field populated yet,
    // so the columns render but the cells read as the same "—" empty state
    // followersCount already uses for "the vendor didn't tell us".
    //
    // Industry stays absent for a different reason: verified live that
    // NEITHER endpoint returns it, so there is nothing a resolve could ever
    // fill in — a column for it would be permanently blank, not just blank
    // until opened.
    //
    // Rendered FIRST and awaited: a queryBy assertion against a page that was
    // never rendered passes for the wrong reason, which is how a test like
    // this quietly stops checking anything.
    renderAt('/hub/leads');
    await screen.findByText('Asha Menon');

    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.queryByText('Industry')).not.toBeInTheDocument();
  });

  it('shows followers as the bucket LinkedIn gave, not a precise-looking figure', async () => {
    // 4211 came back as a rounded bucket. "4,211" would be a number someone
    // quotes; "4.2K" is what we actually know.
    renderAt('/hub/leads');
    await waitFor(() => expect(screen.getByText('4.2K')).toBeInTheDocument());
    expect(screen.queryByText('4,211')).not.toBeInTheDocument();
  });

  it('shows the full sidebar, no switcher and nothing locked', async () => {
    // The workspace switcher (a dropdown that swapped the whole nav tree) and
    // the later two-group locked sidebar are both gone — replaced 2026-09-14
    // by one flat nav tree. Every section and a row from each are on screen
    // together without any click.
    renderAt('/hub/leads');
    const nav = await screen.findByRole('navigation');
    expect(within(nav).getByText('Prospect')).toBeInTheDocument();
    expect(within(nav).getByText('Engage')).toBeInTheDocument();
    expect(within(nav).getByText('Import')).toBeInTheDocument();
    expect(within(nav).getByText('Sequences')).toBeInTheDocument();
  });
});


describe('the poll that finishes an import', () => {
  it('applies the leads from the tick that discovers the import is done', async () => {
    /**
     * Covers the happy path: an import completes between ticks and the next
     * poll shows its leads without a reload.
     *
     * HONEST LIMIT: this does NOT reproduce the production symptom it was
     * written for — a page that sat on "No leads yet" over a finished import
     * until reloaded by hand. It passes with the suspected cause reintroduced
     * (the poll sharing an AbortController with an effect that tears down the
     * moment the import stops being busy), verified by putting that code back
     * and re-running. jsdom resolves the stub faster than React commits the
     * state change, so the teardown never lands mid-flight the way a real
     * network makes it. Treat that diagnosis as unconfirmed.
     */
    vi.useFakeTimers({ shouldAdvanceTime: true });
    slowLeads = true;

    const running = { _id: 's1', name: 'Sales heads', searchUrl: 'https://www.linkedin.com/search/results/people/', status: 'running', importedCount: 0 };
    searches = [running];
    leadRows = [];

    renderAt('/hub/leads');
    await screen.findByText('No leads yet');

    // The worker finishes between ticks: the audience is done AND the leads
    // now exist. The next poll must show them, with no reload.
    searches = [{ ...running, status: 'done', importedCount: 1 }];
    leadRows = [ASHA];

    await vi.advanceTimersByTimeAsync(5100);

    await waitFor(() => expect(screen.getByText('Asha Menon')).toBeInTheDocument());
  });
});
