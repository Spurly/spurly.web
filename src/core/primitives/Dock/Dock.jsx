import { useCallback, useEffect, useState } from 'react';
import { Overlay } from '../Overlay';
import { IconButton } from '../IconButton';

/**
 * A panel that lives parked at the bottom of the screen and springs up on
 * demand.
 *
 * WHY IT OPENS ON CLICK AND NOT ON HOVER
 *
 * The brief was a macOS Dock: move the cursor toward the bottom edge and the
 * panel rises by itself. The look is right and is kept — the pill magnifies
 * as the cursor nears it, and the sheet arrives on a spring. The proximity
 * TRIGGER is not, for three reasons that are properties of this app rather
 * than of taste:
 *
 *   1. Pagination lives in exactly that strip. A panel that opens when the
 *      cursor enters the bottom 80px opens every time someone reaches for
 *      "next page", over the thing they were about to click.
 *   2. Hover is not a keyboard event. A proximity-only surface is unreachable
 *      without a mouse, and this one contains the primary action of the page.
 *   3. Touch has no hover at all, so the feature would simply not exist on a
 *      phone or an iPad.
 *
 * Click and Cmd/Ctrl-K both open it. Both are intentional, both are
 * reachable, and neither fires while you are aiming at something else.
 *
 * The sheet is a real modal — Overlay's focus trap, scroll lock, Escape
 * handling and overlay stack, the same machinery as Dialog and Drawer. It is
 * not a floating div with a click-outside handler, because this one holds a
 * form and losing a half-filled form to a stray click is the worst outcome
 * available.
 *
 * Deliberately generic: it knows nothing about audiences or filters. The
 * intent is that it grows into a command palette without a rewrite — a
 * palette is this component with a different child.
 */
export function Dock({
  /** Pill label. Also the sheet's accessible name. */
  label,
  icon = null,
  /** Short status on the pill, e.g. "3 filters". Keeps the collapsed state informative. */
  badge = null,
  /** Rendered in the sheet header, right-aligned, before the close button. */
  actions = null,
  shortcutKey = 'k',
  disabled = false,
  children,
  className = '',
}) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (disabled) return undefined;
    const onKeyDown = (e) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key.toLowerCase() !== shortcutKey) return;
      e.preventDefault();
      setOpen((prev) => !prev);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcutKey, disabled]);

  return (
    <>
      {/*
        The parked pill. `pointer-events-none` on the rail and `auto` on the
        pill so the 88px strip it sits in does not swallow clicks meant for
        the table underneath it — the pill floats over content, and everything
        around it must stay usable.
      */}
      {!open && (
        <div
          className="fixed inset-x-0 bottom-0 h-[88px] grid place-items-end justify-center pb-5 pointer-events-none"
          style={{ zIndex: 'var(--ui-z-dock)' }}
        >
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen(true)}
            aria-expanded={false}
            aria-keyshortcuts={`Meta+${shortcutKey.toUpperCase()} Control+${shortcutKey.toUpperCase()}`}
            className={[
              'pointer-events-auto inline-flex items-center gap-3 h-[46px] pl-[18px] pr-2.5',
              'rounded-[var(--ui-radius-pill)] bg-[var(--ui-surface-card)]',
              'border border-[var(--ui-border)] shadow-[var(--ui-shadow-dock)]',
              'text-[var(--ui-t-body)] font-semibold text-[var(--ui-text-primary)]',
              'origin-bottom transition-[transform,border-color] duration-[var(--ui-dur-base)]',
              'ease-[cubic-bezier(0.32,0.72,0,1)]',
              /* The Dock magnification, kept. motion-safe so it simply does
                 not happen for anyone who asked for less movement. */
              'motion-safe:hover:-translate-y-[5px] motion-safe:hover:scale-[1.04]',
              'hover:border-[var(--ui-accent-border)]',
              'focus:outline-none focus-visible:shadow-[var(--ui-focus-ring),var(--ui-shadow-dock)]',
              'disabled:opacity-45 disabled:pointer-events-none',
              className,
            ].join(' ')}
          >
            {icon && <span className="text-[var(--ui-accent-fg)] shrink-0">{icon}</span>}
            <span>{label}</span>
            {badge}
            <kbd
              className={[
                'ui-meta shrink-0 px-1.5 py-1 leading-none normal-case',
                'border border-[var(--ui-border)] rounded-[var(--ui-radius-xs)]',
              ].join(' ')}
            >
              ⌘{shortcutKey.toUpperCase()}
            </kbd>
          </button>
        </div>
      )}

      <Overlay
        open={open}
        onClose={close}
        align="bottom"
        label={label}
        /* A half-filled form must not vanish on a stray click. Escape still
           closes, and so does the explicit button — both are deliberate acts. */
        closeOnBackdrop={false}
        panelClassName={[
          'ui-dock-sheet w-full mx-3.5 mb-3.5 max-h-[calc(100vh-96px)]',
          'rounded-[var(--ui-radius-xl)] border border-[var(--ui-border)]',
          'shadow-[var(--ui-shadow-dock)] overflow-hidden',
        ].join(' ')}
        panelStyle={{ maxWidth: 1080 }}
      >
        {/* The grab handle is decoration that earns its place: it is the one
            affordance that says "this came up from the bottom and can go back
            down", which the spring alone only implies. */}
        <div className="mx-auto mt-2.5 h-1 w-[34px] rounded-full bg-[var(--ui-border-strong)]" aria-hidden="true" />

        <div
          className="flex items-center gap-3 shrink-0 border-b border-[var(--ui-border-hairline)]"
          style={{ height: 'var(--ui-band)', paddingInline: 'var(--ui-pad-lg)' }}
        >
          <span className="text-[var(--ui-t-section)] font-semibold truncate">{label}</span>
          {badge}
          <div className="flex-1" />
          {actions}
          <IconButton size="sm" variant="ghost" label="Close" icon={<CloseGlyph />} onClick={close} />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
      </Overlay>
    </>
  );
}

function CloseGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
