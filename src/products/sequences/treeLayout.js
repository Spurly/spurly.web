import { listOf, isBranching, branchLabels } from './treeModel.js';

/**
 * Turns the flat v2 `steps[]` into a drawn graph: where every node sits and which edges join them. Pure, no React.
 *
 * The server stores no positions (a sequence is a Yes/No tree, see the backend's tree.js), so the picture is worked
 * out from the tree every time: each list is a column of nodes, and a branching node ends its list and forks into a
 * Yes column and a No column side by side. Start and Stop are drawn only; they are not stored. A list that does not end
 * in a branching node gets a Stop under it, which is also where "add a step at the end" lives.
 *
 * Every edge carries the `slot` it leads into: the (parentId, branch, index) a new or dropped step would take.
 */

export const NODE_W = 252;
export const NODE_H = 64;
export const TERM_W = 116;
export const TERM_H = 44;
export const V_GAP = 88;
export const H_GAP = 56;
/** How far above the node the "+" on an edge sits. */
export const PLUS_OFFSET = 20;

function shift(part, dx) {
  if (!dx) return;
  for (const n of part.nodes) n.x += dx;
  part.cx += dx;
  part.minX += dx;
  part.maxX += dx;
}

/** Lay out one list (a column), and the branches under it if it ends in a branching node. Local coordinates, own column centred on 0. */
function layoutList(steps, parentId, branch, top, source, label) {
  const list = listOf(steps, parentId, branch);
  const nodes = [];
  const edges = [];
  let prev = source;
  let y = top;

  list.forEach((step, index) => {
    const node = { key: step.id, kind: 'step', step, x: -NODE_W / 2, y, w: NODE_W, h: NODE_H };
    edges.push({ key: `e:${prev.key}>${node.key}`, from: prev, to: node, slot: { parentId, branch, index }, label: index === 0 ? label : null });
    nodes.push(node);
    prev = node;
    y += NODE_H + V_GAP;
  });

  const last = list[list.length - 1];
  if (last && isBranching(last)) {
    const labels = branchLabels(last);
    const yes = layoutList(steps, last.id, 'yes', y, prev, { ...labels.yes, side: 'yes' });
    const no = layoutList(steps, last.id, 'no', y, prev, { ...labels.no, side: 'no' });
    shift(no, yes.maxX + H_GAP - no.minX);
    const cx = (yes.cx + no.cx) / 2;
    for (const n of nodes) n.x += cx;
    return {
      nodes: [...nodes, ...yes.nodes, ...no.nodes],
      edges: [...edges, ...yes.edges, ...no.edges],
      cx,
      minX: Math.min(cx - NODE_W / 2, yes.minX),
      maxX: Math.max(cx + NODE_W / 2, no.maxX),
    };
  }

  const stop = { key: `stop:${parentId || 'root'}:${branch || ''}`, kind: 'stop', x: -TERM_W / 2, y, w: TERM_W, h: TERM_H };
  edges.push({ key: `e:${prev.key}>${stop.key}`, from: prev, to: stop, slot: { parentId, branch, index: list.length }, label: list.length === 0 ? label : null, toStop: true });
  nodes.push(stop);
  const half = Math.max(list.length ? NODE_W : 0, TERM_W) / 2;
  return { nodes, edges, cx: 0, minX: -half, maxX: half };
}

/** @returns {{ nodes: Array, edges: Array, minX: number, maxX: number, width: number, height: number }} in canvas pixels. Start is pinned at x = 0 (centre) and y = 0, so the top of the flow does not move when branches are added below it. */
export function layoutTree(steps) {
  const start = { key: 'start', kind: 'start', x: 0, y: 0, w: TERM_W, h: TERM_H };
  const body = layoutList(steps || [], null, null, TERM_H + V_GAP, start, null);
  const nodes = [start, ...body.nodes];
  const edges = body.edges;
  // The first column's centre is x = 0, and Start is directly above it, so adding a fork below never moves the top of the flow.
  for (const n of body.nodes) n.x -= body.cx;
  start.x = -TERM_W / 2;
  const minX = Math.min(...nodes.map((n) => n.x));
  const maxX = Math.max(...nodes.map((n) => n.x + n.w));
  const maxY = Math.max(...nodes.map((n) => n.y + n.h));
  return { nodes, edges, minX, maxX, width: maxX - minX, height: maxY };
}

export const centerX = (n) => n.x + n.w / 2;

/** Where the "+" for an edge sits (on its last vertical stretch, just above the node it leads into). */
export const plusPoint = (edge) => ({ x: centerX(edge.to), y: edge.to.y - PLUS_OFFSET });

/** SVG path for an edge: straight down when the child is under the parent, otherwise down, across and down with rounded corners. Plus the middle of the horizontal stretch, where the branch label goes. */
export function edgeGeometry(edge) {
  const fx = centerX(edge.from);
  const fy = edge.from.y + edge.from.h;
  const tx = centerX(edge.to);
  const ty = edge.to.y;
  if (Math.abs(tx - fx) < 0.5) return { d: `M ${fx} ${fy} V ${ty}`, label: { x: fx, y: (fy + ty) / 2 } };
  const midY = ty - V_GAP / 2;
  const dir = tx > fx ? 1 : -1;
  const r = Math.max(0, Math.min(14, Math.abs(tx - fx) / 2, midY - fy, ty - midY));
  const d = `M ${fx} ${fy} V ${midY - r} Q ${fx} ${midY} ${fx + dir * r} ${midY} H ${tx - dir * r} Q ${tx} ${midY} ${tx} ${midY + r} V ${ty}`;
  return { d, label: { x: (fx + tx) / 2, y: midY } };
}

/** The slot key used to match a drop target: two slots are the same place iff their keys are equal. */
export const slotKey = (slot) => `${slot.parentId || ''}/${slot.branch || ''}/${slot.index}`;

/* ---------------------------- view maths (pan / zoom) ---------------------------- */

export const MIN_ZOOM = 0.35;
export const MAX_ZOOM = 1.6;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const hasSize = (size) => size && size.w > 0 && size.h > 0;

/** A view is { x, y, k }: the screen position of canvas (0, 0) and the zoom. Screen = view.x + canvas.x * k. */
export const DEFAULT_VIEW = Object.freeze({ x: 0, y: 0, k: 1 });

/** The view that shows the whole flow: centred across, starting `pad` below the top, never zoomed in past 1. `inset` is space on the right that something else (the editor) covers. Null until the canvas has a size. */
export function fitTransform(layout, size, { pad = 40, inset = 0 } = {}) {
  if (!hasSize(size)) return null;
  const usableW = Math.max(1, size.w - inset);
  const k = clamp(Math.min((usableW - pad * 2) / layout.width, (size.h - pad * 2) / layout.height, 1), MIN_ZOOM, 1);
  return { k, x: usableW / 2 - ((layout.minX + layout.maxX) / 2) * k, y: pad };
}

/** Zoom by `factor` keeping the canvas point under `point` (screen px inside the viewport) where it is. */
export function zoomAt(view, factor, point) {
  const k = clamp(view.k * factor, MIN_ZOOM, MAX_ZOOM);
  const ratio = k / view.k;
  return { k, x: point.x - (point.x - view.x) * ratio, y: point.y - (point.y - view.y) * ratio };
}

/** Stops the flow being panned out of reach: at least `keep` px of it always stays on screen. */
export function clampView(view, layout, size, keep = 120) {
  if (!hasSize(size)) return view;
  const { k } = view;
  const x = clamp(view.x, keep - layout.maxX * k, size.w - keep - layout.minX * k);
  const y = clamp(view.y, keep - layout.height * k, size.h - keep);
  return x === view.x && y === view.y ? view : { k, x, y };
}

/** Pan the least needed so `node` is fully on screen (not under the editor at the right); the same view when it already is. */
export function revealTransform(view, node, size, { margin = 32, inset = 0 } = {}) {
  if (!hasSize(size)) return view;
  const usableW = Math.max(1, size.w - inset);
  const left = view.x + node.x * view.k;
  const right = left + node.w * view.k;
  const top = view.y + node.y * view.k;
  const bottom = top + node.h * view.k;
  let { x, y } = view;
  if (left < margin) x += margin - left;
  else if (right > usableW - margin) x -= right - (usableW - margin);
  if (top < margin) y += margin - top;
  else if (bottom > size.h - margin) y -= bottom - (size.h - margin);
  return x === view.x && y === view.y ? view : { ...view, x, y };
}

/** The slot (from `slots`: [{ key, slot, x, y }] in canvas px) nearest to a canvas point, if within `radius`. */
export function nearestSlot(slots, point, radius = 64) {
  let best = null;
  let bestD = radius;
  for (const s of slots) {
    const d = Math.hypot(s.x - point.x, s.y - point.y);
    if (d <= bestD) { best = s; bestD = d; }
  }
  return best;
}
