import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock, useFocusTrap, useOverlayStack } from '../../hooks';

/**
 * The machinery shared by every overlay: portal, backdrop, scroll lock, focus
 * trap, Escape handling, and correct behaviour when overlays stack.
 *
 * Dialog and Drawer are thin presentational wrappers over this. Nothing else in
 * the app should implement any of it — there were nine separate versions of
 * this before, which is nine chances to get focus restoration wrong.
 */
export function Overlay({
  open,
  onClose,
  children,
  labelledBy,
  /** Accessible name for an overlay with no visible title to point at. */
  label,
  describedBy,
  closeOnEscape = true,
  closeOnBackdrop = true,
  align = 'center',
  className = '',
  panelClassName = '',
  panelStyle = undefined,
}) {
  const panelRef = useRef(null);
  const mouseDownOnBackdrop = useRef(false);

  useScrollLock(open);
  useFocusTrap(panelRef, open);
  useOverlayStack(open, onClose, closeOnEscape);

  if (!open) return null;

  /**
   * Track where the press STARTED. Selecting text inside the panel and
   * releasing over the backdrop fires a click on the backdrop — closing the
   * overlay and destroying whatever the user was editing.
   */
  const handleBackdropMouseDown = (e) => {
    mouseDownOnBackdrop.current = e.target === e.currentTarget;
  };

  const handleBackdropClick = (e) => {
    if (!closeOnBackdrop) return;
    if (e.target !== e.currentTarget) return;
    if (!mouseDownOnBackdrop.current) return;
    mouseDownOnBackdrop.current = false;
    onClose?.();
  };

  const alignment = {
    center: 'items-center justify-center p-4',
    right: 'items-stretch justify-end',
    left: 'items-stretch justify-start',
  }[align];

  return createPortal(
    <div
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
      className={`fixed inset-0 flex bg-[rgba(24,24,27,0.32)] ${alignment} ${className}`}
      style={{ zIndex: 'var(--ui-z-modal)' }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : label}
        aria-describedby={describedBy}
        tabIndex={-1}
        style={panelStyle}
        className={`relative flex flex-col bg-[var(--ui-surface-card)] outline-none ${panelClassName}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
