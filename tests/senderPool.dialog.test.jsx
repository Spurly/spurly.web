import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, renderHook, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SenderPoolDialog } from 'src/products/pages/campaigns/components/SenderPoolDialog.jsx';
import { refusalText, poolErrorText } from 'src/products/pages/campaigns/components/refusalCopy.js';
import { campaignsStrings } from 'src/products/pages/campaigns/strings.js';
import { hasDirtyDraft } from 'src/shared/orgAccount/draftGuard.js';

const previewSpy = vi.fn();
vi.mock('src/products/campaigns/controller/campaign.js', () => ({
  default: { previewCampaign: (...a) => previewSpy(...a) },
}));
vi.mock('src/products/sequences/controller/sequence.js', () => ({
  default: { previewSequence: (...a) => previewSpy(...a) },
}));

import { useSenderPool } from 'src/products/campaigns/hooks/useSenderPool.js';
import { CAMPAIGN_EVENTS } from 'src/products/campaigns/constants/constants.js';

const accounts = [{ id: 'a1', name: 'Asha' }, { id: 'a2', name: 'Ben' }, { id: 'a3', name: 'Cy' }];

function seed() {
  localStorage.setItem('user', JSON.stringify({ _id: 'u1' }));
  localStorage.setItem('orgKnownAccounts', JSON.stringify({ userId: 'u1', orgId: 'o1', accounts }));
}

const REASONS = ['held-by-other-account', 'not-connected', 'already-connected', 'no-usable-sender', 'degree-unknown', 'invited-by-other-account', 'connected-to-other-account'];

beforeEach(() => { localStorage.clear(); previewSpy.mockReset(); seed(); });

function makePool(over = {}) {
  return { accounts, selected: ['a1', 'a2'], toggle: vi.fn(), reset: vi.fn(), validation: { ok: true, reason: '' }, preview: null, loading: false, error: null, requestPreview: vi.fn(), ...over };
}

describe('SenderPoolDialog (M6.2, D97)', () => {
  it('shows exactly the counts of the preview response', () => {
    const preview = { total: 7, perAccount: [{ accountId: 'a1', name: 'Asha', count: 4 }, { accountId: 'a2', name: 'Ben', count: 3 }], refused: [], alreadyConnected: 2, refusedOtherAccount: 1 };
    render(<SenderPoolDialog open onClose={() => {}} pool={makePool({ preview })} leadCount={10} onConfirm={() => {}} />);
    const box = screen.getByTestId('pool-preview');
    expect(box).toHaveTextContent('7 people will be contacted');
    expect(box).toHaveTextContent('Asha: 4');
    expect(box).toHaveTextContent('Ben: 3');
    expect(box).toHaveTextContent('2 already connected');
    expect(box).toHaveTextContent("1 not in these accounts' lists");
  });

  it('every refusal reason renders its own sentence, never the raw code', () => {
    for (const reason of REASONS) {
      const preview = { total: 1, perAccount: [], refused: [{ reason, count: 3 }] };
      const { unmount } = render(<SenderPoolDialog open onClose={() => {}} pool={makePool({ preview })} leadCount={4} onConfirm={() => {}} />);
      const text = screen.getByTestId('pool-preview').textContent;
      expect(text).toContain(refusalText(reason));
      expect(campaignsStrings.refusals[reason]).toBeTruthy();
      expect(text).not.toContain(reason);
      unmount();
    }
  });

  it('an unknown reason still gets a sentence', () => {
    const preview = { total: 1, perAccount: [], refused: [{ reason: 'brand-new-reason', count: 1 }] };
    render(<SenderPoolDialog open onClose={() => {}} pool={makePool({ preview })} leadCount={1} onConfirm={() => {}} />);
    expect(screen.getByTestId('pool-preview')).toHaveTextContent(campaignsStrings.fallbackRefusal);
    expect(screen.getByTestId('pool-preview').textContent).not.toContain('brand-new-reason');
  });

  it('create is disabled with a reason until two accounts are ticked and a preview exists', () => {
    const { rerender } = render(<SenderPoolDialog open onClose={() => {}} pool={makePool({ selected: ['a1'], validation: { ok: false, reason: 'Pick at least 2 accounts to send from together.' } })} leadCount={3} onConfirm={() => {}} />);
    const create = screen.getByRole('button', { name: campaignsStrings.pool.create });
    expect(create).toBeDisabled();
    expect(create).toHaveAttribute('title', 'Pick at least 2 accounts to send from together.');
    rerender(<SenderPoolDialog open onClose={() => {}} pool={makePool()} leadCount={3} onConfirm={() => {}} />);
    expect(screen.getByRole('button', { name: campaignsStrings.pool.create })).toHaveAttribute('title', campaignsStrings.pool.previewButton);
  });

  it('confirms with the ticked accounts and the chosen type', async () => {
    const onConfirm = vi.fn();
    const preview = { total: 2, perAccount: [], refused: [] };
    render(<SenderPoolDialog open onClose={() => {}} pool={makePool({ preview })} leadCount={2} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: campaignsStrings.pool.create }));
    expect(onConfirm).toHaveBeenCalledWith({ accountIds: ['a1', 'a2'], type: 'connect' });
  });

  it('empty result explains itself and blocks create; errors show a sentence not a code', () => {
    const empty = { total: 0, perAccount: [], refused: [{ reason: 'not-connected', count: 2 }] };
    const { rerender } = render(<SenderPoolDialog open onClose={() => {}} pool={makePool({ preview: empty })} leadCount={2} onConfirm={() => {}} />);
    expect(screen.getAllByText(campaignsStrings.pool.previewEmpty).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: campaignsStrings.pool.create })).toBeDisabled();
    rerender(<SenderPoolDialog open onClose={() => {}} pool={makePool({ error: { response: { data: { code: 'ACCOUNTS_REQUIRED' } } } })} leadCount={2} onConfirm={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent(campaignsStrings.errors.ACCOUNTS_REQUIRED);
    rerender(<SenderPoolDialog open onClose={() => {}} pool={makePool({ error: { response: { data: { code: 'SOMETHING_ODD' } } } })} leadCount={2} onConfirm={() => {}} />);
    expect(screen.getByRole('alert').textContent).not.toContain('SOMETHING_ODD');
    expect(poolErrorText(null)).toBe(campaignsStrings.errors.fallback);
  });

  it('shows a loading state, and a message when fewer than two accounts exist', () => {
    const { rerender } = render(<SenderPoolDialog open onClose={() => {}} pool={makePool({ loading: true })} leadCount={2} onConfirm={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent(campaignsStrings.pool.previewing);
    rerender(<SenderPoolDialog open onClose={() => {}} pool={makePool({ accounts: [accounts[0]], selected: [] })} leadCount={2} onConfirm={() => {}} />);
    expect(screen.getByText(campaignsStrings.pool.noAccounts)).toBeInTheDocument();
  });
});

describe('useSenderPool (M6.1)', () => {
  it('marks the draft dirty while accounts are ticked (D60) and clears it on unmount', () => {
    const { result, unmount } = renderHook(() => useSenderPool());
    expect(hasDirtyDraft()).toBe(false);
    act(() => result.current.toggle('a1'));
    expect(hasDirtyDraft()).toBe(true);
    unmount();
    expect(hasDirtyDraft()).toBe(false);
  });

  it('does not call the server for fewer than two accounts; previews with the ticked ids otherwise', async () => {
    const { result } = renderHook(() => useSenderPool());
    act(() => result.current.toggle('a1'));
    act(() => result.current.requestPreview({ leadIds: ['L1'], type: 'connect' }));
    expect(previewSpy).not.toHaveBeenCalled();
    act(() => result.current.toggle('a2'));
    previewSpy.mockImplementation((emitter) => emitter.emit(CAMPAIGN_EVENTS.PREVIEW_CAMPAIGN_SUCCESS, { total: 5 }));
    act(() => result.current.requestPreview({ leadIds: ['L1'], type: 'connect' }));
    expect(previewSpy.mock.calls[0][1]).toEqual({ leadIds: ['L1'], type: 'connect', accountIds: ['a1', 'a2'] });
    await waitFor(() => expect(result.current.preview).toEqual({ total: 5 }));
  });

  it('changing the selection drops a stale preview', async () => {
    const { result } = renderHook(() => useSenderPool());
    act(() => { result.current.toggle('a1'); });
    act(() => { result.current.toggle('a2'); });
    previewSpy.mockImplementation((emitter) => emitter.emit(CAMPAIGN_EVENTS.PREVIEW_CAMPAIGN_SUCCESS, { total: 1 }));
    act(() => result.current.requestPreview({ leadIds: ['L1'] }));
    await waitFor(() => expect(result.current.preview).not.toBeNull());
    act(() => result.current.toggle('a3'));
    expect(result.current.preview).toBeNull();
  });
});

describe('error copy (D97)', () => {
  const codes = ['ACCOUNTS_REQUIRED', 'NO_LEADS_SELECTED', 'PAUSE_FIRST', 'NOT_A_POOL', 'WORKSPACE_FEATURE_OFF', 'NO_USABLE_SENDER', 'SENDER_POOL_TOO_LARGE', 'ACCOUNT_SELECTION_CONFLICT', 'ACCOUNT_NOT_FOUND', 'LINKEDIN_ACCOUNT_NOT_READY'];
  it.each(codes)('%s has its own sentence', (code) => {
    const text = poolErrorText({ response: { data: { code } } });
    expect(text).not.toBe(campaignsStrings.errors.fallback);
    expect(text).not.toContain(code);
  });
  it('an unknown code with a readable server message shows that message; a bare code never shows', () => {
    expect(poolErrorText({ response: { data: { code: 'NEW_ONE', message: 'Something specific happened here.' } } })).toBe('Something specific happened here.');
    expect(poolErrorText({ response: { data: { code: 'NEW_ONE', message: 'NEW_ONE' } } })).toBe(campaignsStrings.errors.fallback);
  });
});

describe('SenderPoolDialog: ask who sends (one account or several)', () => {
  it('defaults to one account, the acting one, and creates straight away with just that account', async () => {
    const onConfirm = vi.fn();
    render(<SenderPoolDialog open onClose={() => {}} askWho allowTypeChoice={false} defaultType="message" actingAccountId="a2" pool={makePool({ selected: [] })} leadCount={3} onConfirm={onConfirm} />);
    expect(screen.queryByRole('button', { name: campaignsStrings.pool.previewButton })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: campaignsStrings.pool.create }));
    expect(onConfirm).toHaveBeenCalledWith({ accountIds: ['a2'], type: 'message' });
  });

  it('several accounts needs the preview before it can create, then sends the ticked accounts', async () => {
    const onConfirm = vi.fn();
    const { rerender } = render(<SenderPoolDialog open onClose={() => {}} askWho allowTypeChoice={false} defaultType="connect" pool={makePool()} leadCount={3} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('radio', { name: campaignsStrings.pool.whoSeveral }));
    expect(screen.getByRole('button', { name: campaignsStrings.pool.create })).toBeDisabled();
    const preview = { total: 2, perAccount: [], refused: [] };
    rerender(<SenderPoolDialog open onClose={() => {}} askWho allowTypeChoice={false} defaultType="connect" pool={makePool({ preview })} leadCount={3} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: campaignsStrings.pool.create }));
    expect(onConfirm).toHaveBeenCalledWith({ accountIds: ['a1', 'a2'], type: 'connect' });
  });

  it('needs selected leads even for one account', () => {
    render(<SenderPoolDialog open onClose={() => {}} askWho allowTypeChoice={false} pool={makePool({ selected: [] })} leadCount={0} onConfirm={() => {}} />);
    expect(screen.getByRole('button', { name: campaignsStrings.pool.create })).toBeDisabled();
  });
});
