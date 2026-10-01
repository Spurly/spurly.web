import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { stubGateway } from './gateway.js';

/**
 * The Discover page (plan M5): three tabs, nothing searches until Search is
 * pressed, results per tab, "Find people here" hands off to Leads, post authors
 * are selected and imported, and the refusals the server can give. Shapes are
 * the server's own responses (spurly.backend hub/discover, synthetic values).
 */

const usage = (used = 3) => ({ used, cap: 100, resetsAt: '2026-10-02T00:00:00.000Z' });

const company = (n, over = {}) => ({
  companyId: String(9000000 + n), kind: 'company', slug: `fixture-company-${n}`, name: `Fixture Company ${n}`,
  profileUrl: `https://www.linkedin.com/company/fixture-company-${n}`, summary: `Summary ${n}`,
  industry: 'Software Development', location: 'Fixture City', logoUrl: '', followersCount: 1200, ...over,
});
const school = (n) => company(n, { kind: 'school', name: `Fixture School ${n}`, slug: `fixture-school-${n}`, industry: 'Higher Education' });

const job = (n, over = {}) => ({
  jobId: String(5000000 + n), title: `Synthetic Role ${n}`, location: 'Fixture City (Remote)', postedAt: new Date().toISOString(),
  url: `https://www.linkedin.com/jobs/view/${5000000 + n}`, promoted: false, easyApply: n === 1, reposted: false,
  company: { companyId: '9100001', name: 'Fixture Employer 1', slug: 'fixture-employer-1', profileUrl: '', logoUrl: '' }, ...over,
});

const post = (n, over = {}) => ({
  postId: String(n), socialId: `urn:li:activity:${n}`, text: `Synthetic hiring post ${n}`, postedAt: new Date().toISOString(), postedAgo: '1h',
  reactions: 5, comments: 2, reposts: 0, shareUrl: `https://www.linkedin.com/posts/fixture-${n}`, isRepost: false,
  author: { providerId: `ACoAFIXTURE${n}`, publicIdentifier: `fixture-author-${n}`, name: `Fixture Author ${n}`, headline: `Headline ${n}`, profilePictureUrl: '', isCompany: false },
  ...over,
});

const state = { responses: {}, calls: [], error: null, usage: usage(), importCalls: [], importError: null };

const page = (category, items, extra = {}) => ({
  success: true,
  data: { [category]: items, rowCount: items.length, cursor: null, total: null, usage: usage(4), ...extra },
});

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/discover/usage': async () => ({ success: true, data: state.usage }),
  'POST /hub/discover/posts/import-authors': async (_url, body) => {
    state.importCalls.push(body);
    if (state.importError) throw state.importError;
    return { success: true, data: { audience: { _id: 'a1' }, imported: 2, alreadyHad: 1, skipped: { company: 1, duplicate: 0, noId: 0 } } };
  },
  'POST /hub/discover/*': async (url, body) => {
    const category = url.split('/').pop();
    state.calls.push({ category, body });
    if (state.error) throw state.error;
    const resolve = state.responses[category];
    return typeof resolve === 'function' ? resolve(body) : resolve;
  },
  'GET /*': { success: true, data: [] },
}));

const { renderWithProviders } = await import('./helpers.jsx');
const { HubDiscoverPage } = await import('src/products/pages/discover/index.jsx');
const { groupJobsByCompany, snippet, companyPath, findPeopleState, discoverFailureKind, compactFilters } = await import('src/products/discover/format.js');

let lastLocation = null;
function LocationSpy() {
  lastLocation = useLocation();
  return null;
}
const renderPage = () => renderWithProviders(<><LocationSpy /><HubDiscoverPage /></>, { route: '/hub/discover' });

const apiError = (status, code, message) => Object.assign(new Error(message), { code, response: { status, data: { code, message } } });

async function search(text, button = 'Search') {
  const input = await screen.findByRole('textbox', { name: /keywords|search url/i });
  fireEvent.change(input, { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: button }));
}

beforeEach(() => {
  state.responses = {};
  state.calls = [];
  state.error = null;
  state.usage = usage();
  state.importCalls = [];
  state.importError = null;
  lastLocation = null;
});

describe('Discover page', () => {
  it('on arrival nothing is searched: an invitation and today\'s usage only', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Search for companies')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/3 of 100 searches used today/)).toBeInTheDocument());
    expect(state.calls).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
  });

  it('companies: searches with the keywords, lists them, hides schools until asked', async () => {
    state.responses.companies = page('companies', [company(1), school(2), company(3)]);
    renderPage();
    await search('saas');

    await waitFor(() => expect(screen.getByText('Fixture Company 1')).toBeInTheDocument());
    expect(state.calls[0]).toEqual({ category: 'companies', body: { keywords: 'saas', url: undefined, filters: undefined, cursor: undefined } });
    expect(screen.getByText('Fixture Company 3')).toBeInTheDocument();
    expect(screen.queryByText('Fixture School 2')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Show schools \(1\)/ }));
    expect(screen.getByText('Fixture School 2')).toBeInTheDocument();
    expect(screen.getByText('School')).toBeInTheDocument();
    expect(screen.getByText('Schools have no company page to search people in.')).toBeInTheDocument();
    // a school has no company actions: two companies, two of each button
    expect(screen.getAllByRole('button', { name: 'Find people here' })).toHaveLength(2);
  });

  it('"Find people here" goes to Leads with the dialog and that company in router state', async () => {
    state.responses.companies = page('companies', [company(1)]);
    renderPage();
    await search('saas');
    fireEvent.click(await screen.findByRole('button', { name: 'Find people here' }));
    await waitFor(() => expect(lastLocation.pathname).toBe('/hub/leads'));
    expect(lastLocation.state).toEqual({ newAudience: true, newAudienceCompany: { id: '9000001', name: 'Fixture Company 1' } });
  });

  it('"Open company" goes to the company page by slug', async () => {
    state.responses.companies = page('companies', [company(1)]);
    renderPage();
    await search('saas');
    fireEvent.click(await screen.findByRole('button', { name: 'Open company' }));
    await waitFor(() => expect(lastLocation.pathname).toBe('/hub/company/fixture-company-1'));
  });

  it('Load more sends the cursor with the same query and appends', async () => {
    state.responses.companies = (body) => (body.cursor
      ? page('companies', [company(2)])
      : page('companies', [company(1)], { cursor: 'CUR1' }));
    renderPage();
    await search('saas');
    await screen.findByText('Fixture Company 1');
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    await screen.findByText('Fixture Company 2');
    expect(screen.getByText('Fixture Company 1')).toBeInTheDocument();
    expect(state.calls[1].body).toMatchObject({ keywords: 'saas', cursor: 'CUR1' });
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    expect(screen.getByText('That is everything LinkedIn returned for this search.')).toBeInTheDocument();
  });

  it('no results says so, and does not look like the first-visit invitation', async () => {
    state.responses.companies = page('companies', []);
    renderPage();
    await search('zzzz');
    await waitFor(() => expect(screen.getByText('No companies found')).toBeInTheDocument());
    expect(screen.queryByText('Search for companies')).not.toBeInTheDocument();
  });

  it('jobs: grouped by company with the role count and the total from LinkedIn', async () => {
    state.responses.jobs = page('jobs', [job(1), job(2), job(3, { company: { companyId: '9100002', name: 'Fixture Employer 2', slug: 'fixture-employer-2' } }), job(4, { company: null })], { total: 3995 });
    renderPage();
    fireEvent.click(await screen.findByRole('radio', { name: 'Jobs' }));
    await search('react');
    await waitFor(() => expect(screen.getByText('Fixture Employer 1')).toBeInTheDocument());
    expect(state.calls[0].category).toBe('jobs');
    expect(screen.getByText('2 roles')).toBeInTheDocument();
    expect(screen.getAllByText('1 role')).toHaveLength(2);
    expect(screen.getByText('Company not shown by LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('3,995 results on LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Easy Apply')).toBeInTheDocument();
    // the job with no company has no company actions: 2 companies -> 2 buttons
    expect(screen.getAllByRole('button', { name: 'Find people here' })).toHaveLength(2);
  });

  it('posts: the posted-date filter is sent, company authors cannot be selected', async () => {
    state.responses.posts = page('posts', [post(1), post(2, { author: { ...post(2).author, isCompany: true, name: 'Fixture Page' } })]);
    renderPage();
    fireEvent.click(await screen.findByRole('radio', { name: 'Posts' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Past week' }));
    await search('hiring react');
    await waitFor(() => expect(screen.getByText('Synthetic hiring post 1')).toBeInTheDocument());
    expect(state.calls[0].body).toMatchObject({ keywords: 'hiring react', filters: { datePosted: 'past_week' } });
    expect(screen.getByText('Company page')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select Fixture Author 1' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Select Fixture Page' })).not.toBeInTheDocument();
  });

  it('posts: sort and format filters are sent next to the date; "any" sends nothing', async () => {
    state.responses.posts = page('posts', [post(1)]);
    renderPage();
    fireEvent.click(await screen.findByRole('radio', { name: 'Posts' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Newest first' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Videos' }));
    await search('hiring');
    await screen.findByText('Synthetic hiring post 1');
    expect(state.calls[0].body.filters).toEqual({ sortBy: 'date', contentType: 'videos' });

    // back to "All posts": that filter leaves the request again
    fireEvent.click(screen.getByRole('radio', { name: 'All posts' }));
    await search('hiring');
    await waitFor(() => expect(state.calls).toHaveLength(2));
    expect(state.calls[1].body.filters).toEqual({ sortBy: 'date' });
  });

  it('posts: posted-by is sent as an option id; "Anyone" sends nothing', async () => {
    state.responses.posts = page('posts', [post(1)]);
    renderPage();
    fireEvent.click(await screen.findByRole('radio', { name: 'Posts' }));
    fireEvent.click(screen.getByRole('radio', { name: 'My 1st connections' }));
    await search('hiring');
    await screen.findByText('Synthetic hiring post 1');
    expect(state.calls[0].body.filters).toEqual({ postedBy: 'first_connections' });
    fireEvent.click(screen.getByRole('radio', { name: 'Anyone' }));
    await search('hiring');
    await waitFor(() => expect(state.calls).toHaveLength(2));
    expect(state.calls[1].body.filters).toBeUndefined();
  });

  it('companies: size buckets and "hiring only" are sent; a pasted URL sends no filters', async () => {
    renderPage();
    await screen.findByRole('radio', { name: 'Companies' });
    fireEvent.click(screen.getByRole('button', { name: '11-50' }));
    fireEvent.click(screen.getByRole('button', { name: '10,001+' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Only companies hiring on LinkedIn' }));
    await search('saas');
    await waitFor(() => expect(state.calls).toHaveLength(1));
    expect(state.calls[0].body.filters).toEqual({ headcount: ['11-50', '10001+'], hasJobOffers: true });

    fireEvent.click(screen.getByRole('button', { name: 'Paste a LinkedIn search URL instead' }));
    fireEvent.change(screen.getByLabelText('LinkedIn search URL'), { target: { value: 'https://www.linkedin.com/search/results/companies/?keywords=saas' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(state.calls).toHaveLength(2));
    expect(state.calls[1].body.filters).toBeUndefined();
    expect(state.calls[1].body.url).toContain('/search/results/companies/');
  });

  it('jobs: work type, job type, sort and easy apply are sent', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('radio', { name: 'Jobs' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remote' }));
    fireEvent.click(screen.getByRole('button', { name: 'Contract' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Newest first' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Easy Apply only' }));
    await search('react');
    await waitFor(() => expect(state.calls).toHaveLength(1));
    expect(state.calls[0].body.filters).toEqual({ presence: ['remote'], jobType: ['contract'], sortBy: 'date', easyApply: true });
  });

  it('posts: select authors, import them once, and report the result', async () => {
    state.responses.posts = page('posts', [post(1), post(2), post(3, { author: { ...post(1).author } })]);
    renderPage();
    fireEvent.click(await screen.findByRole('radio', { name: 'Posts' }));
    await search('hiring');
    await screen.findByText('Synthetic hiring post 1');
    expect(screen.getByRole('button', { name: 'Import authors' })).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all on this page' }));
    expect(screen.getByText('2 selected')).toBeInTheDocument(); // author 1 wrote two posts: counted once

    fireEvent.click(screen.getByRole('button', { name: 'Import authors' }));
    await waitFor(() => expect(state.importCalls).toHaveLength(1));
    expect(state.importCalls[0].keywords).toBe('hiring');
    expect(state.importCalls[0].authors.map((a) => a.providerId).sort()).toEqual(['ACoAFIXTURE1', 'ACoAFIXTURE2']);

    await screen.findByText('Imported 2 new people');
    expect(screen.getByText(/1 was already in your leads/)).toBeInTheDocument();
    expect(screen.getByText(/1 skipped/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Leads' }));
    await waitFor(() => expect(lastLocation.pathname).toBe('/hub/leads'));
  });

  it('an import the budget refuses shows the server\'s sentence and keeps the page', async () => {
    state.responses.posts = page('posts', [post(1)]);
    state.importError = apiError(429, 'FETCH_LIMIT_DAY', 'This import needs 1 profile fetches and you have 0 left today.');
    renderPage();
    fireEvent.click(await screen.findByRole('radio', { name: 'Posts' }));
    await search('hiring');
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Select Fixture Author 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Import authors' }));
    await waitFor(() => expect(screen.getByText(/you have 0 left today/)).toBeInTheDocument());
    expect(screen.getByText('Synthetic hiring post 1')).toBeInTheDocument();
  });

  it('pasting a URL of another category shows the server\'s own message', async () => {
    state.error = apiError(400, 'WRONG_SEARCH_CATEGORY', 'That URL is a people search. Paste a companies search URL here.');
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Paste a LinkedIn search URL instead' }));
    await search('https://www.linkedin.com/search/results/people/?keywords=cto');
    await waitFor(() => expect(screen.getByText(/That URL is a people search/)).toBeInTheDocument());
    expect(state.calls[0].body).toMatchObject({ url: 'https://www.linkedin.com/search/results/people/?keywords=cto', keywords: undefined });
  });

  it('the daily cap: a clear notice, and Search is disabled', async () => {
    state.error = apiError(429, 'DISCOVER_DAILY_CAP', 'You have used today\'s search pages. They reset at midnight UTC.');
    renderPage();
    await search('saas');
    await waitFor(() => expect(screen.getByText('You have used today\'s searches')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
  });

  it('a usage already at the cap disables Search before anything is tried', async () => {
    state.usage = usage(100);
    renderPage();
    await waitFor(() => expect(screen.getByText(/100 of 100 searches used today/)).toBeInTheDocument());
    fireEvent.change(screen.getByRole('textbox', { name: /keywords/i }), { target: { value: 'saas' } });
    expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled();
  });

  it('no LinkedIn account points at settings; a locked feature says LinkedIn refused it', async () => {
    state.error = apiError(409, 'NO_ACCOUNT', 'Connect your LinkedIn account first');
    renderPage();
    await search('saas');
    await waitFor(() => expect(screen.getByText('Connect your LinkedIn account first')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Open LinkedIn settings' })).toBeInTheDocument();
  });

  it('a locked search type says so without blaming the person', async () => {
    state.error = apiError(403, 'FEATURE_LOCKED', 'Your LinkedIn account does not include this search');
    renderPage();
    fireEvent.click(await screen.findByRole('radio', { name: 'Jobs' }));
    await search('react');
    await waitFor(() => expect(screen.getByText('Your LinkedIn account does not include this search')).toBeInTheDocument());
  });

  it('each tab keeps its own results when you switch back', async () => {
    state.responses.companies = page('companies', [company(1)]);
    renderPage();
    await search('saas');
    await screen.findByText('Fixture Company 1');
    fireEvent.click(screen.getByRole('radio', { name: 'Jobs' }));
    expect(screen.getByText('Search for jobs')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Companies' }));
    expect(screen.getByText('Fixture Company 1')).toBeInTheDocument();
  });
});

describe('format helpers', () => {
  it('compactFilters keeps only set filters and turns picker objects into ids', () => {
    expect(compactFilters(undefined)).toBeUndefined();
    expect(compactFilters({ sortBy: 'any', location: [], hasJobOffers: false })).toBeUndefined();
    expect(compactFilters({
      location: [{ id: '102713980', title: 'India' }],
      headcount: ['11-50'],
      region: { id: '1', title: 'x' },
      sortBy: 'date',
      easyApply: true,
    })).toEqual({ location: ['102713980'], headcount: ['11-50'], region: '1', sortBy: 'date', easyApply: true });
  });


  it('groups jobs by company id, most roles first; a job without a company stands alone', () => {
    const groups = groupJobsByCompany([job(1), job(2), job(3, { company: { companyId: '9100002', name: 'B' } }), job(4, { company: null })]);
    expect(groups.map((g) => g.jobs.length)).toEqual([2, 1, 1]);
    expect(groups[0].company.companyId).toBe('9100001');
    expect(groups.filter((g) => g.company === null)).toHaveLength(1);
  });

  it('snippet flattens whitespace and ends with an ellipsis only when cut', () => {
    expect(snippet('a\n\n b')).toBe('a b');
    expect(snippet('x'.repeat(300), 50)).toHaveLength(50);
    expect(snippet('x'.repeat(300), 50).endsWith('…')).toBe(true);
  });

  it('company routes and router state', () => {
    expect(companyPath({ slug: 'a b', companyId: '1' })).toBe('/hub/company/a%20b');
    expect(companyPath({ companyId: '1' })).toBe('/hub/company/1');
    expect(companyPath({})).toBeNull();
    expect(findPeopleState({ companyId: 5, name: '' })).toEqual({ newAudience: true, newAudienceCompany: { id: '5', name: 'Company' } });
  });

  it('failure kinds', () => {
    const kind = (code) => discoverFailureKind({ response: { data: { code } } });
    expect(kind('NO_ACCOUNT')).toBe('account');
    expect(kind('NO_LINKEDIN_ACCOUNT')).toBe('account');
    expect(kind('DISCOVER_DAILY_CAP')).toBe('capped');
    expect(kind('FEATURE_LOCKED')).toBe('locked');
    expect(kind('WRONG_SEARCH_CATEGORY')).toBe('input');
    expect(kind('FETCH_LIMIT_MONTH')).toBe('budget');
    expect(kind('RATE_LIMITED')).toBe('rateLimited');
    expect(kind(undefined)).toBe('other');
  });
});

describe('New audience dialog prefill (from Find people here)', () => {
  it('opens on the review step with the company already chosen as a filter', async () => {
    const { NewAudienceModal } = await import('src/products/pages/leads/components/NewAudienceModal.jsx');
    renderWithProviders(
      <NewAudienceModal open onClose={() => {}} onSubmit={() => {}} prefill={{ company: { id: '9000001', title: 'Fixture Company 1' } }} />,
    );
    await waitFor(() => expect(screen.getByText('Fixture Company 1')).toBeInTheDocument());
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Fixture Company 1' })).toBeInTheDocument();
  });

  it('without a prefill it starts on the first step', async () => {
    const { NewAudienceModal } = await import('src/products/pages/leads/components/NewAudienceModal.jsx');
    renderWithProviders(<NewAudienceModal open onClose={() => {}} onSubmit={() => {}} />);
    await waitFor(() => expect(screen.getByText('Step 1 of 3')).toBeInTheDocument());
  });
});
