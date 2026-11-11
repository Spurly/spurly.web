import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SendMessagePreviewDialog } from 'src/products/pages/campaigns/components/SendMessagePreviewDialog.jsx';
import { hubPoolMemberColumns, excludedText } from 'src/products/pages/campaigns/components/columns.jsx';

const accounts = [{ id: 'a1', name: 'Sarthak' }, { id: 'a2', name: 'Shivanshu' }, { id: 'a3', name: 'Richard' }];
const base = { open: true, onClose: () => {}, confirming: false, mode: 'connect', template: '', members: [], membersLoading: false, pendingCount: 5, senderName: 'S' };

describe('Start dialog: who sends', () => {
  it('shows no choice for one account (or a solo user)', () => {
    render(<SendMessagePreviewDialog {...base} accounts={[accounts[0]]} onConfirm={() => {}} />);
    expect(screen.queryByText('Several accounts')).toBeNull();
  });

  it('one account: confirms with no account list (the normal start)', async () => {
    const onConfirm = vi.fn();
    render(<SendMessagePreviewDialog {...base} accounts={accounts} ownAccountId="a1" onConfirm={onConfirm} />);
    expect(screen.getByText('Only Sarthak')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /send connection requests/i }));
    expect(onConfirm).toHaveBeenCalledWith(null);
  });

  it('several: needs two ticks, then confirms with exactly those accounts', async () => {
    const onConfirm = vi.fn();
    render(<SendMessagePreviewDialog {...base} accounts={accounts} ownAccountId="a1" onConfirm={onConfirm} />);
    await userEvent.click(screen.getByText('Several accounts'));
    const go = screen.getByRole('button', { name: /send connection requests/i });
    expect(go).toBeDisabled();
    await userEvent.click(screen.getByLabelText('Shivanshu'));
    expect(go).toBeDisabled();
    await userEvent.click(screen.getByLabelText('Richard'));
    expect(go).toBeEnabled();
    await userEvent.click(go);
    expect(onConfirm).toHaveBeenCalledWith(['a2', 'a3']);
  });

  it('a campaign already made for several accounts opens on Several with its accounts ticked', async () => {
    const onConfirm = vi.fn();
    render(<SendMessagePreviewDialog {...base} accounts={accounts} poolAccountIds={['a1', 'a2', 'a3']} onConfirm={onConfirm} />);
    expect(screen.getByLabelText('Sarthak')).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: /send connection requests/i }));
    expect(onConfirm).toHaveBeenCalledWith(['a1', 'a2', 'a3']);
  });
});

describe('members table: sent from and why', () => {
  const why = hubPoolMemberColumns.find((c) => c.key === 'why' || c.label === 'Why');
  it('says which accounts did not send and why, in plain words', () => {
    expect(excludedText([{ name: 'Sarthak', reason: 'already-connected' }])).toBe('Not sent from Sarthak (already connected)');
    expect(excludedText([])).toBe('');
    expect(why.title({ status: 'invited', excludedNotes: [{ name: 'Sarthak', reason: 'already-connected' }] })).toBe('Not sent from Sarthak (already connected)');
    expect(why.title({ status: 'skipped', skipReason: 'held-by-other-account' })).toBe('Already in another campaign or sequence');
  });
  it('an unassigned waiting row says the account is decided when it is sent', () => {
    const col = hubPoolMemberColumns.find((c) => c.key === 'senderName');
    const { container } = render(<div>{col.render('', { status: 'pending' })}</div>);
    expect(container.textContent).toBe('Decided when it is sent');
  });
});
