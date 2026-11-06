import { describe, it, expect } from 'vitest';
import {
  addNode, removeNode, updateNode, moveNode, canMove, treeError, listOf, makeNode, withIds, newNodeId,
  availableCheckGroups, availableEvents, nodeSummary, usesReply, isTreeSequence, MAX_NODES, descendantsOf,
} from 'src/products/sequences/treeModel.js';

const base = () => addNode(addNode([], {}, 'connect'), {}, 'message');
const ids = (steps) => steps.map((s) => s.id);

describe('addNode / removeNode / updateNode', () => {
  it('builds a linear tree with unique ids', () => {
    const steps = base();
    expect(ids(steps)).toEqual(['s1', 's2']);
    expect(steps.every((s) => !s.parentId)).toBe(true);
  });
  it('a condition added before other steps takes them into its Yes branch', () => {
    const steps = addNode(base(), { index: 1 }, 'condition'); // connect, condition, [message -> yes]
    expect(steps.map((s) => [s.type, s.parentId, s.branch])).toEqual([
      ['connect', undefined, undefined], ['condition', undefined, undefined], ['message', 's3', 'yes'],
    ]);
    expect(treeError(steps.map((s) => (s.type === 'message' ? { ...s, config: { text: 'hi' } } : s)))).toBeNull();
  });
  it('adds into a named branch and keeps preorder (parent before children)', () => {
    let steps = addNode([], {}, 'condition'); // s1
    steps = addNode(steps, { parentId: 's1', branch: 'no' }, 'follow');
    steps = addNode(steps, { parentId: 's1', branch: 'yes' }, 'message');
    expect(steps.map((s) => [s.id, s.parentId, s.branch])).toEqual([['s1', undefined, undefined], ['s3', 's1', 'yes'], ['s2', 's1', 'no']]);
  });
  it('removing a branching node removes its whole subtree', () => {
    let steps = addNode([], {}, 'condition');
    steps = addNode(steps, { parentId: 's1', branch: 'yes' }, 'follow');
    steps = addNode(steps, { parentId: 's1', branch: 'no' }, 'follow');
    expect(descendantsOf(steps, 's1')).toHaveLength(2);
    expect(removeNode(steps, 's1')).toEqual([]);
    expect(ids(removeNode(steps, 's2'))).toEqual(['s1', 's3']);
  });
  it('updateNode keeps the id and the place in the tree', () => {
    let steps = addNode([], {}, 'condition');
    steps = addNode(steps, { parentId: 's1', branch: 'yes' }, 'message');
    const next = updateNode(steps, 's2', { type: 'message', config: { text: 'x' }, delayDays: 2 });
    expect(next[1]).toMatchObject({ id: 's2', parentId: 's1', branch: 'yes', delayDays: 2 });
  });
  it('ids never collide after a removal', () => {
    let steps = base();
    steps = removeNode(steps, 's1');
    expect(newNodeId(steps)).toBe('s1');
    expect(withIds([{ type: 'follow' }, { id: 's1', type: 'follow' }]).map((s) => s.id)).toEqual(['s2', 's1']);
  });
});

describe('moving', () => {
  it('moves within a list and refuses to put a branching node before another step', () => {
    let steps = addNode(addNode([], {}, 'follow'), {}, 'follow'); // s1 s2
    expect(ids(moveNode(steps, 's2', -1))).toEqual(['s2', 's1']);
    steps = addNode(steps, {}, 'split'); // s1 s2 s3(split)
    expect(canMove(steps, 's3', -1)).toBe(false);
    expect(canMove(steps, 's2', 1)).toBe(false);
    expect(canMove(steps, 's1', 1)).toBe(true);
    expect(moveNode(steps, 's3', -1)).toBe(steps);
  });
});

describe('treeError mirrors the server', () => {
  const msg = (text = 'hi') => ({ id: 'm', type: 'message', config: { text }, delayDays: 0 });
  it('accepts a valid yes/no tree', () => {
    const steps = [
      { id: 'c', type: 'connect', config: { note: '' } },
      { id: 'w', type: 'wait_for', config: { event: 'accepted', maxDays: 3 } },
      { ...msg(), parentId: 'w', branch: 'yes' },
      { id: 'f', type: 'follow', config: {}, parentId: 'w', branch: 'no' },
    ];
    expect(treeError(steps)).toBeNull();
  });
  it('refuses empty, 41 nodes, depth 5, steps after a branching node, a missing parent', () => {
    expect(treeError([])).toMatch(/at least one/);
    const many = Array.from({ length: MAX_NODES + 1 }, (_, i) => ({ id: `n${i}`, type: 'follow', config: {} }));
    expect(treeError(many)).toMatch(/at most 40/);
    const chain = [{ id: 'c0', type: 'condition', config: { op: 'all', checks: [{ check: 'is_connected', params: {} }] } }];
    for (let i = 1; i <= 5; i += 1) chain.push({ id: `c${i}`, type: 'condition', config: chain[0].config, parentId: `c${i - 1}`, branch: 'yes' });
    chain.push({ id: 'leaf', type: 'follow', config: {}, parentId: 'c5', branch: 'yes' });
    expect(treeError(chain)).toMatch(/nested at most 4/);
    expect(treeError([{ id: 'c', type: 'condition', config: chain[0].config }, { id: 'x', type: 'follow', config: {} }])).toMatch(/Nothing can follow/);
    expect(treeError([{ id: 'x', type: 'follow', config: {}, parentId: 'ghost', branch: 'yes' }])).toMatch(/does not exist/);
  });
  it('validates each node and names the step', () => {
    expect(treeError([{ id: 'a', type: 'follow', config: {} }, msg('')])).toMatch(/^Step 2: Message text is required/);
    expect(treeError([{ id: 'w', type: 'wait_for', config: { event: 'accepted', maxDays: 0 } }])).toMatch(/1 to 90/);
    expect(treeError([{ id: 's', type: 'split', config: { ratio: 100 } }])).toMatch(/1 to 99/);
    expect(treeError([{ id: 'c', type: 'condition', config: { op: 'all', checks: [] } }])).toMatch(/at least one check/);
    expect(treeError([{ id: 'c', type: 'condition', config: { op: 'all', checks: [{ check: 'step_result', params: { stepId: 'ghost', result: 'done' } }] } }])).toMatch(/no longer exists/);
  });
  it('rejects reply checks and reply waits in an inbox-off org', () => {
    const reply = [{ id: 'c', type: 'condition', config: { op: 'all', checks: [{ check: 'replied', params: {} }] } }];
    expect(treeError(reply, { inbox: true })).toBeNull();
    expect(treeError(reply, { inbox: false })).toMatch(/not available/);
    const wait = [{ id: 'w', type: 'wait_for', config: { event: 'replied', maxDays: 2 } }];
    expect(treeError(wait, { inbox: false })).toMatch(/not available/);
  });
});

describe('picker per org', () => {
  it('hides the Reply group and the reply event when the inbox is off', () => {
    expect(availableCheckGroups({ inbox: true }).map((g) => g.id)).toEqual(['connection', 'profile', 'reply', 'result', 'sender', 'activity', 'time']);
    expect(availableCheckGroups({ inbox: false }).map((g) => g.id)).toEqual(['connection', 'profile', 'result', 'sender', 'activity', 'time']);
    expect(availableEvents({ inbox: false }).map((e) => e.value)).toEqual(['accepted']);
    expect(availableEvents().map((e) => e.value)).toEqual(['accepted', 'replied']);
  });
});

describe('helpers', () => {
  it('summaries, usesReply, isTreeSequence, makeNode defaults are independent copies', () => {
    expect(nodeSummary({ type: 'split', config: { ratio: 30 } })).toBe('30% Yes / 70% No');
    expect(nodeSummary({ type: 'wait_for', config: { event: 'accepted', maxDays: 3 } })).toMatch(/Waits for acceptance, up to 3 day/);
    expect(nodeSummary({ type: 'condition', config: { op: 'any', checks: [{ check: 'is_connected', params: {} }, { check: 'invitation_pending', params: {} }] } })).toBe('If is connected (1st degree) or invitation is pending');
    expect(usesReply([{ type: 'condition', config: { checks: [{ check: 'replied' }] } }])).toBe(true);
    expect(usesReply([{ type: 'follow', config: {} }])).toBe(false);
    expect(isTreeSequence({ schemaVersion: 2 })).toBe(true);
    expect(isTreeSequence({})).toBe(false);
    const a = makeNode('condition', []);
    a.config.checks[0].check = 'changed';
    expect(makeNode('condition', []).config.checks[0].check).toBe('is_connected');
    expect(listOf([{ id: 'a' }], null, null)).toHaveLength(1);
  });
});

import { availableExitRules, cleanExit, exitError } from 'src/products/sequences/treeModel.js';

describe('P4 web model: profile checks and exit rules', () => {
  it('profile_field is validated like the server', () => {
    const mk = (params) => [{ id: 'c', type: 'condition', config: { op: 'all', checks: [{ check: 'profile_field', params }] } }];
    expect(treeError(mk({ field: 'title', match: 'contains', value: 'vp' }))).toBeNull();
    expect(treeError(mk({ field: 'email', match: 'contains', value: 'vp' }))).toMatch(/profile field/);
    expect(treeError(mk({ field: 'title', match: 'contains', value: ' ' }))).toMatch(/text to match/);
    expect(nodeSummary(mk({ field: 'title', match: 'equals', value: 'CEO' })[0])).toBe('If title equals “CEO”');
  });
  it('limit_reached (P5.5) is validated and summarised', () => {
    const mk = (params) => [{ id: 'c', type: 'condition', config: { op: 'all', checks: [{ check: 'limit_reached', params }] } }];
    expect(treeError(mk({ action: 'connect', window: 'weekly' }))).toBeNull();
    expect(treeError(mk({ action: 'follow', window: 'daily' }))).toMatch(/connection requests or messages/);
    expect(treeError(mk({ action: 'message', window: 'hourly' }))).toMatch(/today or this week/);
    expect(nodeSummary(mk({ action: 'message', window: 'daily' })[0])).toBe('If message limit reached today');
  });
  it('check_recent_posts + lead_has_recent_posts (P5.6)', () => {
    const cond = { id: 'c', type: 'condition', config: { op: 'all', checks: [{ check: 'lead_has_recent_posts', params: {} }] } };
    const check = { id: 'k', type: 'check_recent_posts', config: { withinDays: 30 } };
    expect(treeError([cond])).toMatch(/Check recent posts/);
    expect(treeError([check, cond])).toBeNull();
    expect(treeError([{ ...check, config: { withinDays: 0 } }])).toMatch(/1 to 365/);
    expect(nodeSummary(cond)).toBe('If has posted recently');
  });
  it('exit rules: reply hidden without the inbox, org-only rule hidden for solo and partner-managed, clean drops empties', () => {
    expect(availableExitRules({ inbox: true, isOrg: true }).map((r) => r.key)).toEqual(['onReply', 'onAccepted', 'onOtherAccount']);
    // Partner-managed org (inbox off): reply rule and the "another account" rule are both hidden.
    expect(availableExitRules({ inbox: false, isOrg: true }).map((r) => r.key)).toEqual(['onAccepted']);
    expect(availableExitRules({ inbox: true, isOrg: false }).map((r) => r.key)).toEqual(['onReply', 'onAccepted']);
    expect(cleanExit({})).toBeUndefined();
    expect(cleanExit({ onReply: false, maxDays: 30, junk: 1 })).toEqual({ onReply: false, maxDays: 30 });
    expect(exitError({ maxDays: 0 })).toMatch(/1 to 365/);
    expect(exitError({})).toBeNull();
  });
});
