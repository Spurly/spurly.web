import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { stubGateway } from './gateway.js';
import { renderWithProviders } from './helpers.jsx';

/** Import wizard → "Name this list" dialog → the name reaches the server. */

const posted = [];
vi.mock('src/shared/gateway/apiGateway.js', () =>
  stubGateway({
    'POST /imported-leads/auto-import': (url, body) => {
      posted.push(body);
      return { success: true, data: { sentToHub: 1, finding: 1, skipped: 0, audience: { id: 'a1', name: body.listName } } };
    },
    'POST /companies/logos': { success: true, data: {} },
  }),
);

const { UploadPanel } = await import('src/products/pages/import/components/UploadPanel.jsx');

describe('Import — name the list', () => {
  it('asks for a list name (pre-filled from the file) and imports into it', async () => {
    const done = vi.fn();
    const { container } = renderWithProviders(<UploadPanel onDone={done} />);

    const csv = 'Full Name,Company,LinkedIn URL\nAda Lovelace,Analytical,linkedin.com/in/ada\nRahul Sharma,TCS,\n';
    const file = new File([csv], 'fintech-founders.csv', { type: 'text/csv' });
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });

    fireEvent.click(await screen.findByRole('button', { name: /Continue/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Import 2 rows' }));

    const dialog = await screen.findByRole('dialog');
    const input = within(dialog).getByLabelText('List name');
    expect(input.value).toMatch(/^fintech-founders · /);

    fireEvent.change(input, { target: { value: 'Q4 fintech founders' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Import 2 rows' }));

    await waitFor(() => expect(done).toHaveBeenCalled());
    expect(posted[0]).toMatchObject({ sourceFile: 'fintech-founders.csv', listName: 'Q4 fintech founders' });
    expect(posted[0].rows).toHaveLength(2);
  });
});
