/**
 * "1.2K" / "412" / "99+"-style compact counts, for anywhere a reading has to
 * fit a fixed-width nav row or badge rather than a table cell. Native
 * Intl.NumberFormat rather than a hand-rolled K/M ladder — it already knows
 * the rounding and locale conventions, and this is the one thing it's for.
 */
export function formatCompactNumber(value) {
  if (value == null || Number.isNaN(value)) return '';
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
