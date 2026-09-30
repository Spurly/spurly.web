import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { stubGateway } from './gateway.js';

/** The company page: a full body, a sparse one (Link&Cap shape), not found, and a refresh. */
const state = { response: null, calls: [] };

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /hub/companies/*': async (url, config) => {
    state.calls.push({ url, params: config?.params });
    if (state.response?.error) throw state.response.error;
    return { success: true, data: state.response };
  },
  'GET /*': { success: true, data: [] },
}));

const { renderWithProviders } = await import('./helpers.jsx');
const { HubCompanyPage } = await import('src/products/pages/company/index.jsx');
const { companyFailureKind } = await import('src/products/company/hooks/useCompany.js');

const full = {
  company: {
    companyId: '104094967', name: 'Fixture Labs', tagline: 'Makes fixtures', description: 'We build test fixtures.',
    profileUrl: 'https://www.linkedin.com/company/fixture-labs', website: 'https://fixture.example', claimed: true,
    industry: ['Software Development', 'IT Services'], employeeCountRange: { from: 51, to: 200 }, followersCount: 1234,
    foundedYear: 2019, viewerCanManage: true, locationCount: 2,
    locations: [{ isHeadquarter: true, city: 'Pune', country: 'IN' }, { isHeadquarter: false, city: 'Oslo', country: 'NO' }],
  },
  cached: false, fetchedAt: new Date().toISOString(), expiresAt: new Date().toISOString(),
};
const sparse = { company: { companyId: '117183943', name: 'Sparse Co', viewerCanManage: true, locations: [], locationCount: 0, industry: [], description: '' }, cached: true, fetchedAt: new Date().toISOString() };

const renderPage = () =>
  renderWithProviders(
    <Routes><Route path="/hub/company/:identifier" element={<HubCompanyPage />} /></Routes>,
    { route: '/hub/company/fixture-labs' },
  );

beforeEach(() => { state.response = full; state.calls = []; });

describe('Company page', () => {
  it('shows the company, its numbers, about text and locations', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Fixture Labs')).toBeInTheDocument());
    expect(screen.getByText('Makes fixtures')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('51-200')).toBeInTheDocument();
    expect(screen.getByText('2019')).toBeInTheDocument();
    expect(screen.getByText('We build test fixtures.')).toBeInTheDocument();
    expect(screen.getByText(/Pune, IN/)).toBeInTheDocument();
    expect(screen.getByText('You manage this page')).toBeInTheDocument();
  });

  it('a sparse company reads as sparse, not broken', async () => {
    state.response = sparse;
    renderPage();
    await waitFor(() => expect(screen.getByText('Sparse Co')).toBeInTheDocument());
    expect(screen.getByText('This company has not written an about section.')).toBeInTheDocument();
    expect(screen.queryByText('Locations')).not.toBeInTheDocument();
  });

  it('Refresh asks the server to bypass the cache', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Fixture Labs')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(state.calls.length).toBe(2));
    expect(state.calls[0].params).toBeUndefined();
    expect(state.calls[1].params).toEqual({ refresh: 1 });
  });

  it('a 404 is a not-found state', async () => {
    state.response = { error: { success: false, status: 404, message: 'Company not found' } };
    renderPage();
    await waitFor(() => expect(screen.getByText('Company not found')).toBeInTheDocument());
  });

  it('classifies failures', () => {
    expect(companyFailureKind({ status: 404 })).toBe('notFound');
    expect(companyFailureKind({ status: 409 })).toBe('noAccount');
    expect(companyFailureKind({ status: 429 })).toBe('throttled');
    expect(companyFailureKind({ status: 502 })).toBe('other');
  });
});
