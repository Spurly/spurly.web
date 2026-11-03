import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { EnrichStatusCell } from 'src/products/pages/import/components/stagingColumns.jsx';
import { renderWithProviders } from './helpers.jsx';

/**
 * A failed row says WHY, behind a visible (i) in the status cell — hovering or
 * focusing it shows the reason; healthy rows have no icon at all.
 */
describe('Import staging — failed status', () => {
  it('shows an info icon whose tooltip carries the stored reason', () => {
    renderWithProviders(<EnrichStatusCell value="failed" row={{ enrichError: 'Profile not found on LinkedIn' }} />);
    expect(screen.getByText('Failed')).toBeTruthy();
    const icon = screen.getByLabelText('Why this failed');
    expect(screen.queryByText('Profile not found on LinkedIn')).toBeNull();
    fireEvent.focus(icon);
    expect(screen.getByText('Profile not found on LinkedIn')).toBeTruthy();
  });

  it('falls back to a plain explanation when no reason was stored', () => {
    renderWithProviders(<EnrichStatusCell value="failed" row={{}} />);
    fireEvent.focus(screen.getByLabelText('Why this failed'));
    expect(screen.getByText(/could not load this profile/i)).toBeTruthy();
  });

  it('has no icon for rows that have not failed', () => {
    for (const value of ['pending', 'queued', 'enriched']) {
      const { unmount } = renderWithProviders(<EnrichStatusCell value={value} row={{ enrichError: 'stale' }} />);
      expect(screen.queryByLabelText('Why this failed')).toBeNull();
      unmount();
    }
  });
});
