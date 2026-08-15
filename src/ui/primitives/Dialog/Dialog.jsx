import { useId } from 'react';
import { X } from 'lucide-react';
import { Overlay } from '../Overlay';
import { IconButton } from '../IconButton';

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
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
      panelClassName={`w-full ${SIZES[size] ?? SIZES.md} max-h-[calc(100vh-4rem)] rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] shadow-[var(--ui-shadow-lg)]`}
    >
      {(title || !hideClose) && (
        <div className="flex items-start gap-3 px-4 pt-4 pb-3 shrink-0">
          <div className="min-w-0 flex-1">
            {title && (
              <h2
                id={titleId}
                className="text-[14px] font-medium text-[var(--ui-text-primary)] leading-snug"
              >
                {title}
              </h2>
            )}
            {description && (
              <p id={descId} className="mt-1 text-[12px] text-[var(--ui-text-secondary)] leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {!hideClose && (
            <IconButton size="sm" variant="ghost" label="Close" icon={<X size={15} />} onClick={onClose} />
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">{children}</div>

      {footer && (
        <div className="flex items-center justify-end gap-2 px-4 py-3 shrink-0 border-t border-[var(--ui-border-hairline)]">
          {footer}
        </div>
      )}
    </Overlay>
  );
}
