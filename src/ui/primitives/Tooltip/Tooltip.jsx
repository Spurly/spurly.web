import { useCallback, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePopperPosition } from '../Popper';

/**
 * Tooltip with hover intent.
 *
 * Opening is delayed so passing the cursor across a toolbar doesn't fire six
 * tooltips. Closing is delayed only briefly, so moving between adjacent
 * triggers feels continuous rather than flickering.
 *
 * Rendered in a portal with fixed positioning so it can escape the table's
 * overflow container.
 */
export function Tooltip({
  children,
  content,
  placement = 'top',
  openDelay = 350,
  closeDelay = 80,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const floatingRef = useRef(null);
  const timerRef = useRef(null);
  const id = useId();

  const position = usePopperPosition({ anchorRef, floatingRef, placement, offset: 6, open });

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const show = useCallback(() => {
    clear();
    timerRef.current = setTimeout(() => setOpen(true), openDelay);
  }, [openDelay]);

  const hide = useCallback(() => {
    clear();
    timerRef.current = setTimeout(() => setOpen(false), closeDelay);
  }, [closeDelay]);

  if (disabled || !content) return children;

  return (
    <>
      <span
        ref={anchorRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-describedby={open ? id : undefined}
        className="inline-flex max-w-full"
      >
        {children}
      </span>

      {open &&
        createPortal(
          <div
            ref={floatingRef}
            id={id}
            role="tooltip"
            style={{
              position: 'fixed',
              left: position.x,
              top: position.y,
              zIndex: 'var(--ui-z-popover)',
              opacity: position.ready ? 1 : 0,
              maxWidth: 260,
            }}
            className="pointer-events-none px-2 py-1 rounded-[var(--ui-radius-sm)] bg-[var(--ui-surface-inverse)] text-[var(--ui-text-inverse)] text-[12px] leading-snug shadow-[var(--ui-shadow-md)] whitespace-pre-line"
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
