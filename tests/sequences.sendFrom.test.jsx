import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const created = [];
let orgMember = true;
vi.mock('src/products/sequences/controller/sequence.js', () => ({
  default: { createSequence: (_e, params) => created.push(params), previewSequence: vi.fn() },
}));
vi.mock('src/products/campaigns/controller/campaign.js', () => ({ default: { previewCampaign: vi.fn() } }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('src/core/primitives', async (orig) => ({ ...(await orig()), useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));
vi.mock('src/core/org/hooks/useOrgState.js', () => ({ useOrgState: () => ({ isMember: orgMember, features: { inbox: true } }) }));

import { useNewSequencePage } from 'src/products/sequences/hooks/useNewSequencePage.js';
import { SendFromControl } from 'src/products/pages/sequences/components/SendFromControl.jsx';
import { sequencesStrings } from 'src/products/pages/sequences/strings.js';

const accounts = [{ id: 'a1', name: 'Asha' }, { id: 'a2', name: 'Ben' }];
function seed(list = accounts) {
  localStorage.setItem('user', JSON.stringify({ _id: 'u1' }));
  localStorage.setItem('orgKnownAccounts', JSON.stringify({ userId: 'u1', orgId: 'o1', accounts: list }));
}

beforeEach(() => { localStorage.clear(); created.length = 0; orgMember = true; seed(); });

describe('new sequence "Send from" (M6.3)', () => {
  it('without a choice the create body has no accountIds (single flow unchanged)', () => {
    const { result } = renderHook(() => useNewSequencePage());
    act(() => result.current.setName('n'));
    act(() => result.current.create());
    expect(created).toHaveLength(1);
    expect(created[0]).not.toHaveProperty('accountIds');
  });

  it('two or more ticked accounts are sent as accountIds', () => {
    const { result } = renderHook(() => useNewSequencePage());
    act(() => result.current.pool.toggle('a1'));
    act(() => result.current.pool.toggle('a2'));
    act(() => result.current.setName('n'));
    act(() => result.current.create());
    expect(created[0].accountIds).toEqual(['a1', 'a2']);
  });

  it('exactly one ticked account blocks create (no silent downgrade)', () => {
    const { result } = renderHook(() => useNewSequencePage());
    act(() => result.current.pool.toggle('a1'));
    expect(result.current.poolBlocked).toBe(true);
    expect(result.current.canCreate).toBe(false);
    act(() => result.current.setName('n'));
    act(() => result.current.create());
    expect(created).toHaveLength(0);
  });

  it('the control is offered only to an org member with two or more accounts', () => {
    expect(renderHook(() => useNewSequencePage()).result.current.canPool).toBe(true);
    seed([accounts[0]]);
    expect(renderHook(() => useNewSequencePage()).result.current.canPool).toBe(false);
    orgMember = false;
    seed();
    expect(renderHook(() => useNewSequencePage()).result.current.canPool).toBe(false);
  });

  it('the control lists accounts and explains the 2-account rule', async () => {
    const toggle = vi.fn();
    render(<SendFromControl pool={{ accounts, selected: ['a1'], toggle, validation: { ok: false, reason: 'x' } }} />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Asha')).toBeInTheDocument();
    expect(screen.getByText(sequencesStrings.new.sendFromBlocked)).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Ben'));
    expect(toggle).toHaveBeenCalledWith('a2');
  });
});
