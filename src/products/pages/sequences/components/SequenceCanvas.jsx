import { useState, useRef, useMemo, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Minus, Maximize, Undo2, Redo2 } from 'lucide-react';
import { IconButton } from 'src/core/primitives';
import { STEP_TYPE_MAP } from 'src/products/sequences/stepTypes.js';
import { moveBlocker, MAX_NODES } from 'src/products/sequences/treeModel.js';
import {
  layoutTree, edgeGeometry, plusPoint, slotKey, fitTransform, zoomAt, clampView, revealTransform, nearestSlot,
  DEFAULT_VIEW, MIN_ZOOM, MAX_ZOOM,
} from 'src/products/sequences/treeLayout.js';
import { StepNode, TerminalNode, BranchPill } from './CanvasNodes.jsx';
import { StepPicker } from './StepPicker.jsx';
import { tileClass } from './nodeStyle.js';

/**
 * The sequence canvas: the flow drawn top to bottom, pannable and zoomable.
 *
 * - Drag the background (or scroll) to pan. Ctrl/⌘ + scroll or pinch zooms at the cursor. The toolbar and the keys
 *   + − 0 zoom and fit. The flow can never be panned out of reach.
 * - A "+" on every connector opens the step picker for that exact spot. The blue "+" above a Stop adds to the end.
 * - Drag a step onto any "+" to move it, with everything inside it, even into another branch. Only spots that keep the
 *   tree valid light up; dropping anywhere else, or pressing Esc, cancels.
 * - Pointer events, not the HTML5 drag API: that one has no touch support and misreports positions under a CSS transform.
 *
 * It draws and reports gestures; it never edits the steps itself (onAdd / onMove / onRemove / onSelect).
 */

const DRAG_THRESHOLD = 4;
const PAN_THRESHOLD = 3;
const STEP_ZOOM = 1.2;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const isTyping = (el) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(el?.tagName) || el?.isContentEditable;

export function SequenceCanvas({
  steps, readOnly = false, selectedId = null, onSelect, onAdd, onMove, onRemove, errors = {}, branchCounts = null, rightInset = 0, history = null,
}) {
  const layout = useMemo(() => layoutTree(steps), [steps]);
  const viewportRef = useRef(null);
  const [view, setView] = useState(DEFAULT_VIEW);
  const [panning, setPanning] = useState(false);
  const [drag, setDrag] = useState(null); // { id, x, y, valid: Set<slotKey>, hover: slotKey | null }
  const [picker, setPicker] = useState(null); // { slot, anchor }

  // The newest props and view, for handlers that outlive a render (window listeners, wheel).
  const latest = useRef({});
  useEffect(() => { latest.current = { steps, layout, view, readOnly, selectedId, onSelect, onAdd, onMove, onRemove, rightInset, history }; });
  const touched = useRef(false); // the user has moved the view: stop auto-fitting
  const dragRef = useRef(null);
  const justDragged = useRef(false);

  const size = useCallback(() => {
    const r = viewportRef.current?.getBoundingClientRect();
    return r ? { w: r.width, h: r.height } : { w: 0, h: 0 };
  }, []);

  const commit = useCallback((next) => {
    setView((cur) => {
      const value = typeof next === 'function' ? next(cur) : next;
      return clampView(value, latest.current.layout ?? layout, size());
    });
  }, [layout, size]);

  const fit = useCallback(() => {
    const next = fitTransform(latest.current.layout ?? layout, size(), { inset: latest.current.rightInset ?? 0 });
    if (next) setView(next);
  }, [layout, size]);

  // Fit once the canvas has a size, and again if the window resizes before the user has taken over.
  useLayoutEffect(() => {
    fit();
    const el = viewportRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => { if (!touched.current) fit(); });
    ro.observe(el);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scrolling pans; Ctrl/⌘ + scroll (and trackpad pinch, which arrives as ctrl+wheel) zooms at the cursor.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      touched.current = true;
      setPicker(null);
      const unit = e.deltaMode === 1 ? 16 : 1;
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect();
        const dy = clamp(e.deltaY * unit, -40, 40);
        commit((v) => zoomAt(v, Math.exp(-dy * 0.012), { x: e.clientX - r.left, y: e.clientY - r.top }));
      } else {
        commit((v) => ({ ...v, x: v.x - e.deltaX * unit, y: v.y - e.deltaY * unit }));
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [commit]);

  // Bring a newly selected step into view (clear of the editor panel) instead of leaving it off screen.
  // Keyed on the node's position, not on `layout`: typing in the editor rebuilds the layout but must not move the view.
  const selNode = selectedId ? layout.nodes.find((n) => n.key === selectedId) : null;
  const selX = selNode?.x;
  const selY = selNode?.y;
  useEffect(() => {
    const node = latest.current.layout?.nodes.find((n) => n.key === selectedId);
    if (node) setView((cur) => revealTransform(cur, node, size(), { inset: rightInset }));
  }, [selectedId, selX, selY, rightInset, size]);

  const zoomBy = (factor) => {
    touched.current = true;
    const s = size();
    commit((v) => zoomAt(v, factor, { x: (s.w - rightInset) / 2, y: s.h / 2 }));
  };
  const refit = () => { touched.current = false; fit(); };

  /* ---- gestures ---- */

  const toCanvas = (clientX, clientY) => {
    const r = viewportRef.current.getBoundingClientRect();
    const v = latest.current.view;
    return { x: (clientX - r.left - v.x) / v.k, y: (clientY - r.top - v.y) / v.k };
  };

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    const el = viewportRef.current;
    // React bubbles events out of portals (the step picker), but a click in the picker is not a click on the canvas.
    if (!el.contains(e.target) || e.target.closest('[data-canvas-ui]')) return;
    const nodeEl = e.target.closest('[data-node-id]');
    if (nodeEl && (latest.current.readOnly || e.target.closest('button'))) return;
    const g = { kind: nodeEl ? 'node' : 'pan', id: nodeEl?.dataset.nodeId, start: { x: e.clientX, y: e.clientY }, origin: latest.current.view, moved: false, slots: null };

    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', key, true);
      dragRef.current = null;
      setPanning(false);
      setDrag(null);
    };
    const move = (ev) => {
      const dx = ev.clientX - g.start.x;
      const dy = ev.clientY - g.start.y;
      if (g.kind === 'pan') {
        if (!g.moved && Math.hypot(dx, dy) < PAN_THRESHOLD) return;
        g.moved = true;
        touched.current = true;
        setPanning(true);
        commit({ ...g.origin, x: g.origin.x + dx, y: g.origin.y + dy });
        return;
      }
      if (!g.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      if (!g.moved) {
        g.moved = true;
        touched.current = true;
        setPicker(null);
        const { steps: current, layout: lay } = latest.current;
        g.slots = lay.edges
          .filter((edge) => moveBlocker(current, g.id, edge.slot) === null)
          .map((edge) => ({ key: slotKey(edge.slot), slot: edge.slot, ...plusPoint(edge) }));
      }
      const hit = nearestSlot(g.slots, toCanvas(ev.clientX, ev.clientY));
      dragRef.current = hit;
      setDrag({ id: g.id, x: ev.clientX, y: ev.clientY, valid: g.slots, hover: hit?.key ?? null });
    };
    const up = () => {
      const hit = dragRef.current;
      const wasDrag = g.kind === 'node' && g.moved;
      if (g.kind === 'pan' && !g.moved) latest.current.onSelect?.(null);
      finish();
      if (wasDrag) {
        // The click that follows this pointerup must not also select the step.
        justDragged.current = true;
        setTimeout(() => { justDragged.current = false; }, 0);
        if (hit) latest.current.onMove?.(g.id, hit.slot);
      }
    };
    const cancel = () => finish();
    const key = (ev) => {
      if (ev.key !== 'Escape') return;
      ev.stopPropagation();
      if (g.kind === 'node' && g.moved) { justDragged.current = true; setTimeout(() => { justDragged.current = false; }, 0); }
      finish();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', key, true);
  };

  const activate = (id) => { if (!justDragged.current) onSelect?.(id); };

  const onKeyDown = (e) => {
    if (!e.currentTarget.contains(e.target) || isTyping(e.target)) return;
    const mod = e.metaKey || e.ctrlKey;
    const k = e.key.toLowerCase();
    if (mod && (k === 'z' || k === 'y')) {
      if (readOnly || !history) return;
      e.preventDefault();
      if (k === 'y' || e.shiftKey) history.redo(); else history.undo();
    } else if (e.key === 'Escape') {
      onSelect?.(null);
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !readOnly) {
      e.preventDefault();
      onRemove?.(selectedId);
    } else if (!mod && (e.key === '+' || e.key === '=')) {
      zoomBy(STEP_ZOOM);
    } else if (!mod && (e.key === '-' || e.key === '_')) {
      zoomBy(1 / STEP_ZOOM);
    } else if (!mod && e.key === '0') {
      refit();
    }
  };

  /* ---- drawing ---- */

  const full = steps.length >= MAX_NODES;
  const dragging = drag != null;
  const draggedStep = dragging ? steps.find((n) => n.id === drag.id) : null;
  const DraggedIcon = draggedStep ? STEP_TYPE_MAP[draggedStep.type]?.icon : null;
  const hasSteps = steps.length > 0;

  return (
    <div className="relative flex-1 w-full min-h-[360px] overflow-hidden bg-[var(--ui-surface-sunken)]" data-testid="sequence-tree">
      <div
        ref={viewportRef}
        role="group"
        aria-label="Sequence flow"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        className={`absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ui-accent-border)] select-none ${dragging || panning ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          touchAction: 'none',
          backgroundImage: 'radial-gradient(var(--ui-border-strong) 1px, transparent 1px)',
          backgroundSize: `${24 * view.k}px ${24 * view.k}px`,
          backgroundPosition: `${view.x}px ${view.y}px`,
        }}
      >
        <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }} data-testid="canvas-world">
          <svg className="absolute left-0 top-0 overflow-visible pointer-events-none" width="1" height="1" aria-hidden="true">
            {layout.edges.map((edge) => {
              const { d } = edgeGeometry(edge);
              const x1 = edge.from.x + edge.from.w / 2;
              const y1 = edge.from.y + edge.from.h;
              const x2 = edge.to.x + edge.to.w / 2;
              return (
                <g key={edge.key}>
                  <path d={d} fill="none" stroke="var(--ui-border-strong)" strokeWidth="1.5" strokeDasharray="6 6" strokeLinecap="round" />
                  <circle cx={x1} cy={y1} r="3.5" fill="var(--ui-accent-dot)" />
                  <circle cx={x2} cy={edge.to.y} r="3.5" fill="var(--ui-accent-dot)" />
                </g>
              );
            })}
          </svg>

          {layout.nodes.map((node) => (node.kind === 'step'
            ? (
              <StepNode
                key={node.key}
                node={node}
                error={readOnly ? null : errors[node.key]}
                selected={selectedId === node.key}
                dimmed={drag?.id === node.key}
                readOnly={readOnly}
                onActivate={activate}
                onRemove={(id) => onRemove?.(id)}
              />
            )
            : <TerminalNode key={node.key} node={node} />))}

          {layout.edges.filter((edge) => edge.label).map((edge) => {
            const { label: at } = edgeGeometry(edge);
            const count = branchCounts?.[edge.slot.parentId]?.[edge.slot.branch];
            return <BranchPill key={`l:${edge.key}`} label={edge.label} count={count} x={at.x} y={at.y} />;
          })}

          {!readOnly && !dragging && layout.edges.map((edge) => {
            const at = plusPoint(edge);
            return (
              <IconButton
                key={`p:${edge.key}`}
                data-canvas-ui
                icon={<Plus size={edge.toStop ? 14 : 13} strokeWidth={2.4} />}
                label="Add a step here"
                size="sm"
                variant={edge.toStop ? 'primary' : 'secondary'}
                disabled={full}
                title={full ? `A sequence can have at most ${MAX_NODES} steps` : 'Add a step here'}
                onClick={(e) => setPicker({ slot: edge.slot, anchor: e.currentTarget.getBoundingClientRect() })}
                className="!absolute !w-6 !h-6 !rounded-full !p-0 -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ left: at.x, top: at.y }}
              />
            );
          })}

          {dragging && drag.valid.map((s) => (
            <span
              key={`s:${s.key}`}
              aria-hidden="true"
              data-drop-slot={s.key}
              className={`absolute rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-[width,height,background-color] duration-[var(--ui-dur-fast)] ${
                drag.hover === s.key
                  ? 'w-9 h-9 bg-[var(--ui-accent)] ring-4 ring-[var(--ui-accent-tint-strong)]'
                  : 'w-4 h-4 bg-[var(--ui-accent-tint-strong)] ring-2 ring-[var(--ui-accent-border)]'
              }`}
              style={{ left: s.x, top: s.y }}
            />
          ))}

          {!hasSteps && !readOnly && (
            <p className="absolute text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)] -translate-y-1/2 whitespace-nowrap" style={{ left: layout.nodes[1].x + layout.nodes[1].w / 2 + 24, top: layout.nodes[1].y - 20 }}>
              Add your first step
            </p>
          )}
        </div>
      </div>

      <div className="absolute left-3 bottom-3 z-20 flex items-center gap-0.5 p-1 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-md)]" data-canvas-ui role="toolbar" aria-label="Canvas controls">
        {!readOnly && history && (
          <>
            <IconButton icon={<Undo2 size={14} />} label="Undo" size="sm" disabled={!history.canUndo} onClick={history.undo} />
            <IconButton icon={<Redo2 size={14} />} label="Redo" size="sm" disabled={!history.canRedo} onClick={history.redo} />
            <span className="w-px h-4 mx-1 bg-[var(--ui-border)]" aria-hidden="true" />
          </>
        )}
        <IconButton icon={<Minus size={14} />} label="Zoom out" size="sm" disabled={view.k <= MIN_ZOOM + 0.001} onClick={() => zoomBy(1 / STEP_ZOOM)} />
        <span className="w-11 text-center ui-num text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]" aria-live="polite">{Math.round(view.k * 100)}%</span>
        <IconButton icon={<Plus size={14} />} label="Zoom in" size="sm" disabled={view.k >= MAX_ZOOM - 0.001} onClick={() => zoomBy(STEP_ZOOM)} />
        <span className="w-px h-4 mx-1 bg-[var(--ui-border)]" aria-hidden="true" />
        <IconButton icon={<Maximize size={14} />} label="Fit to screen" size="sm" onClick={refit} />
      </div>

      {picker && (
        <StepPicker
          anchor={picker.anchor}
          slot={picker.slot}
          steps={steps}
          onClose={() => setPicker(null)}
          onPick={(type) => { setPicker(null); onAdd?.(picker.slot, type); }}
        />
      )}

      {dragging && draggedStep && createPortal(
        <div
          className="fixed z-[60] pointer-events-none flex items-center gap-2.5 w-[220px] h-12 px-2.5 rounded-[var(--ui-radius-lg)] border border-[var(--ui-accent)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-lg)] opacity-95"
          style={{ left: drag.x + 14, top: drag.y + 14 }}
          data-testid="drag-ghost"
        >
          <span className={`shrink-0 grid place-items-center w-8 h-8 rounded-[var(--ui-radius-sm)] ${tileClass(draggedStep.type)}`}>
            {DraggedIcon && <DraggedIcon size={15} aria-hidden="true" />}
          </span>
          <span className="truncate text-[length:var(--ui-t-control)] font-semibold text-[var(--ui-text-primary)]">{STEP_TYPE_MAP[draggedStep.type]?.label ?? draggedStep.type}</span>
        </div>,
        document.body,
      )}
    </div>
  );
}

export default SequenceCanvas;
