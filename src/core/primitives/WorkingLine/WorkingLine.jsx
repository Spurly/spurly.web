import { useEffect, useState } from 'react';

const VERB_INTERVAL_MS = 2600;

/**
 * The working line (spurlyDESIGN.md, "The AI, made structural" §1):
 * a strip naming what Spurly is doing right now, in the present
 * participle, with a live count — "Paging… EU logistics — VP+ · imports
 * run in the background · 417 so far".
 *
 * The verb cycles through `verbs` on a 2.6s interval while the strip is
 * mounted, and a slow light sweeps it left to right, so it reads as "still
 * working" even between count changes. Both motions sit under
 * prefers-reduced-motion via the global rule in index.css.
 *
 * variant="band"  — inside a card, full-bleed, a hairline under it
 *                   (Leads: between the toolbar and the rows).
 * variant="strip" — standalone on the canvas: rounded, bordered, with the
 *                   spine (Dashboard, Campaigns, Sequence builder).
 */
export function WorkingLine({
  verbs = ['Working'],
  children,
  trailing = null,
  variant = 'strip',
  className = '',
}) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (verbs.length < 2) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % verbs.length), VERB_INTERVAL_MS);
    return () => clearInterval(t);
  }, [verbs.length]);

  const shell =
    variant === 'band'
      ? 'h-10 px-[var(--ui-card-x)] bg-[var(--ui-accent-wash)] border-b border-[var(--ui-accent-tint-strong)] sp-rise'
      : 'h-[42px] px-3.5 bg-[var(--ui-accent-wash)] border border-[var(--ui-accent-tint-strong)] rounded-[var(--ui-radius-md)] shadow-[inset_2px_0_0_var(--ui-accent)]';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative flex items-center gap-2.5 shrink-0 overflow-hidden ${shell} ${className}`}
    >
      <span className="sp-scan" aria-hidden="true" />
      <span className="relative w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--ui-accent)] sp-pulse" aria-hidden="true" />
      <span className="relative min-w-0 truncate text-[length:var(--ui-t-label)] text-[var(--ui-accent-fg)]">
        <strong className="font-medium">{verbs[index % verbs.length]}…</strong>{' '}
        <span className="text-[var(--ui-accent-fg-soft)]">{children}</span>
      </span>
      {trailing && (
        <span className="relative ml-auto shrink-0 ui-num !font-normal text-[length:var(--ui-t-meta)] text-[var(--ui-accent-fg)]">
          {trailing}
        </span>
      )}
    </div>
  );
}
