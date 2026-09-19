import { useId } from 'react';
import { CloseIcon } from 'src/core/icons';
import { Overlay } from '../Overlay';
import { IconButton } from '../IconButton';

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-[660px]',
};

/**
 * Centred modal.
 *
 * Header, body and footer are fixed slots so every dialog in the app has the
 * same rhythm: title top-left, close top-right, actions bottom-right with the
 * confirming action last. The body scrolls; the header and footer don't, so
 * the primary action is always reachable in a long form.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer = null,
  children,
  closeOnBackdrop = true,
  closeOnEscape = true,
  hideClose = false,
}) {
  const titleId = useId();
  const descId = useId();

  return (
    <Overlay
      open={open}
      onClose={onClose}
      labelledBy={title ? titleId : undefined}
      describedBy={description ? descId : undefined}
      closeOnBackdrop={closeOnBackdrop}
      closeOnEscape={closeOnEscape}
      panelClassName={`w-full ${SIZES[size] ?? SIZES.md} max-h-[calc(100vh-3rem)] rounded-[var(--ui-radius-xl)] border border-[var(--ui-border)] shadow-[var(--ui-shadow-modal)] overflow-hidden`}
    >
      {(title || !hideClose) && (
        <div className="flex items-start gap-3 px-5 pt-[18px] pb-3 shrink-0">
          <div className="min-w-0 flex-1">
            {title && (
              <h2
                id={titleId}
                className="text-[length:var(--ui-t-figure)] font-semibold tracking-[var(--ui-track-tight)] text-[var(--ui-text-primary)] leading-snug"
              >
                {title}
              </h2>
            )}
            {description && (
              <p id={descId} className="mt-1 text-[length:var(--ui-t-control)] text-[var(--ui-text-secondary)] leading-[1.45]">
                {description}
              </p>
            )}
          </div>
          {!hideClose && (
            <IconButton size="sm" variant="ghost" label="Close" icon={<CloseIcon size={15} strokeWidth={2.2} />} onClick={onClose} className="!w-7 !h-7 !text-[var(--ui-text-quaternary)]" />
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5">{children}</div>

      {footer && (
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 shrink-0 border-t border-[var(--ui-neutral-150)] bg-[var(--ui-surface-header)]">
          {footer}
        </div>
      )}
    </Overlay>
  );
}
