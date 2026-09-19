import { useEffect, useRef, useState } from 'react';
import { MoreIcon } from 'src/core/icons';
import { IconButton } from '../IconButton';

/**
 * The "…" row/card menu. A 28px ghost trigger, a popover of text actions,
 * closes on outside click / Escape / pick. `danger` items go red on hover
 * only — destructive is a second look, not a permanent colour.
 *
 * items: [{ label, onSelect, icon?, danger?, disabled? }]
 */
export function Menu({ items = [], label = 'More actions', align = 'right', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
      <IconButton
        size="sm"
        variant="ghost"
        label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        icon={<MoreIcon size={15} />}
        onClick={() => setOpen((v) => !v)}
        className="!w-7 !h-7 !text-[var(--ui-text-quaternary)] hover:!text-[var(--ui-text-primary)]"
      />
      {open && (
        <div
          role="menu"
          className={`absolute top-[calc(100%+4px)] ${align === 'right' ? 'right-0' : 'left-0'} z-[var(--ui-z-popover)] min-w-[180px] p-1.5 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] shadow-[var(--ui-shadow-popover)] sp-pop`}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect?.();
              }}
              className={[
                'w-full flex items-center gap-2.5 h-8 px-2 rounded-[var(--ui-radius-xs)] text-left text-[length:var(--ui-t-control)] text-[var(--ui-text-body)]',
                'transition-colors duration-[140ms] focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]',
                'disabled:opacity-45 disabled:pointer-events-none',
                item.danger
                  ? 'hover:bg-[var(--ui-danger-tint)] hover:text-[var(--ui-danger-fg)]'
                  : 'hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text-primary)]',
              ].join(' ')}
            >
              {item.icon && <span className="shrink-0 grid place-items-center">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
