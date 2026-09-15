/**
 * The sidebar's identity block — logo plus wordmark.
 *
 * Used to be `ProductSwitcher`: a dropdown that swapped the ENTIRE nav tree
 * between "Capture" and "Hub" workspaces. That's gone (see DashboardLayout —
 * both products now render as grouped sections in one sidebar, all the time),
 * so there is nothing left to switch. What remains is honestly just a static
 * brand mark, and it is named like one now rather than carrying a name for a
 * behaviour it no longer has — the same call this codebase already made for
 * Input vs Field and Tabs vs PageTabs (see ARCHITECTURE.md §1).
 */
export function SidebarBrand({ expanded }) {
  return (
    <div
      className={[
        'flex items-center h-8 min-w-0',
        expanded ? 'px-1.5 gap-2 flex-1' : 'w-8 justify-center',
      ].join(' ')}
    >
      <img src="/Spurly Icon Square.png" alt="" className="w-5 h-5 shrink-0 object-contain" />
      {expanded && (
        <span className="text-[var(--ui-t-body)] font-medium tracking-[-0.006em] text-[var(--ui-text-primary)] truncate">
          Spurly
        </span>
      )}
    </div>
  );
}
