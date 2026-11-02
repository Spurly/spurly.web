import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { stubGateway } from './gateway.js';
import { renderWithProviders } from './helpers.jsx';

/**
 * Leads → Company filter: options come from the server a page at a time,
 * searching goes to the server, and scrolling to the end loads the next page.
 */

const PAGE = 30;
const all = Array.from({ length: 45 }, (_, i) => ({ name: `Company ${String(i + 1).padStart(2, '0')}`, count: 45 - i }));
const calls = [];

vi.mock('src/shared/gateway/apiGateway.js', () =>
  stubGateway({
    'GET /hub/lead-companies': (url, config) => {
      const { q = '', page = 1 } = config?.params || {};
      calls.push({ q, page });
      const matching = all.filter((c) => c.name.toLowerCase().includes(String(q).toLowerCase()));
      const start = (page - 1) * PAGE;
      return {
        success: true,
        data: { companies: matching.slice(start, start + PAGE), page, hasMore: start + PAGE < matching.length },
      };
    },
    'POST /companies/logos': { success: true, data: {} },
  }),
);

const { CompanyFilter } = await import('src/products/pages/leads/components/CompanyFilter.jsx');

describe('CompanyFilter', () => {
  it('loads nothing until opened, then pages, searches and selects on the server', async () => {
    const changes = [];
    renderWithProviders(<CompanyFilter value={[]} onChange={(v) => changes.push(v)} />);
    expect(calls).toHaveLength(0);

    fireEvent.click(screen.getByRole('combobox', { name: 'Filter by company' }));
    await waitFor(() => expect(screen.getByText('Company 01')).toBeTruthy());
    expect(screen.queryByText('Company 31')).toBeNull();

    // scroll to the end → page 2
    const list = screen.getByRole('listbox');
    Object.defineProperty(list, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(list, 'clientHeight', { value: 320, configurable: true });
    list.scrollTop = 700;
    fireEvent.scroll(list);
    await waitFor(() => expect(screen.getByText('Company 45')).toBeTruthy());
    expect(calls.some((c) => c.page === 2)).toBe(true);

    // typing searches on the server
    fireEvent.change(screen.getByRole('textbox', { name: 'Search companies' }), { target: { value: '07' } });
    await waitFor(() => expect(calls.at(-1)).toEqual({ q: '07', page: 1 }));
    await waitFor(() => expect(screen.queryByText('Company 01')).toBeNull());

    fireEvent.click(screen.getByRole('option', { name: /Company 07/ }));
    expect(changes.at(-1)).toEqual(['Company 07']);
  });
});
