/**
 * A column the handoff draws that the product can't fill yet (Fit, Signal).
 *
 * Rendered, not hidden, so the layout reads as designed — but as an
 * unmistakable placeholder rather than a number: a faint em dash and, for a
 * reading column, the empty meter track where the bar will go. The header
 * carries the SOON tag (see `soonLabel` in columns), so no cell repeats it.
 */
export function SoonCell({ meter = false }) {
  return (
    <span className="flex flex-col gap-[5px] min-w-0" aria-label="Coming soon">
      <span className="text-[var(--ui-text-disabled)] leading-[1.2]">—</span>
      {meter && <span className="block h-[var(--ui-meter-h)] w-[72px] rounded-[var(--ui-radius-pill)] bg-[var(--ui-meter-track)]" />}
    </span>
  );
}
