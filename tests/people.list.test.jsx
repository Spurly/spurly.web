import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { stubGateway } from './gateway.js';

const people = [
  { _id: 'p1', name: 'Ada Lovelace', title: 'Engineer', company: 'Analytical', profileUrl: 'https://linkedin.com/in/ada' },
  { _id: 'p2', name: 'Grace Hopper', title: 'Rear Admiral', company: 'Navy', profileUrl: 'https://linkedin.com/in/grace' },
];

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /people': { success: true, data: {
    people,
    pagination: { limit: 100, skip: 0, total: people.length, pages: 1, hasMore: false },
  } },
  'GET /people/*': { success: true, data: [] },
  'GET /outreach/*': { success: true, data: {} },
  'GET /credits*': { success: true, data: { balance: 100 } },
  'GET /*': { success: true, data: [] },
}));

const { renderWithProviders } = await import('./helpers.jsx');
const { PeoplePage } = await import('src/products/leadgen/people');

describe('PeoplePage', () => {
  beforeEach(() => localStorage.setItem('authToken', 'test-token'));

  it('renders the leads returned by the API', async () => {
    renderWithProviders(<PeoplePage />, { route: '/dashboard/people' });
    await waitFor(() => {
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    });
  });
});
