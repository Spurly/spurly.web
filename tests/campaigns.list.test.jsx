import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { stubGateway } from './gateway.js';

const campaigns = [
  { _id: 'c1', name: 'Founders · Sep 4', status: 'active', actionType: 'connection', total: 12, completed: 5, createdAt: '2026-09-04T10:00:00Z' },
  { _id: 'c2', name: 'Recruiters · Sep 1', status: 'draft', actionType: null, total: 3, completed: 0, createdAt: '2026-09-01T10:00:00Z' },
];

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /campaigns': { success: true, data: { campaigns } },
  'GET /*': { success: true, data: {} },
}));

const { renderWithProviders } = await import('./helpers.jsx');
const { CampaignsPage } = await import('src/products/leadgen/campaigns');

describe('CampaignsPage', () => {
  it('lists the campaigns returned by the API', async () => {
    renderWithProviders(<CampaignsPage />, { route: '/dashboard/campaigns' });
    await waitFor(() => {
      expect(screen.getByText('Founders · Sep 4')).toBeInTheDocument();
      expect(screen.getByText('Recruiters · Sep 1')).toBeInTheDocument();
    });
  });
});
