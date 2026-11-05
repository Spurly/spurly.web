import { describe, it, expect } from 'vitest';
import {
  addNode, moveNodeTo, moveBlocker, insertBlocker, treeError, branchLabels, heightOf, listDepth, listOf, MAX_DEPTH, MAX_NODES,
} from 'src/products/sequences/treeModel.js';
import { layoutTree, edgeGeometry, plusPoint, slotKey, fitTransform, zoomAt, clampView, revealTransform, nearestSlot, MIN_ZOOM, MAX_ZOOM, NODE_W, H_GAP } from 'src/products/sequences/treeLayout.js';

const act = (id, extra = {}) => ({ id, type: 'follow', config: {}, delayDays: 0, ...extra });
const cond = (id, extra = {}) => ({ id, type: 'condition', config: { op: 'all', checks: [{ check: 'is_connected', params: {} }] }, delayDays: 0, ...extra });
const ids = (steps, parentId = null, branch = null) => listOf(steps, parentId, branch).map((n) => n.id);

/** a, then c1 forking into yes: [b, c2(yes: [d], no: [])] and no: [e] */
const sample = [
  act('a'),
  cond('c1'),
  act('b', { parentId: 'c1', branch: 'yes' }),
  cond('c2', { parentId: 'c1', branch: 'yes' }),
  act('d', { parentId: 'c2', branch: 'yes' }),
  act('e', { parentId: 'c1', branch: 'no' }),
];

describe('layoutTree', () => {
  it('draws Start, one node per step and a Stop under every list that does not end in a branching node', () => {
    const { nodes } = layoutTree(sample);
    expect(nodes.filter((n) => n.kind === 'start')).toHaveLength(1);
    expect(nodes.filter((n) => n.kind === 'step').map((n) => n.key).sort()).toEqual(['a', 'b', 'c1', 'c2', 'd', 'e']);
    // lists: c1/yes ends in c2 (branching, no stop), c2/yes -> stop, c2/no (empty) -> stop, c1/no -> stop
    expect(nodes.filter((n) => n.kind === 'stop').map((n) => n.key).sort()).toEqual(['stop:c1:no', 'stop:c2:no', 'stop:c2:yes']);
  });

  it('gives an empty sequence just Start -> Stop', () => {
    const { nodes, edges } = layoutTree([]);
    expect(nodes.map((n) => n.kind)).toEqual(['start', 'stop']);
    expect(edges).toHaveLength(1);
    expect(edges[0].slot).toEqual({ parentId: null, branch: null, index: 0 });
  });

  it('never overlaps two nodes, and pins Start (and so the first column) at x = 0 however the tree forks', () => {
    const { nodes, minX, maxX } = layoutTree(sample);
    const start = nodes.find((n) => n.kind === 'start');
    expect(start.x + start.w / 2).toBe(0);
    expect(nodes.find((n) => n.key === 'a').x + NODE_W / 2).toBe(0);
    for (const n of nodes) { expect(n.x).toBeGreaterThanOrEqual(minX); expect(n.x + n.w).toBeLessThanOrEqual(maxX); }
    const bare = layoutTree([act('a')]).nodes.find((n) => n.key === 'a');
    expect(bare.x + NODE_W / 2).toBe(0);
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap, `${a.key} overlaps ${b.key}`).toBe(false);
      }
    }
  });

  it('puts Yes to the left of No, with the forking node centred above them and a gap between the columns', () => {
    const { nodes } = layoutTree([cond('c'), act('y', { parentId: 'c', branch: 'yes' }), act('n', { parentId: 'c', branch: 'no' })]);
    const by = Object.fromEntries(nodes.map((n) => [n.key, n]));
    expect(by.y.x + by.y.w + H_GAP).toBeLessThanOrEqual(by.n.x);
    expect(by.c.x + by.c.w / 2).toBeCloseTo(((by.y.x + by.y.w / 2) + (by.n.x + by.n.w / 2)) / 2);
    expect(by.c.w).toBe(NODE_W);
  });

  it('labels each branch edge, and every edge knows the slot it leads into', () => {
    const { edges } = layoutTree([{ id: 'w', type: 'wait_for', config: { event: 'accepted', maxDays: 3 }, delayDays: 0 }]);
    const labelled = edges.filter((e) => e.label);
    expect(labelled.map((e) => e.label.text)).toEqual(['Accepted', 'Not accepted']);
    expect(labelled.map((e) => e.slot)).toEqual([
      { parentId: 'w', branch: 'yes', index: 0 },
      { parentId: 'w', branch: 'no', index: 0 },
    ]);
    expect(new Set(edges.map((e) => slotKey(e.slot))).size).toBe(edges.length);
  });

  it('routes a straight edge as a line and a fork as a rounded elbow ending on the child', () => {
    const { edges } = layoutTree([cond('c'), act('y', { parentId: 'c', branch: 'yes' })]);
    const straight = edges.find((e) => e.from.key === 'start');
    expect(edgeGeometry(straight).d).toMatch(/^M [\d.]+ [\d.]+ V [\d.]+$/);
    const fork = edges.find((e) => e.to.key === 'y');
    const g = edgeGeometry(fork);
    expect(g.d).toContain('Q');
    expect(g.d.endsWith(`V ${fork.to.y}`)).toBe(true);
    expect(plusPoint(fork).y).toBeLessThan(fork.to.y);
    expect(Number.isFinite(g.label.x) && Number.isFinite(g.label.y)).toBe(true);
  });
});

describe('moveNodeTo', () => {
  it('reorders inside one list, counting the index in the list as it is now', () => {
    const steps = [act('a'), act('b'), act('c')];
    expect(ids(moveNodeTo(steps, 'a', { index: 3 }))).toEqual(['b', 'c', 'a']);
    expect(ids(moveNodeTo(steps, 'c', { index: 0 }))).toEqual(['c', 'a', 'b']);
    expect(ids(moveNodeTo(steps, 'a', { index: 2 }))).toEqual(['b', 'a', 'c']);
  });

  it('refuses a move that changes nothing', () => {
    const steps = [act('a'), act('b')];
    expect(moveBlocker(steps, 'a', { index: 0 })).toBeTruthy();
    expect(moveBlocker(steps, 'a', { index: 1 })).toBeTruthy();
    expect(moveNodeTo(steps, 'a', { index: 1 })).toBe(steps);
  });

  it('moves a step into the other branch', () => {
    const next = moveNodeTo(sample, 'b', { parentId: 'c1', branch: 'no', index: 1 });
    expect(ids(next, 'c1', 'no')).toEqual(['e', 'b']);
    expect(ids(next, 'c1', 'yes')).toEqual(['c2']);
    expect(treeError(next)).toBeNull();
  });

  it('carries a whole branching node, and everything inside it, to a new place', () => {
    const next = moveNodeTo(sample, 'c2', { parentId: 'c1', branch: 'no', index: 1 });
    expect(ids(next, 'c1', 'no')).toEqual(['e', 'c2']);
    expect(ids(next, 'c2', 'yes')).toEqual(['d']);
    expect(next).toHaveLength(sample.length);
    expect(treeError(next)).toBeNull();
  });

  it('never drops a step inside itself', () => {
    expect(moveBlocker(sample, 'c1', { parentId: 'c2', branch: 'yes', index: 0 })).toMatch(/inside itself/);
    expect(moveBlocker(sample, 'c1', { parentId: 'c1', branch: 'no', index: 0 })).toMatch(/inside itself/);
  });

  it('never puts a step after a branching node, and never moves a branching node ahead of other steps', () => {
    expect(moveBlocker([act('a'), cond('c')], 'a', { index: 2 })).toMatch(/Nothing can follow/);
    expect(moveBlocker([act('a'), act('b'), cond('c')], 'c', { index: 0 })).toMatch(/Nothing can follow/);
  });

  it('respects the depth limit for the moved subtree', () => {
    let steps = [cond('c0')];
    for (let i = 1; i <= MAX_DEPTH; i += 1) steps.push(cond(`c${i}`, { parentId: `c${i - 1}`, branch: 'yes' }));
    expect(treeError(steps)).toBeNull();
    steps = [...steps, cond('loose')];
    expect(heightOf(steps, 'c0')).toBe(MAX_DEPTH);
    // moving the whole chain under 'loose' would sink it one level too deep
    expect(moveBlocker([...steps.filter((n) => n.id !== 'loose'), cond('loose', { parentId: 'c0', branch: 'no' })], 'c1', { parentId: 'loose', branch: 'yes', index: 0 })).toBeTruthy();
  });

  it('leaves the array untouched when the move is not allowed', () => {
    expect(moveNodeTo(sample, 'c1', { parentId: 'c2', branch: 'yes', index: 0 })).toBe(sample);
    expect(moveNodeTo(sample, 'nope', { index: 0 })).toBe(sample);
  });
});

describe('insertBlocker / addNode limits', () => {
  it('blocks the 41st step', () => {
    const many = Array.from({ length: MAX_NODES }, (_, i) => act(`n${i}`));
    expect(insertBlocker(many, { index: 0 }, 'follow')).toMatch(/at most 40/);
    expect(addNode(many, { index: 0 }, 'follow')).toBe(many);
  });

  it('blocks a branching node past the depth limit, including one that would push existing steps too deep', () => {
    // c0 > c1 > c2 > c3 > c4: the deepest legal chain (c4 sits 4 levels down)
    const chain = (n) => {
      const out = [cond('c0')];
      for (let i = 1; i <= n; i += 1) out.push(cond(`c${i}`, { parentId: `c${i - 1}`, branch: 'yes' }));
      return out;
    };
    const steps = chain(MAX_DEPTH);
    expect(treeError(steps)).toBeNull();
    expect(listDepth(steps, `c${MAX_DEPTH}`)).toBe(MAX_DEPTH + 1);
    expect(insertBlocker(steps, { parentId: `c${MAX_DEPTH}`, branch: 'yes', index: 0 }, 'follow')).toMatch(/nested at most/);
    const shallow = chain(MAX_DEPTH - 1);
    expect(insertBlocker(shallow, { parentId: `c${MAX_DEPTH - 1}`, branch: 'yes', index: 0 }, 'condition')).toMatch(/nested at most/);
    expect(insertBlocker(shallow, { parentId: `c${MAX_DEPTH - 1}`, branch: 'yes', index: 0 }, 'follow')).toBeNull();
    // inserting a condition above c1 of the full chain would take c1..c4 one level deeper
    expect(insertBlocker(steps, { parentId: 'c0', branch: 'yes', index: 0 }, 'condition')).toMatch(/nested at most/);
    // ...but is fine on the shorter chain
    expect(insertBlocker(shallow, { parentId: 'c0', branch: 'yes', index: 0 }, 'condition')).toBeNull();
  });

  it('a branching node inserted before other steps takes them into Yes (nothing is lost)', () => {
    const next = addNode([act('a'), act('b')], { index: 0 }, 'condition');
    expect(next).toHaveLength(3);
    const c = next.find((n) => n.type === 'condition');
    expect(ids(next, c.id, 'yes')).toEqual(['a', 'b']);
    expect(treeError(next)).toBeNull();
  });
});

describe('view maths', () => {
  const layout = layoutTree([act('a'), act('b')]);
  const size = { w: 1000, h: 700 };

  it('fits the flow, centred, and never zooms in past 1 or out past the minimum', () => {
    const v = fitTransform(layout, size);
    expect(v.k).toBe(1);
    expect((v.x + ((layout.minX + layout.maxX) / 2) * v.k)).toBeCloseTo(500);
    const tall = layoutTree(Array.from({ length: 12 }, (_, i) => act(`n${i}`)));
    const fitted = fitTransform(tall, size);
    expect(fitted.k).toBeLessThan(1);
    expect(fitted.k).toBeGreaterThanOrEqual(MIN_ZOOM);
    expect(fitTransform(layout, { w: 0, h: 0 })).toBeNull();
  });

  it('keeps the point under the cursor fixed while zooming, within the limits', () => {
    const view = { x: 120, y: 60, k: 1 };
    const point = { x: 400, y: 300 };
    const next = zoomAt(view, 1.5, point);
    expect(point.x - next.x).toBeCloseTo((point.x - view.x) * 1.5);
    expect(point.y - next.y).toBeCloseTo((point.y - view.y) * 1.5);
    expect(zoomAt(view, 100, point).k).toBe(MAX_ZOOM);
    expect(zoomAt(view, 0.0001, point).k).toBe(MIN_ZOOM);
  });

  it('never lets the flow be panned out of reach', () => {
    const far = clampView({ x: 99999, y: 99999, k: 1 }, layout, size);
    expect(far.x + layout.minX).toBeLessThanOrEqual(size.w - 120);
    expect(far.y).toBeLessThanOrEqual(size.h - 120);
    const gone = clampView({ x: -99999, y: -99999, k: 1 }, layout, size);
    expect(gone.x + layout.maxX).toBeGreaterThanOrEqual(120);
    expect(gone.y + layout.height).toBeGreaterThanOrEqual(120);
    const ok = { x: 10, y: 10, k: 1 };
    expect(clampView(ok, layout, size)).toBe(ok);
  });

  it('reveals an off-screen node with the least pan, and leaves a visible one alone', () => {
    const node = { x: 2000, y: 100, w: 252, h: 64 };
    const moved = revealTransform({ x: 0, y: 0, k: 1 }, node, size, { margin: 32, inset: 340 });
    expect(moved.x + node.x + node.w).toBeLessThanOrEqual(1000 - 340 - 32 + 0.001);
    const view = { x: 0, y: 0, k: 1 };
    expect(revealTransform(view, { x: 100, y: 100, w: 252, h: 64 }, size)).toBe(view);
  });

  it('picks the nearest slot inside the radius, else none', () => {
    const slots = [{ key: 'a', x: 0, y: 0 }, { key: 'b', x: 100, y: 0 }];
    expect(nearestSlot(slots, { x: 70, y: 0 })?.key).toBe('b');
    expect(nearestSlot(slots, { x: 500, y: 500 })).toBeNull();
  });
});

describe('branchLabels', () => {
  it('names the sides after what actually happens', () => {
    expect(branchLabels({ type: 'wait_for', config: { event: 'accepted' } }).no.text).toBe('Not accepted');
    expect(branchLabels({ type: 'wait_for', config: { event: 'replied' } }).yes.text).toBe('Replied');
    expect(branchLabels({ type: 'split', config: { ratio: 30 } })).toEqual({ yes: { text: 'A · 30%', tone: 'a' }, no: { text: 'B · 70%', tone: 'b' } });
    expect(branchLabels(cond('c')).yes.text).toBe('Connected');
    expect(branchLabels({ type: 'condition', config: { checks: [{ check: 'weekday' }, { check: 'replied' }] } })).toEqual({ yes: { text: 'Yes', tone: 'yes' }, no: { text: 'No', tone: 'no' } });
  });
});
