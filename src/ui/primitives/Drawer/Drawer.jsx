import { useId } from 'react';
import { X } from 'lucide-react';
import { Overlay } from '../Overlay';
import { IconButton } from '../IconButton';

const WIDTHS = { sm: 360, md: 440, lg: 560 };

/**
 * Side-anchored panel.
 *
 * Same machinery as Dialog — it is a modal, just anchored to an edge. The
 * distinction is only about how much context the user needs behind it: a
 * dialog interrupts, a drawer inspects.
 *
 * The width goes on the panel itself, not on a child. A `w-full` panel inside
 * a `justify-end` flex row fills the whole viewport, which silently cancels the
 * alignment — the panel covers the app and its content sits at the far left.
 */
export function Drawer({
  open,
  onClose,
  title,
  eyebrow,
  /**
   * Set false when the panel's own content already names what you're looking
   * at — repeating it in a header band costs 40px and says the same thing
   * twice. The close button then floats over the top-right corner, and `title`
   * is still required: it becomes the dialog's accessible name.
   */
  showHeader = true,
  size = 'md',
  side = 'right',
  footer = null,
  children,
  closeOnBackdrop = true,
  closeOnEscape = true,
}) {
  const titleId = useId();

  return (
    <Overlay
      open={open}
      onClose={onClose}
      align={side}
      labelledBy={title && showHeader ? titleId : undefined}
      label={title}
      closeOnBackdrop={closeOnBackdrop}
      closeOnEscape={closeOnEscape}
      panelStyle={{ width: WIDTHS[size] ?? WIDTHS.md, maxWidth: '100vw' }}
      panelClassName={`h-full shadow-[var(--ui-shadow-lg)] ${
        side === 'right'
          ? 'border-l border-[var(--ui-border)]'
          : 'border-r border-[var(--ui-border)]'
      }`}
    >
      {showHeader ? (
        <div className="flex items-center gap-3 shrink-0 border-b border-[var(--ui-border-hairline)]"
          style={{ height: 'var(--ui-band)', paddingInline: 'var(--ui-pad-x)' }}>
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ui-text-tertiary)] leading-none">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2
                id={titleId}
                className="text-[13px] font-medium text-[var(--ui-text-primary)] truncate leading-tight mt-1"
              >
                {title}
              </h2>
            )}
          </div>
          <IconButton size="sm" variant="ghost" label="Close" icon={<X size={15} />} onClick={onClose} />
        </div>
      ) : (
        /* Above any sticky content inside the scroll area, so it stays
           clickable however far down the panel is scrolled. */
        <IconButton
          size="sm"
          variant="ghost"
          label="Close"
          icon={<X size={15} />}
          onClick={onClose}
          className="absolute top-2 right-2 z-20"
        />
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>

      {footer && (
        <div className="flex items-center justify-end gap-2 px-4 py-3 shrink-0 border-t border-[var(--ui-border-hairline)]">
          {footer}
        </div>
      )}
    </Overlay>
  );
}
