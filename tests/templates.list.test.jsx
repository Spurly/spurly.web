import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { stubGateway } from './gateway.js';

const templates = [
  { _id: 't1', name: 'Warm intro', type: 'connection', body: 'Hi {{firstName}}', isSystem: false },
  { _id: 't2', name: 'Follow up', type: 'message', body: 'Following up', isSystem: true },
];

vi.mock('src/shared/gateway/apiGateway.js', () => stubGateway({
  'GET /message-templates*': { success: true, data: { templates, pagination: { total: 2 } } },
  'GET /*': { success: true, data: {} },
}));

const { renderWithProviders } = await import('./helpers.jsx');
const { TemplatesPage } = await import('src/products/leadgen/templates');

describe('TemplatesPage', () => {
  it('lists the templates returned by the API', async () => {
    renderWithProviders(<TemplatesPage />, { route: '/dashboard/templates' });
    await waitFor(() => expect(screen.getByText('Warm intro')).toBeInTheDocument());
    expect(screen.getByText('Follow up')).toBeInTheDocument();
  });
});
