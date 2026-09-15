import { useState, useEffect, useRef, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { GripVertical, ChevronUp, ChevronDown, Trash2, Plus, Clock, MoreVertical } from 'lucide-react';
import { Field, Checkbox, IconButton } from 'src/core/primitives';
import { STEP_TYPES, STEP_TYPE_MAP, WAIT_MODES, makeStep, stepError } from 'src/products/sequences/stepTypes.js';

/**
 * The step builder, as a node canvas.
 *
 * Steps are still exactly what they always were — a flat, ordered array with
 * a `delayDays` on each one (see stepTypes.js / entities/sequence.js). There
 * is no branching in the data: the backend requires a linear step list (see
 * the model.js comment on the backend, and UNIPILE_MODULE_PLAN_V2.md §4), so
 * this is a visual + interaction upgrade over the old row list, not a new
 * shape underneath it. What changed is presentation: steps render as
 * connected node cards instead of table-ish rows, the gap between two nodes
 * is itself a drop target and an "insert a step here" control, and a step's
 * `delayDays` shows as a small clock pill sitting on the connector above it
 * instead of an inline input in the row header.
 *
 * Reordering: HTML5 drag, same "the row IS the handle" family of decisions
 * as the old builder and the DataTable column reorder feature — except the
 * drag SOURCE is scoped to the grip icon only (not the whole card), so
 * dragging never fights with selecting text inside a step's textarea. The
 * DROP TARGETS are the gaps between cards, not the cards themselves — a gap
 * unambiguously means "insert at this position," where dropping on a card
 * would need an arbitrary top-half/bottom-half rule to mean the same thing.
 * Up/Down buttons stay as the keyboard/accessible fallback, as before.
 */

function ConfigFields({ step, onConfigChange, disabled }) {
  const { type, config } = step;

  if (type === 'profile_visit') {
    return (
      <Checkbox
        label="Notify the lead you visited (recommended — this step exists to be seen)"
        checked={config.notify !== false}
        onChange={(e) => onConfigChange({ notify: e.target.checked })}
        disabled={disabled}
      />
    );
  }

  if (type === 'connect') {
    return (
      <div className="flex flex-col gap-1">
        <textarea
          value={config.note || ''}
          maxLength={300}
          rows={2}
          disabled={disabled}
          onChange={(e) => onConfigChange({ note: e.target.value })}
          placeholder="Optional note to send with the invitation…"
          aria-label="Connection note"
          className="w-full text-[var(--ui-t-label)] rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] px-2.5 py-1.5 text-[var(--ui-text-primary)] disabled:opacity-60"
        />
        <span className="text-[var(--ui-t-micro)] text-[var(--ui-text-tertiary)]">{(config.note || '').length}/300</span>
      </div>
    );
  }

  if (type === 'like_post') {
    return <p className="text-[var(--ui-t-micro)] text-[var(--ui-text-tertiary)]">Reacts to the lead's most recent post. No configuration needed.</p>;
  }

  if (type === 'comment_post' || type === 'message') {
    const label = type === 'message' ? 'Message' : 'Comment';
    return (
      <div className="flex flex-col gap-1">
        <textarea
          value={config.text || ''}
          maxLength={type === 'comment_post' ? 1250 : undefined}
          rows={3}
          disabled={disabled}
          onChange={(e) => onConfigChange({ text: e.target.value })}
          placeholder={type === 'message' ? 'Hey {{firstName}}, …' : `Write the ${label.toLowerCase()}…`}
          aria-label={label}
          className="w-full text-[var(--ui-t-label)] rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] px-2.5 py-1.5 text-[var(--ui-text-primary)] disabled:opacity-60"
        />
        <span className="text-[var(--ui-t-micro)] text-[var(--ui-text-tertiary)]">
          {type === 'message' ? 'Use {{firstName}} to personalize.' : `${(config.text || '').length}/1250`}
        </span>
      </div>
    );
  }

  if (type === 'wait') {
    const mode = config.mode || 'fixed';
    return (
      <div className="flex items-center gap-2.5 flex-wrap">
        <select
          value={mode}
          disabled={disabled}
          onChange={(e) => onConfigChange({ mode: e.target.value })}
          aria-label="Wait mode"
          className="text-[var(--ui-t-micro)] rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] px-1.5 py-1 text-[var(--ui-text-primary)]"
        >
          {WAIT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        {mode === 'fixed' ? (
          <label className="flex items-center gap-1.5 text-[var(--ui-t-micro)] text-[var(--ui-text-secondary)]">
            Wait
            <input
              type="number"
              min={1}
              value={config.days ?? 2}
              disabled={disabled}
              onChange={(e) => onConfigChange({ days: Number(e.target.value) })}
              className="w-12 h-6 text-[var(--ui-t-micro)] text-center rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)]"
            />
            days, then continue
          </label>
        ) : (
          <label className="flex items-center gap-1.5 text-[var(--ui-t-micro)] text-[var(--ui-text-secondary)]">
            Stop if not accepted within
            <input
              type="number"
              min={1}
              value={config.maxDays ?? 7}
              disabled={disabled}
              onChange={(e) => onConfigChange({ maxDays: Number(e.target.value) })}
              className="w-12 h-6 text-[var(--ui-t-micro)] text-center rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)]"
            />
            days
          </label>
        )}
      </div>
    );
  }

  if (type === 'endorse_skill') {
    return (
      <Field
        label={null}
        placeholder={'Skill name, exactly as it appears on their profile (e.g. "React")'}
        value={config.skillName || ''}
        onChange={(e) => onConfigChange({ skillName: e.target.value })}
        disabled={disabled}
      />
    );
  }

  return null;
}

/** One-line summary shown under a node's title, in both edit and read-only views. */
export function stepSummary(step) {
  const { type, config } = step;
  switch (type) {
    case 'connect':
      return config.note ? `“${config.note}”` : 'No note';
    case 'comment_post':
    case 'message':
      return config.text ? `“${config.text}”` : 'Not written yet';
    case 'wait':
      return config.mode === 'until-accepted'
        ? `Stops if not accepted within ${config.maxDays ?? 7} day(s)`
        : `Waits ${config.days ?? 2} day(s), then continues`;
    case 'endorse_skill':
      return config.skillName ? `Skill: ${config.skillName}` : 'No skill set';
    case 'profile_visit':
      return config.notify === false ? 'Silent visit' : 'Visits and notifies';
    case 'like_post':
      return "Reacts to the lead's most recent post";
    default:
      return '';
  }
}

/** Preferred and floor heights for a floating menu — it flips above its trigger, and scrolls internally, rather than ever running off either edge of the viewport. */
const MENU_PREFERRED_HEIGHT = 320;
const MENU_MIN_HEIGHT = 120;

/**
 * Shared positioning state and behavior for a small trigger button that
 * opens a popover menu: computes a portal position from the trigger's own
 * bounding rect, flips above the trigger when there isn't enough room
 * below it, clamps horizontally to the viewport, and closes on outside
 * click or Escape.
 *
 * Returns plain values (`toggle`, `btnRef`, …) for the caller to wire up
 * with its own JSX, rather than a component that calls a caller-supplied
 * function or clones a caller-supplied element during render — that
 * indirection is exactly what the react-hooks/refs lint rule flags, since
 * it can no longer prove a ref (read inside `toggle`, via `reposition`)
 * isn't accessed mid-render. Attaching `onClick={toggle}` as a literal JSX
 * prop, in the same component that renders the trigger, is the safe shape.
 */
/**
 * Pure position math for a floating menu: given the trigger's bounding
 * rect, returns where the portal should sit — flipped above the trigger
 * when there isn't room below, clamped horizontally to the viewport, with
 * a height capped to whatever space is actually available. No refs touched
 * here, so this is safe to share as a plain helper.
 */
function computeMenuPosition(rect, widthPx, align) {
  if (!rect) return null;
  const rawLeft = align === 'end'
    ? rect.right - widthPx
    : rect.left + rect.width / 2 - widthPx / 2;
  const left = Math.min(Math.max(rawLeft, 8), window.innerWidth - widthPx - 8);
  // Flip above the trigger when there isn't enough room below it for even
  // the shortest useful list, and there's more room above — otherwise a
  // menu opened downward from a trigger near the bottom of the page would
  // strand every item past the first below the browser's own edge, with no
  // way to reach them.
  const spaceBelow = window.innerHeight - rect.bottom - 8;
  const spaceAbove = rect.top - 8;
  const openUpward = spaceBelow < MENU_MIN_HEIGHT && spaceAbove > spaceBelow;
  const available = openUpward ? spaceAbove : spaceBelow;
  const maxHeight = Math.max(MENU_MIN_HEIGHT, Math.min(MENU_PREFERRED_HEIGHT, available));
  return openUpward
    ? { left, bottom: window.innerHeight - rect.top + 6, top: undefined, maxHeight }
    : { left, top: rect.bottom + 6, bottom: undefined, maxHeight };
}

/**
 * Closes an open floating menu on outside pointerdown or Escape, and keeps
 * its position current on scroll/resize. Takes the trigger/menu refs as
 * arguments rather than returning them from a hook: each caller creates
 * its own refs with `useRef()` directly and attaches them to its own JSX
 * (the shape the react-hooks/refs rule expects) — a hook that instead
 * returned refs bundled into an object tainted every property read off
 * that object as an unsafe ref access during render, even for plain state
 * fields like `open`.
 */
function useMenuDismiss(open, btnRef, menuRef, reposition, onClose) {
  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(e) {
      const insideTrigger = btnRef.current && btnRef.current.contains(e.target);
      const insideMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!insideTrigger && !insideMenu) onClose();
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}

/** The portal-rendered popover body for a floating-menu trigger. Pure presentation — it only reads the caller's already-computed open/pos state, so no ref indirection to flag. */
function FloatingMenuList({ open, pos, menuRef, widthPx, children }) {
  if (!open || !pos) return null;
  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-50 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-md)] p-1 flex flex-col gap-0.5"
      style={{
        top: pos.top,
        bottom: pos.bottom,
        left: pos.left,
        width: widthPx,
        maxHeight: pos.maxHeight,
        overflowY: 'auto',
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

/** One row inside a `FloatingMenuList`. Not a `<button>` — matches the existing `Dropdown.jsx` convention for menu items in this codebase. */
function MenuItem({ icon: Icon, tone = 'default', disabled, onSelect, children }) {
  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--ui-radius-sm)] text-left text-[var(--ui-t-label)] cursor-pointer ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : tone === 'danger'
            ? 'text-[var(--ui-danger-fg)] hover:bg-[var(--ui-surface-hover)]'
            : 'text-[var(--ui-text-primary)] hover:bg-[var(--ui-surface-hover)]'
      }`}
    >
      {Icon && <Icon size={13} className="shrink-0" aria-hidden="true" />}
      {children}
    </div>
  );
}

function NodeCard({
  step, index, isFirst, isLast, readOnly,
  expanded, onToggleExpand,
  onChange, onRemove, onMove,
  isDragSource, onDragStartHandle, onDragEndHandle,
}) {
  const def = STEP_TYPE_MAP[step.type];
  const Icon = def?.icon;
  const error = !readOnly && stepError(step);
  const summary = stepSummary(step);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const menuBtnRef = useRef(null);
  const menuListRef = useRef(null);

  const repositionMenu = () => {
    setMenuPos(computeMenuPosition(menuBtnRef.current?.getBoundingClientRect(), 168, 'end'));
  };
  const toggleMenu = () => {
    setMenuOpen((cur) => {
      if (cur) return false;
      repositionMenu();
      return true;
    });
  };
  const closeMenu = () => setMenuOpen(false);
  useMenuDismiss(menuOpen, menuBtnRef, menuListRef, repositionMenu, closeMenu);

  const setDelayDays = (v) => onChange(index, { ...step, delayDays: Math.max(0, Number(v) || 0) });
  const setConfig = (patch) => onChange(index, { ...step, config: { ...step.config, ...patch } });

  return (
    <div
      className={`group relative w-72 rounded-[var(--ui-radius-lg)] border bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-sm)] transition-all ${isDragSource ? 'opacity-40' : 'hover:shadow-[var(--ui-shadow-md)]'} ${error ? 'border-[var(--ui-danger)]' : 'border-[var(--ui-border)] hover:border-[var(--ui-border-strong)]'}`}
    >
      <div
        className={`flex items-center gap-2 px-3 py-2.5 ${!readOnly ? 'cursor-pointer' : ''}`}
        onClick={readOnly ? undefined : onToggleExpand}
      >
        {!readOnly && (
          <span
            draggable
            onDragStart={(e) => {
              e.stopPropagation();
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', String(index));
              onDragStartHandle();
            }}
            onDragEnd={(e) => { e.stopPropagation(); onDragEndHandle(); }}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 grid place-items-center w-4 h-4 -ml-1 text-[var(--ui-text-tertiary)] cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            aria-hidden="true"
          >
            <GripVertical size={13} />
          </span>
        )}
        <span className="shrink-0 grid place-items-center w-6 h-6 rounded-[var(--ui-radius-sm)] bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)]">
          {Icon && <Icon size={13} aria-hidden="true" />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[var(--ui-t-label)] font-medium text-[var(--ui-text-primary)] truncate">{def?.label ?? step.type}</p>
          <p className={`text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)] ${readOnly ? '' : 'truncate'}`}>{summary}</p>
        </div>
        {error && (
          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--ui-danger)]" aria-hidden="true" title={error} />
        )}
        {!readOnly && (
          <div onClick={(e) => e.stopPropagation()}>
            <span ref={menuBtnRef} className="inline-flex">
              <IconButton
                icon={<MoreVertical size={13} />}
                label="Step actions"
                size="sm"
                onClick={toggleMenu}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              />
            </span>
            <FloatingMenuList open={menuOpen} pos={menuPos} menuRef={menuListRef} widthPx={168}>
              {!isFirst && (
                <MenuItem icon={ChevronUp} onSelect={() => { onMove(index, -1); closeMenu(); }}>
                  Move up
                </MenuItem>
              )}
              {!isLast && (
                <MenuItem icon={ChevronDown} onSelect={() => { onMove(index, 1); closeMenu(); }}>
                  Move down
                </MenuItem>
              )}
              <MenuItem icon={Trash2} tone="danger" onSelect={() => { onRemove(index); closeMenu(); }}>
                Remove step
              </MenuItem>
            </FloatingMenuList>
          </div>
        )}
      </div>
      {expanded && !readOnly && (
        <div className="px-3 pb-3 pt-1 border-t border-[var(--ui-border-hairline)] flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          <label className="flex items-center gap-1.5 text-[var(--ui-t-micro)] text-[var(--ui-text-tertiary)]">
            Wait
            <input
              type="number"
              min={0}
              value={step.delayDays ?? 0}
              onChange={(e) => setDelayDays(e.target.value)}
              aria-label="Days before this step"
              className="w-10 h-5 text-[var(--ui-t-micro)] text-center rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)]"
            />
            day(s) before this step
          </label>
          <ConfigFields step={step} onConfigChange={setConfig} disabled={false} />
          {error && <p className="text-[var(--ui-t-micro)] text-[var(--ui-danger-fg)]">{error}</p>}
        </div>
      )}
    </div>
  );
}

/**
 * The connector between two nodes (or before the first / after the last).
 * Doubles as: the `delayDays` reading for the step below it, the drop
 * target for a reorder in flight, and the "insert a step here" control.
 */
function Gap({ nextStep, readOnly, isDragActive, isOver, onDragOver, onDrop, onAddType }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const menuBtnRef = useRef(null);
  const menuListRef = useRef(null);

  const repositionMenu = () => {
    setMenuPos(computeMenuPosition(menuBtnRef.current?.getBoundingClientRect(), 200, 'center'));
  };
  const toggleMenu = () => {
    setMenuOpen((cur) => {
      if (cur) return false;
      repositionMenu();
      return true;
    });
  };
  const closeMenu = () => setMenuOpen(false);
  useMenuDismiss(menuOpen, menuBtnRef, menuListRef, repositionMenu, closeMenu);

  const waitDays = nextStep?.delayDays ?? 0;
  const highlight = isDragActive && isOver;

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{ minHeight: readOnly ? (waitDays > 0 ? 32 : 16) : 36 }}
      onDragOver={readOnly ? undefined : (e) => { e.preventDefault(); onDragOver(); }}
      onDrop={readOnly ? undefined : (e) => { e.preventDefault(); onDrop(); }}
    >
      <span
        className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 ${highlight ? 'w-0.5' : 'w-px'}`}
        style={{ background: highlight ? 'var(--ui-accent)' : 'var(--ui-border-strong)' }}
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center gap-1 py-1">
        {waitDays > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--ui-radius-pill)] bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)] text-[var(--ui-t-micro)]">
            <Clock size={10} aria-hidden="true" />
            <span className="font-[var(--ui-font-mono)] tabular-nums">{waitDays}d</span>
          </span>
        )}
        {!readOnly && (
          <>
            <span ref={menuBtnRef} className="inline-flex">
              <IconButton
                icon={<Plus size={12} />}
                label="Add a step here"
                variant="secondary"
                size="sm"
                onClick={toggleMenu}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              />
            </span>
            <FloatingMenuList open={menuOpen} pos={menuPos} menuRef={menuListRef} widthPx={200}>
              {STEP_TYPES.map((stepType) => (
                <MenuItem
                  key={stepType.value}
                  icon={stepType.icon}
                  onSelect={() => { onAddType(stepType.value); closeMenu(); }}
                >
                  {stepType.label}
                </MenuItem>
              ))}
            </FloatingMenuList>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Compact, static rendering of a sequence's steps for once it has left
 * draft — no dotted canvas, no drag handles or add-step menus (nothing here
 * is editable once running/paused/done, see SequenceDetailPage), just a
 * simple vertical timeline sized to actually fit the content instead of a
 * fixed-width node canvas built for editing.
 */
export function SequenceStepsReadOnly({ steps }) {
  if (!steps.length) {
    return (
      <p className="px-[var(--ui-pad-lg)] py-4 text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)]">No steps.</p>
    );
  }

  return (
    <div className="flex flex-col px-[var(--ui-pad-lg)] py-3">
      {steps.map((step, index) => {
        const def = STEP_TYPE_MAP[step.type];
        const Icon = def?.icon;
        const waitDays = step.delayDays ?? 0;
        const isLast = index === steps.length - 1;
        return (
          <div key={index} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="shrink-0 grid place-items-center w-6 h-6 rounded-[var(--ui-radius-sm)] bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)]">
                {Icon && <Icon size={13} aria-hidden="true" />}
              </span>
              {!isLast && (
                <span className="w-px flex-1 my-1" style={{ background: 'var(--ui-border)' }} aria-hidden="true" />
              )}
            </div>
            <div className={`flex-1 min-w-0 ${isLast ? '' : 'pb-4'}`}>
              {waitDays > 0 && (
                <p className="text-[var(--ui-t-micro)] text-[var(--ui-text-tertiary)] mb-1">Waits {waitDays} day(s) first</p>
              )}
              <p className="text-[var(--ui-t-label)] font-medium text-[var(--ui-text-primary)]">{def?.label ?? step.type}</p>
              <p className="text-[var(--ui-t-meta)] text-[var(--ui-text-tertiary)]">{stepSummary(step)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SequenceFlowBuilder({ steps, onChange, readOnly = false }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overGap, setOverGap] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const setStep = (index, next) => {
    const copy = steps.slice();
    copy[index] = next;
    onChange(copy);
  };

  const removeStep = (index) => {
    onChange(steps.filter((_, i) => i !== index));
    setExpandedIndex((cur) => {
      if (cur === null) return cur;
      if (cur === index) return null;
      return cur > index ? cur - 1 : cur;
    });
  };

  const moveStep = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= steps.length) return;
    const copy = steps.slice();
    [copy[index], copy[target]] = [copy[target], copy[index]];
    onChange(copy);
    setExpandedIndex((cur) => {
      if (cur === index) return target;
      if (cur === target) return index;
      return cur;
    });
  };

  const insertStepAt = (gapIndex, type) => {
    const copy = steps.slice();
    copy.splice(gapIndex, 0, makeStep(type));
    onChange(copy);
  };

  const handleDropAt = (gapIndex) => {
    if (dragIndex === null) return;
    // Dropping on either gap immediately touching the dragged card is a no-op:
    // the item would land back in the same position it started from.
    if (gapIndex !== dragIndex && gapIndex !== dragIndex + 1) {
      const copy = steps.slice();
      const [moved] = copy.splice(dragIndex, 1);
      const insertAt = gapIndex > dragIndex ? gapIndex - 1 : gapIndex;
      copy.splice(insertAt, 0, moved);
      onChange(copy);
      setExpandedIndex(null);
    }
    setDragIndex(null);
    setOverGap(null);
  };

  return (
    <div
      className="flex flex-col items-center py-8 px-4 min-h-full"
      style={{
        background: 'var(--ui-surface-sunken)',
        backgroundImage: 'radial-gradient(var(--ui-border) 1px, transparent 1px)',
        backgroundSize: '18px 18px',
      }}
    >
      {steps.length === 0 && (
        <p className="mb-1 text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)]">No steps yet.</p>
      )}

      <Gap
        nextStep={steps[0] ?? null}
        readOnly={readOnly}
        isDragActive={dragIndex !== null}
        isOver={overGap === 0}
        onDragOver={() => setOverGap(0)}
        onDrop={() => handleDropAt(0)}
        onAddType={(type) => insertStepAt(0, type)}
      />

      {steps.map((step, index) => (
        <Fragment key={index}>
          <NodeCard
            step={step}
            index={index}
            isFirst={index === 0}
            isLast={index === steps.length - 1}
            readOnly={readOnly}
            expanded={expandedIndex === index}
            onToggleExpand={() => setExpandedIndex((cur) => (cur === index ? null : index))}
            onChange={setStep}
            onRemove={removeStep}
            onMove={moveStep}
            isDragSource={dragIndex === index}
            onDragStartHandle={() => setDragIndex(index)}
            onDragEndHandle={() => { setDragIndex(null); setOverGap(null); }}
          />
          <Gap
            nextStep={steps[index + 1] ?? null}
            readOnly={readOnly}
            isDragActive={dragIndex !== null}
            isOver={overGap === index + 1}
            onDragOver={() => setOverGap(index + 1)}
            onDrop={() => handleDropAt(index + 1)}
            onAddType={(type) => insertStepAt(index + 1, type)}
          />
        </Fragment>
      ))}
    </div>
  );
}

export default SequenceFlowBuilder;
