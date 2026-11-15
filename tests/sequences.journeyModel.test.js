import { describe, it, expect } from 'vitest';
import { senderChoices, nodeSummary, bubblesFor, hiddenAt, attentionFor, hasMovers, initialsOf, dueText, statusWord } from 'src/products/sequences/journeyModel.js';

const lead = (id, status, acc = null) => ({ id, status, ...(acc ? { sender: { orgAccountId: acc, name: acc.toUpperCase() } } : {}) });
const node = {
  here: { active: 3, waiting: 2, failed: 1 },
  bySender: { a: { active: 2, waiting: 1, failed: 0 }, b: { active: 1, waiting: 1, failed: 1 } },
  passed: { done: 7, skipped: 1 },
  leads: [lead('1', 'active', 'a'), lead('2', 'failed', 'b'), lead('3', 'waiting', 'a'), lead('4', 'active', 'b')],
};

describe('nodeSummary', () => {
  it('counts everyone, or only one sender, and keeps passed unsplit', () => {
    expect(nodeSummary(node)).toMatchObject({ active: 3, waiting: 2, failed: 1, here: 6, passed: { done: 7, skipped: 1 } });
    expect(nodeSummary(node, 'a')).toMatchObject({ active: 2, waiting: 1, failed: 0, here: 3 });
    expect(nodeSummary(node, 'zzz').here).toBe(0);
    expect(nodeSummary(undefined).here).toBe(0);
  });
});

describe('bubblesFor / hiddenAt', () => {
  it('puts trouble first, then waiting, then moving', () => {
    expect(bubblesFor(node).map((l) => l.id)).toEqual(['2', '3', '1', '4']);
  });
  it('applies the sender filter', () => {
    expect(bubblesFor(node, 'a').map((l) => l.id)).toEqual(['3', '1']);
  });
  it('reports the leads that are here but not drawn', () => {
    expect(hiddenAt(node)).toBe(2); // 6 here, 4 drawn
    expect(hiddenAt(node, 'a')).toBe(1); // 3 here for a, 2 drawn
  });
});

describe('senderChoices', () => {
  it('uses the pool senders first, then any account seen on a bubble or in a count', () => {
    const flow = { senders: [{ accountId: 'a', name: 'Priya', state: 'active' }], nodes: { s1: { leads: [lead('9', 'active', 'c')], bySender: { d: {} } } } };
    expect(senderChoices(flow).map((s) => s.id)).toEqual(['a', 'c', 'd']);
    expect(senderChoices(flow)[0]).toEqual({ id: 'a', name: 'Priya', state: 'active' });
  });
  it('is empty for a solo sequence', () => {
    expect(senderChoices({ nodes: { s1: { leads: [lead('1', 'active')], bySender: {} } } })).toEqual([]);
    expect(senderChoices(null)).toEqual([]);
  });
});

describe('attentionFor', () => {
  const flow = { attention: [{ kind: 'failed' }, { kind: 'paused' }, { kind: 'paced', sender: { orgAccountId: 'a' } }, { kind: 'paced', sender: { orgAccountId: 'b' } }] };
  it('keeps everything with no filter', () => expect(attentionFor(flow)).toHaveLength(4));
  it('narrows paced items to the selected account but keeps failures and pauses', () => {
    expect(attentionFor(flow, 'a').map((x) => x.kind)).toEqual(['failed', 'paused', 'paced']);
  });
});

describe('small helpers', () => {
  it('hasMovers is true only while someone is active or waiting', () => {
    expect(hasMovers({ nodes: { s1: { here: { active: 0, waiting: 0, failed: 2 } } } })).toBe(false);
    expect(hasMovers({ nodes: { s1: { here: { active: 0, waiting: 1, failed: 0 } } } })).toBe(true);
    expect(hasMovers(null)).toBe(false);
  });
  it('initialsOf takes the first and last word', () => {
    expect(initialsOf('Amara Osei')).toBe('AO');
    expect(initialsOf('Cher')).toBe('C');
    expect(initialsOf('')).toBe('?');
  });
  it('dueText words past and future', () => {
    const now = new Date('2026-11-15T10:00:00Z');
    expect(dueText('2026-11-15T10:05:00Z', now)).toBe('in 5 min');
    expect(dueText('2026-11-15T07:30:00Z', now)).toBe('2 h 30 min ago');
    expect(dueText('2026-11-17T10:00:00Z', now)).toBe('in 2 d');
    expect(dueText(null, now)).toBe('');
  });
  it('statusWord names a held lead', () => {
    expect(statusWord({ status: 'waiting', waitReason: 'awaiting-acceptance' })).toBe('held until accepted');
    expect(statusWord({ status: 'active' })).toBe('moving');
  });
});

import { splitLetter, splitBranches, stepsOnBranch, matchesStatus, stepRows } from 'src/products/sequences/journeyModel.js';

describe('branch and status helpers', () => {
  const steps = [
    { id: 'sp', type: 'split' },
    { id: 'a1', type: 'like', parentId: 'sp', branch: 'a' },
    { id: 'b1', type: 'comment', parentId: 'sp', branch: 'b' },
    { id: 'b2', type: 'wait', parentId: 'b1', branch: 'yes' },
  ];
  it('lists split branches and the steps inside each', () => {
    expect(splitBranches(steps)).toEqual(['a', 'b']);
    expect(['yes', 'no', 'a'].map(splitLetter)).toEqual(['A', 'B', 'A']);
    expect([...stepsOnBranch(steps, 'a')]).toEqual(['a1']);
    expect(stepsOnBranch(steps, 'b').has('b2')).toBe(true);
    expect(splitBranches([{ id: 'x', type: 'message' }])).toEqual([]);
  });
  it('filters by status and builds per-step rows', () => {
    expect(matchesStatus({ status: 'failed' }, '')).toBe(true);
    expect(matchesStatus({ status: 'failed' }, 'waiting')).toBe(false);
    const rows = stepRows(steps, { nodes: { a1: { here: { active: 1, waiting: 0, failed: 2 }, passed: { done: 5, skipped: 1 } } } });
    expect(rows.find((r) => r.id === 'a1')).toMatchObject({ entered: 9, passed: 5, here: 3, failed: 2 });
    expect(rows.find((r) => r.id === 'b1').entered).toBe(0);
    expect(rows.find((r) => r.id === 'b2').branch).toBe('Y');
    expect(rows.find((r) => r.id === 'a1').branch).toBe('A');
  });
});

import { waitReasonWords } from 'src/products/sequences/journeyModel.js';
describe('waitReasonWords', () => {
  it('words stored reasons', () => {
    expect(waitReasonWords('')).toBe('');
    expect(waitReasonWords('awaiting-acceptance')).toMatch(/held/);
    expect(waitReasonWords('paced:daily-cap')).toBe('Paced: the daily limit was reached');
    expect(waitReasonWords('paced:new-thing')).toBe('Paced: new thing');
  });
});

describe('split order', () => {
  it('puts yes (A) before no (B)', () => {
    expect(splitBranches([{ id: 'sp', type: 'split' }, { id: 'x', type: 'like', parentId: 'sp', branch: 'no' }, { id: 'y', type: 'like', parentId: 'sp', branch: 'yes' }])).toEqual(['yes', 'no']);
  });
});

import { messageAfterConnectLints } from 'src/products/sequences/journeyModel.js';
import { insertAcceptanceWait } from 'src/products/sequences/treeModel.js';

describe('message right after a connection request', () => {
  const base = [
    { id: 'sp', type: 'split', config: {}, delayDays: 0 },
    { id: 'c1', type: 'connect', config: {}, delayDays: 0, parentId: 'sp', branch: 'yes' },
    { id: 'm1', type: 'message', config: { text: 'hi' }, delayDays: 0, parentId: 'sp', branch: 'yes' },
    { id: 'c2', type: 'connect', config: {}, delayDays: 0, parentId: 'sp', branch: 'no' },
    { id: 'w2', type: 'wait', config: { mode: 'until-accepted', maxDays: 7 }, delayDays: 0, parentId: 'sp', branch: 'no' },
    { id: 'm2', type: 'message', config: { text: 'hi' }, delayDays: 0, parentId: 'sp', branch: 'no' },
  ];
  it('flags a message with nothing between it and the connect, and not one that waits', () => {
    expect(messageAfterConnectLints(base)).toEqual([{ stepId: 'm1', parentId: 'sp', branch: 'yes', index: 1 }]);
  });
  it('inserts the wait before the message in that branch only, changing nothing else', () => {
    const next = insertAcceptanceWait(base, { parentId: 'sp', branch: 'yes', index: 1 });
    expect(next).toHaveLength(base.length + 1);
    const added = next.find((s) => !base.some((b) => b.id === s.id));
    expect(added).toMatchObject({ type: 'wait', parentId: 'sp', branch: 'yes', config: { mode: 'until-accepted', maxDays: 7 } });
    for (const s of base) expect(next.find((n) => n.id === s.id)).toEqual(s);
    const order = next.filter((s) => s.parentId === 'sp' && s.branch === 'yes').map((s) => s.type);
    expect(order).toEqual(['connect', 'wait', 'message']);
    expect(messageAfterConnectLints(next)).toEqual([]);
  });
  it('inserts the wait the person chose (a fixed number of days)', () => {
    const next = insertAcceptanceWait(base, { parentId: 'sp', branch: 'yes', index: 1 }, { mode: 'fixed', days: 3 });
    expect(next.find((s) => !base.some((b) => b.id === s.id)).config).toEqual({ mode: 'fixed', days: 3 });
  });
});
