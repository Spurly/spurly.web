import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { setActiveAccountId, rememberAccounts, withActiveAccount } from 'src/shared/orgAccount/activeAccount.js';
import { setDraftDirty, hasDirtyDraft } from 'src/shared/orgAccount/draftGuard.js';

/**
 * P2.4 / P2.5: the sidebar summary follows the acting account (bound path + refetch on a switch), the
 * "Sending as" chip names the acting account and a member with several accounts and none in effect is told
 * to pick one, solo users see nothing, and a builder draft marks itself so the switch can ask first (D60).
 */

const org = { isMember: true, loaded: true, features: {}, workspaceEnabled: true };
vi.mock('src/core/org/hooks/useOrgState.js', () => ({ useOrgState: () => org }));

const { SendingAsChip } = await import('src/core/org/components/SendingAsChip.jsx');
const { useSendingAs } = await import('src/core/org/hooks/useSendingAs.js');

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('user', JSON.stringify({ _id: 'u1' }));
  org.isMember = true;
});

describe('summary is account-bound', () => {
  it('carries the acting account on /hub/summary and /hub/summary/dashboard, not on analytics', () => {
    setActiveAccountId('acc1');
    expect(withActiveAccount({ method: 'get', url: '/hub/summary' }).params).toEqual({ accountId: 'acc1' });
    expect(withActiveAccount({ method: 'get', url: '/hub/summary/dashboard' }).params).toEqual({ accountId: 'acc1' });
    expect(withActiveAccount({ method: 'get', url: '/hub/summary/analytics' }).params).toBeUndefined();
  });
});

describe('Sending as chip', () => {
  it('names the chosen account', () => {
    rememberAccounts('o1', [{ id: 'a1', name: 'Asha Rao' }, { id: 'a2', name: 'Ben Cole' }]);
    setActiveAccountId('a2');
    render(<SendingAsChip />);
    expect(screen.getByTestId('sending-as')).toHaveTextContent('Sending as Ben Cole');
  });

  it('a single account needs no choice and is named', () => {
    rememberAccounts('o1', [{ id: 'a1', name: 'Asha Rao' }]);
    render(<SendingAsChip />);
    expect(screen.getByTestId('sending-as')).toHaveTextContent('Sending as Asha Rao');
  });

  it('solo users see nothing', () => {
    org.isMember = false;
    const { container } = render(<SendingAsChip />);
    expect(container).toBeEmptyDOMElement();
  });

  it('follows a switch', () => {
    rememberAccounts('o1', [{ id: 'a1', name: 'Asha Rao' }, { id: 'a2', name: 'Ben Cole' }]);
    setActiveAccountId('a1');
    render(<SendingAsChip />);
    expect(screen.getByTestId('sending-as')).toHaveTextContent('Asha Rao');
    act(() => setActiveAccountId('a2'));
    expect(screen.getByTestId('sending-as')).toHaveTextContent('Ben Cole');
  });
});

describe('useSendingAs', () => {
  it('needsPick is false once an account is in effect and for solo users', () => {
    rememberAccounts('o1', [{ id: 'a1', name: 'A' }, { id: 'a2', name: 'B' }]);
    setActiveAccountId('a1');
    expect(renderHook(() => useSendingAs()).result.current).toMatchObject({ isOrg: true, needsPick: false, name: 'A' });
    org.isMember = false;
    expect(renderHook(() => useSendingAs()).result.current).toEqual({ isOrg: false, name: '', needsPick: false });
  });
});

describe('draft guard (D60)', () => {
  it('tracks dirty drafts by key', () => {
    expect(hasDirtyDraft()).toBe(false);
    setDraftDirty('new-sequence', true);
    expect(hasDirtyDraft()).toBe(true);
    setDraftDirty('new-sequence', false);
    expect(hasDirtyDraft()).toBe(false);
  });
});
