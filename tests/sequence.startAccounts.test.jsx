import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StartSequenceDialog } from 'src/products/pages/sequences/components/StartSequenceDialog.jsx';
import { hubEnrollmentColumns } from 'src/products/pages/sequences/components/columns.jsx';

const accounts = [{ id: 'a1', name: 'Sarthak' }, { id: 'a2', name: 'Shivanshu' }, { id: 'a3', name: 'Richard' }];
const base = { onClose: () => {}, confirming: false, accounts, ownAccountId: 'a1', firstStep: 'connect' };

describe('Start sequence: who sends', () => {
  it('one account: starts as before, no account list', async () => {
    const onConfirm = vi.fn();
    render(<StartSequenceDialog {...base} onConfirm={onConfirm} />);
    expect(screen.getByText('Only Sarthak')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(onConfirm).toHaveBeenCalledWith(null);
  });

  it('several: needs two ticks, then starts with exactly those accounts', async () => {
    const onConfirm = vi.fn();
    render(<StartSequenceDialog {...base} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByText('Several accounts'));
    const go = screen.getByRole('button', { name: 'Start' });
    expect(go).toBeDisabled();
    await userEvent.click(screen.getByLabelText('Sarthak'));
    await userEvent.click(screen.getByLabelText('Shivanshu'));
    expect(go).toBeEnabled();
    await userEvent.click(go);
    expect(onConfirm).toHaveBeenCalledWith(['a1', 'a2']);
  });

  it('the hint follows the first step; a paused sequence says Resume', async () => {
    const { rerender } = render(<StartSequenceDialog {...base} firstStep="message" onConfirm={() => {}} />);
    await userEvent.click(screen.getByText('Several accounts'));
    expect(screen.getByText(/messages the people it is connected to/i)).toBeInTheDocument();
    rerender(<StartSequenceDialog {...base} resume onConfirm={() => {}} />);
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
  });
});

describe('enrolments table: sent from and why', () => {
  const cols = hubEnrollmentColumns([{ type: 'connect' }], { pool: true });
  it('says which accounts did not run the person, and the new stop reasons read as sentences', () => {
    const why = cols.find((c) => c.key === 'excludedNotes');
    expect(why.title({ excludedNotes: [{ name: 'Sarthak', reason: 'already-connected' }] })).toBe('Not sent from Sarthak (already connected)');
    const last = cols.find((c) => c.key === 'lastEvent');
    const { container } = render(<div>{last.render('', { stopReason: 'not-connected', history: [] })}</div>);
    expect(container.textContent).toMatch(/none of your accounts is connected/i);
  });
});
