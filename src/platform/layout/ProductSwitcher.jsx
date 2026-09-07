import { useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Tooltip } from 'src/ui/primitives';

/**
 * Workspace switcher.
 *
 * ₹5000 is a superset of ₹1500, so this swaps the workspace in place — sidebar
 * and routes change, same SPA, same session, no reload. Not two apps, and not
 * a redirect.
 *
 * BOTH ENTRIES ARE ALWAYS VISIBLE. When entitlement lands (Phase 5,
 * `Plan.features.hub`) a user without hub sees it here locked with an upgrade
 * prompt rather than not at all — a lower tier seeing the upper tier daily, in
 * context, while they work, is the entire reason these live in one app instead
 * of behind a redirect. `locked` below is the seam for that; nothing sets it
 * yet, and a lock that pretends to gate something ungated would be worse than
 * none.
 *
 * It lives in platform/layout rather than the `app/ProductSwitcher.jsx` the
 * architecture doc names, because DashboardLayout is platform and the boundary
 * lint forbids platform importing app. Same component, one tier down.
 */
export function ProductSwitcher({ workspaces, current, expanded, onSelect }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const active = workspaces.find((w) => w.id === current) ?? workspaces[0];

  const trigger = (
    // Not a Button: this is the rail's identity block — logo, workspace name and
    // a chevron laid out to the sidebar's own rhythm, the same exemption the
    // nav rows in DashboardLayout take. It still carries the focus ring.
    // eslint-disable-next-line no-restricted-syntax
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label={`Workspace: ${active.label}. Switch workspace`}
      className={[
        'group flex items-center h-8 rounded-[var(--ui-radius-sm)] min-w-0',
        'transition-colors duration-[var(--ui-dur-fast)] focus:outline-none',
        'focus-visible:shadow-[var(--ui-focus-ring)]',
        'hover:bg-[var(--ui-surface-rail-hover)]',
        expanded ? 'px-1.5 gap-2 flex-1' : 'w-8 justify-center',
      ].join(' ')}
    >
      <img src="/Spurly Icon Square.png" alt="" className="w-5 h-5 shrink-0 object-contain" />
      {expanded && (
        <>
          <span className="flex flex-col items-start min-w-0 leading-tight">
            <span className="text-[13px] font-medium tracking-[-0.006em] text-[var(--ui-text-primary)] truncate">
              {active.label}
            </span>
          </span>
          <span className="flex-1" />
          <ChevronsUpDown size={13} className="shrink-0 text-[var(--ui-text-tertiary)]" aria-hidden="true" />
        </>
      )}
    </button>
  );

  return (
    <div ref={rootRef} className="relative flex items-center min-w-0 flex-1">
      {expanded ? trigger : <Tooltip content={`${active.label} — switch workspace`} placement="right">{trigger}</Tooltip>}

      {open && (
        <div
          role="menu"
          /* --ui-surface-raised does not exist. Naming a token that was never
             defined resolves to nothing, so the panel rendered with NO
             background at all and the nav showed straight through it. The
             card surface is what every other floating panel here uses. */
          className={[
            'absolute z-30 top-full mt-1 left-0 min-w-[228px] p-1',
            'rounded-[var(--ui-radius-md)] border border-[var(--ui-border)]',
            'bg-[var(--surface-card)] shadow-[var(--ui-shadow-lg)]',
          ].join(' ')}
        >
          {workspaces.map((w) => {
            const isCurrent = w.id === active.id;
            return (
              // A two-line menu item (label over description), not a control
              // Button models.
              // eslint-disable-next-line no-restricted-syntax
              <button
                key={w.id}
                type="button"
                role="menuitem"
                disabled={w.locked}
                onClick={() => {
                  setOpen(false);
                  if (!isCurrent) onSelect(w);
                }}
                className={[
                  'w-full flex items-start gap-2 px-2 py-1.5 rounded-[var(--ui-radius-sm)] text-left',
                  'transition-colors duration-[var(--ui-dur-fast)] focus:outline-none',
                  w.locked
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:bg-[var(--ui-surface-rail-hover)] focus-visible:bg-[var(--ui-surface-rail-hover)]',
                ].join(' ')}
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] text-[var(--ui-text-primary)] truncate">{w.label}</span>
                  <span className="block text-[11px] text-[var(--ui-text-tertiary)] leading-snug">
                    {w.locked ? w.lockedHint : w.hint}
                  </span>
                </span>
                {isCurrent && (
                  <Check size={14} className="shrink-0 mt-0.5 text-[var(--ui-accent-fg)]" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
