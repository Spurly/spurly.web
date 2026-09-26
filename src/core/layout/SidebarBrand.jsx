/**
 * The sidebar's brand mark: the Spurly glyph and, expanded, the word.
 * 22px glyph, 15px/600 wordmark, as the handoff draws the rail header.
 */
export function SidebarBrand({ expanded }) {
  return (
    <div className={['flex items-center min-w-0', expanded ? 'gap-[9px] flex-1' : 'justify-center'].join(' ')}>
      <img src="/spurly-icon-128.png" alt="" className="w-[22px] h-[22px] shrink-0 object-contain" />
      {expanded && (
        <span className="text-[length:var(--ui-t-title)] font-semibold tracking-[var(--ui-track-tight)] text-[var(--ui-text-primary)] truncate">
          Spurly
        </span>
      )}
    </div>
  );
}
