import { useCountUp } from './useCountUp.js';
import { fmtNum } from './format.js';

/** A number that eases up to its value. `format` defaults to a grouped integer. */
export function CountUp({ value, format = fmtNum, duration, className = '' }) {
  const shown = useCountUp(value, duration);
  return <span className={`tabular-nums ${className}`}>{value == null ? '—' : format(shown)}</span>;
}
