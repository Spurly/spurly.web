import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { STEP_TYPES, TREE_ACTION_TYPES, TREE_STEP_TYPES } from 'src/products/sequences/stepTypes.js';
import { insertBlocker } from 'src/products/sequences/treeModel.js';
import { tileClass } from './nodeStyle.js';
import { computeMenuPosition } from './SequenceFlowBuilder.jsx';

const WIDTH = 252;

const GROUPS = [
  { id: 'actions', label: 'Actions', types: [...STEP_TYPES, ...TREE_ACTION_TYPES] },
  { id: 'logic', label: 'Branch the flow', types: TREE_STEP_TYPES },
];

/**
 * The "what comes next?" menu that opens from a "+" on the canvas. Every step type is listed; the ones that cannot go
 * at this spot (40-step cap, nesting limit) are greyed out and say why on hover, so nothing is offered and then refused.
 */
export function StepPicker({ anchor, slot, steps, onPick, onClose }) {
  const ref = useRef(null);
  const [pos] = useState(() => computeMenuPosition(anchor, WIDTH, 'center'));

  useEffect(() => {
    const first = ref.current?.querySelector('[role="menuitem"]:not([aria-disabled="true"])');
    first?.focus();
    const onDown = (e) => { if (!ref.current?.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  if (!pos) return null;

  const step = (dir) => {
    const items = [...ref.current.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])')];
    const at = items.indexOf(document.activeElement);
    items[(at + dir + items.length) % items.length]?.focus();
  };

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label="Add a step"
      className="fixed z-50 flex flex-col gap-0.5 p-1.5 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-popover)] overflow-y-auto"
      style={{ top: pos.top, bottom: pos.bottom, left: pos.left, width: WIDTH, maxHeight: pos.maxHeight }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); step(1); }
        if (e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
      }}
    >
      {GROUPS.map((group) => (
        <div key={group.id} role="group" aria-label={group.label} className="flex flex-col gap-0.5">
          <p className="px-2 pt-1.5 pb-1 ui-micro !text-[var(--ui-text-quaternary)]">{group.label}</p>
          {group.types.map((type) => {
            const blocker = insertBlocker(steps, slot, type.value);
            const Icon = type.icon;
            const pick = () => { if (!blocker) onPick(type.value); };
            return (
              <div
                key={type.value}
                role="menuitem"
                tabIndex={blocker ? -1 : 0}
                aria-disabled={blocker ? true : undefined}
                title={blocker || type.description}
                onClick={pick}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } }}
                className={`flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--ui-radius-sm)] text-[length:var(--ui-t-control)] ${
                  blocker ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer text-[var(--ui-text-primary)] hover:bg-[var(--ui-surface-hover)] focus:bg-[var(--ui-surface-hover)] focus:outline-none'
                }`}
              >
                <span className={`shrink-0 grid place-items-center w-6 h-6 rounded-[var(--ui-radius-xs)] ${tileClass(type.value)}`}>
                  {Icon && <Icon size={13} aria-hidden="true" />}
                </span>
                {type.label}
              </div>
            );
          })}
        </div>
      ))}
    </div>,
    document.body,
  );
}

export default StepPicker;
