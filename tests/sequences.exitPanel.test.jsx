import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const { ExitRulesPanel } = await import('src/products/pages/sequences/components/ExitRulesPanel.jsx');

describe('ExitRulesPanel', () => {
  it('lists reply stopping only when the inbox is on, and says why it is missing otherwise', () => {
    const { rerender } = render(<ExitRulesPanel exit={{}} inbox isOrg onChange={() => {}} />);
    expect(screen.getByLabelText('Stop when the lead replies')).toBeInTheDocument();
    rerender(<ExitRulesPanel exit={{}} inbox={false} isOrg onChange={() => {}} />);
    expect(screen.queryByLabelText('Stop when the lead replies')).toBeNull();
    expect(screen.getByText(/Reply stopping is off/)).toBeInTheDocument();
  });
  it('reports changes and validates the maximum days', async () => {
    const onChange = vi.fn();
    render(<ExitRulesPanel exit={{ maxDays: 0 }} inbox isOrg={false} onChange={onChange} />);
    expect(screen.getByText('Maximum days must be 1 to 365')).toBeInTheDocument();
    expect(screen.queryByLabelText(/another account/)).toBeNull();
    await userEvent.click(screen.getByLabelText('Stop when the lead accepts the invitation'));
    expect(onChange).toHaveBeenCalledWith({ maxDays: 0, onAccepted: true });
  });
});

const { BranchCounts } = await import('src/products/pages/sequences/components/BranchCounts.jsx');
describe('BranchCounts', () => {
  it('shows Yes / No per branching step and nothing without counts', () => {
    const steps = [{ id: 'sp', type: 'split', config: { ratio: 50 } }, { id: 'f', type: 'follow', config: {} }];
    const { container, rerender } = render(<BranchCounts steps={steps} counts={{ sp: { yes: 7, no: 5 } }} />);
    expect(container.textContent).toContain('A/B split');
    expect(container.textContent).toContain('Yes 7 · No 5');
    rerender(<BranchCounts steps={steps} counts={null} />);
    expect(container.textContent).toBe('');
  });
});
