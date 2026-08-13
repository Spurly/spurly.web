/**
 * Row actions.
 *
 * Hidden until the row is hovered or focused within, which keeps a long table
 * from reading as a wall of buttons. `group-hover` pairs with the `group` class
 * Row already sets. Always visible to keyboard users via focus-within.
 */
export function ActionsCell({ children, alwaysVisible = false }) {
  return (
    <span
      onClick={(e) => e.stopPropagation()}
      className={[
        'flex items-center gap-0.5 justify-end w-full',
        alwaysVisible
          ? ''
          : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-[var(--ui-dur-fast)]',
      ].join(' ')}
    >
      {children}
    </span>
  );
}
