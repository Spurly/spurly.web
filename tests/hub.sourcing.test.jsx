import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within, configure } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { stubGateway } from './gateway.js';

/**
 * Audience sourcing: "fetch N profiles", the same-search question, Fetch more
 * and custom lists.
 *
 *  1. THE COUNT REACHES THE SERVER. A number field that is shown but never
 *     sent would look finished and import the old fixed amount.
 *  2. A REPEATED SEARCH IS A QUESTION, NOT AN ERROR. The 409 must open a
 *     choice, and each choice must re-send the SAME search with its answer.
 *  3. FETCH MORE SENDS THE COUNT to the existing audience's run endpoint.
 *  4. A LIST IS BUILT FROM THE SELECTION, and its ids are the selected rows.
 */

// These walk a multi-step modal through the full app shell; under a loaded
// full-suite run the default 1s find timeout is too tight to be reliable.
configure({ asyncUtilTimeout: 4000 });
vi.setConfig({ testTimeout: 20000 });

let searches = [];
let leadRows = [];
let createResponses = [];
const posts = [];

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/searches': () => ({ success: true, data: { searches } }),
  'GET /hub/leads': () => ({
    success: true,
    data: { leads: leadRows, pagination: { page: 1, limit: 50, total: leadRows.length } },
  }),
  'GET /hub/sourcing/usage': () => ({
    success: true,
    data: {
      usage: {
        limits: { perFetch: 100, perDay: 1000, perMonth: 10000 },
        usedToday: 200, usedThisMonth: 400,
        remainingToday: 800, remainingThisMonth: 9600, remaining: 800,
        resetsAt: '2030-01-01T00:00:00.000Z',
      },
    },
  }),
  'POST /hub/searches': (url, body) => {
    posts.push({ url, body });
    const next = createResponses.shift();
    if (next?.reject) throw next.reject; // the interceptor rejects with the body
    return next ?? { success: true, data: { search: { _id: 'new-1', name: 'x', status: 'queued' } } };
  },
  'POST /*': (url, body) => {
    posts.push({ url, body });
    if (url === '/hub/lists') {
      return { success: true, data: { audience: { _id: 'list-1', name: body.name || 'List', mode: 'list' }, added: body.leadIds.length } };
    }
    if (url.endsWith('/leads')) return { success: true, data: { added: body.leadIds.length, matched: body.leadIds.length } };
    return { success: true, data: { search: { _id: url.split('/')[3], status: 'queued' } } };
  },
  'GET /*': { success: true, data: {} },
}));

const { AuthContext } = await import('src/core/auth/hooks/AuthContext');
const { SubscriptionContext } = await import('src/core/billing/hooks/SubscriptionContext');
const { SubscriptionSummary } = await import('src/core/billing/entities/Subscription');
const { ToastProvider, ConfirmProvider } = await import('src/core/primitives');
const { AppRoutes } = await import('src/app/routes');
const { signedInAs } = await import('./helpers.jsx');
const { fetchCountProblem, perFetchMax, budgetLine } = await import('src/products/leads/hooks/fetchCount.js');
const { isBusy, describeSearch } = await import('src/products/leads/hooks/audience.js');

const hubSubscriber = SubscriptionSummary.fromResponse({ status: 'active', features: { hub: true } });

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

const SEARCH_URL = 'https://www.linkedin.com/search/results/people/?keywords=founder';

const EXISTING = {
  _id: 'aud-1',
  name: 'Founders',
  mode: 'url',
  searchUrl: SEARCH_URL,
  status: 'done',
  importedCount: 30,
  leadCount: 30,
  exhausted: false,
  canFetchMore: true,
};

const ASHA = { _id: 'lead-1', name: 'Asha Menon', headline: 'Head of Sales', connectionDegree: 2, profileUrl: 'https://www.linkedin.com/in/asha' };
const RAVI = { _id: 'lead-2', name: 'Ravi Kumar', headline: 'Founder', connectionDegree: 3, profileUrl: 'https://www.linkedin.com/in/ravi' };

beforeEach(() => {
  searches = [];
  leadRows = [ASHA, RAVI];
  createResponses = [];
  posts.length = 0;
});

async function openModalWithUrl() {
  renderAt('/hub/leads');
  await userEvent.click(await screen.findByRole('button', { name: /new audience/i }));
  await userEvent.type(await screen.findByPlaceholderText(/linkedin\.com\/search\/results/i), SEARCH_URL);
  await userEvent.click(screen.getByRole('button', { name: /continue/i }));
}

describe('profiles to fetch', () => {
  it('sends the chosen count with the new audience', async () => {
    await openModalWithUrl();
    const field = await screen.findByLabelText(/profiles to fetch/i);
    expect(field).toHaveValue(30);
    // Today's budget is spelled out next to the field.
    expect(screen.getByText(/800 of 1,000 left today/i)).toBeInTheDocument();

    await userEvent.clear(field);
    await userEvent.type(field, '65');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await userEvent.click(screen.getByRole('button', { name: /run import/i }));

    await waitFor(() => expect(posts.some((p) => p.url === '/hub/searches')).toBe(true));
    const body = posts.find((p) => p.url === '/hub/searches').body;
    expect(body).toMatchObject({ searchUrl: SEARCH_URL, count: 65 });
    expect(body.onDuplicate).toBeUndefined();
  });

  it('refuses more than the per-fetch limit before anything is sent', async () => {
    await openModalWithUrl();
    const field = await screen.findByLabelText(/profiles to fetch/i);
    await userEvent.clear(field);
    await userEvent.type(field, '500');
    expect(screen.getByText(/at most 100 profiles at a time/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });
});

describe('the same search twice', () => {
  const duplicateReject = {
    reject: {
      success: false,
      code: 'DUPLICATE_SEARCH',
      message: 'You already have an audience for this search.',
      data: { audience: { _id: 'aud-1', name: 'Founders', status: 'done', exhausted: false } },
    },
  };

  async function submitDuplicate() {
    createResponses = [duplicateReject];
    await openModalWithUrl();
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await userEvent.click(screen.getByRole('button', { name: /run import/i }));
    return screen.findByRole('dialog', { name: /you already have this search/i });
  }

  it('asks, and "Add to" re-sends the same search with onDuplicate=append', async () => {
    const dialog = await submitDuplicate();
    createResponses = [{ success: true, data: { search: { ...EXISTING, status: 'queued' }, appended: true } }];
    await userEvent.click(within(dialog).getByRole('button', { name: /add to/i }));

    await waitFor(() => expect(posts.filter((p) => p.url === '/hub/searches')).toHaveLength(2));
    const second = posts.filter((p) => p.url === '/hub/searches')[1].body;
    expect(second).toMatchObject({ searchUrl: SEARCH_URL, count: 30, onDuplicate: 'append' });
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /you already have this search/i })).not.toBeInTheDocument(),
    );
  });

  it('"Create new audience" re-sends with onDuplicate=new', async () => {
    const dialog = await submitDuplicate();
    await userEvent.click(within(dialog).getByRole('button', { name: /create new audience/i }));
    await waitFor(() => expect(posts.filter((p) => p.url === '/hub/searches')).toHaveLength(2));
    expect(posts.filter((p) => p.url === '/hub/searches')[1].body.onDuplicate).toBe('new');
  });

  it('does not offer a new audience when LinkedIn has nothing more for that search', async () => {
    createResponses = [{
      reject: { ...duplicateReject.reject, data: { audience: { ...duplicateReject.reject.data.audience, exhausted: true } } },
    }];
    await openModalWithUrl();
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await userEvent.click(screen.getByRole('button', { name: /run import/i }));
    const dialog = await screen.findByRole('dialog', { name: /you already have this search/i });
    expect(within(dialog).queryByRole('button', { name: /create new audience/i })).not.toBeInTheDocument();
    expect(within(dialog).getByText(/narrow the search/i)).toBeInTheDocument();
  });

  it('Cancel sends nothing more', async () => {
    const dialog = await submitDuplicate();
    await userEvent.click(within(dialog).getByRole('button', { name: /^cancel$/i }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /you already have this search/i })).not.toBeInTheDocument(),
    );
    expect(posts.filter((p) => p.url === '/hub/searches')).toHaveLength(1);
  });
});

describe('fetch more', () => {
  it('sends the count to the existing audience', async () => {
    searches = [EXISTING];
    renderAt('/hub/leads');
    await userEvent.click(await screen.findByRole('combobox', { name: /filter by list/i }));
    await userEvent.click(await screen.findByRole('button', { name: /fetch more profiles/i }));

    const dialog = await screen.findByRole('dialog', { name: /fetch more profiles/i });
    const field = within(dialog).getByLabelText(/profiles to fetch/i);
    await userEvent.clear(field);
    await userEvent.type(field, '50');
    await userEvent.click(within(dialog).getByRole('button', { name: /^fetch$/i }));

    await waitFor(() => expect(posts.some((p) => p.url === '/hub/searches/aud-1/run')).toBe(true));
    expect(posts.find((p) => p.url === '/hub/searches/aud-1/run').body).toEqual({ count: 50 });
  });

  it('is not offered on a custom list', async () => {
    searches = [{ _id: 'list-1', name: 'Warm', mode: 'list', status: 'done', leadCount: 2, canFetchMore: false }];
    renderAt('/hub/leads');
    await userEvent.click(await screen.findByRole('combobox', { name: /filter by list/i }));
    expect(await screen.findByText('Warm')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /fetch more profiles/i })).not.toBeInTheDocument();
    // The count shown is members, not results read.
    expect(screen.getByText(/2 leads · custom list/i)).toBeInTheDocument();
  });
});

describe('custom lists', () => {
  it('builds a new list from the selected rows', async () => {
    renderAt('/hub/leads');
    await screen.findByText('Asha Menon');
    const boxes = screen.getAllByRole('checkbox', { name: /select row/i });
    await userEvent.click(boxes[0]);
    await userEvent.click(boxes[1]);

    await userEvent.click(screen.getByRole('button', { name: /add selection to a list/i }));
    await userEvent.click(await screen.findByRole('option', { name: /\+ new list/i }));

    const dialog = await screen.findByRole('dialog', { name: /new list/i });
    await userEvent.type(within(dialog).getByLabelText(/list name/i), 'Warm founders');
    await userEvent.click(within(dialog).getByRole('button', { name: /create list/i }));

    await waitFor(() => expect(posts.some((p) => p.url === '/hub/lists')).toBe(true));
    const body = posts.find((p) => p.url === '/hub/lists').body;
    expect(body.name).toBe('Warm founders');
    expect([...body.leadIds].sort()).toEqual(['lead-1', 'lead-2']);
  });

  it('adds the selection to an existing audience', async () => {
    searches = [EXISTING];
    renderAt('/hub/leads');
    await screen.findByText('Asha Menon');
    await userEvent.click(screen.getAllByRole('checkbox', { name: /select row/i })[0]);
    await userEvent.click(screen.getByRole('button', { name: /add selection to a list/i }));
    await userEvent.click(await screen.findByRole('option', { name: 'Founders' }));

    await waitFor(() => expect(posts.some((p) => p.url === '/hub/searches/aud-1/leads')).toBe(true));
    expect(posts.find((p) => p.url === '/hub/searches/aud-1/leads').body).toEqual({ leadIds: ['lead-1'] });
  });
});

describe('pure helpers', () => {
  it('fetchCountProblem', () => {
    expect(fetchCountProblem('30', 100)).toBeNull();
    expect(fetchCountProblem('100', 100)).toBeNull();
    expect(fetchCountProblem('101', 100)).toMatch(/at most 100/);
    expect(fetchCountProblem('0', 100)).toMatch(/at least 1/);
    expect(fetchCountProblem('', 100)).toMatch(/enter/i);
    expect(fetchCountProblem('2.5', 100)).toMatch(/whole number/i);
    expect(fetchCountProblem('-3', 100)).toMatch(/whole number/i);
  });

  it('perFetchMax falls back before usage loads', () => {
    expect(perFetchMax(null)).toBe(100);
    expect(perFetchMax({ limits: { perFetch: 50 } })).toBe(50);
  });

  it('budgetLine', () => {
    expect(budgetLine(null)).toBeNull();
    expect(budgetLine({ limits: { perDay: 1000 }, remainingToday: 0, remainingThisMonth: 12 })).toBe('0 of 1,000 left today · 12 this month');
  });

  it('a row paused until the daily reset does not keep the page polling', () => {
    const future = new Date(Date.now() + 3600_000).toISOString();
    const past = new Date(Date.now() - 1000).toISOString();
    expect(isBusy({ status: 'queued', waitUntil: future })).toBe(false);
    expect(isBusy({ status: 'queued', waitUntil: past })).toBe(true);
    expect(isBusy({ status: 'queued', waitUntil: null })).toBe(true);
    expect(isBusy({ status: 'running' })).toBe(true);
    expect(isBusy({ status: 'done' })).toBe(false);
  });

  it('describes a custom list', () => {
    expect(describeSearch({ mode: 'list' })).toBe('Custom list');
  });
});
