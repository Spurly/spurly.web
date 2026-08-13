import { calendarDate, calendarAge } from 'src/common/utils/dates';

/**
 * A DAY-granular date, with its age as a muted suffix.
 *
 * Distinct from DateCell, which renders a precise instant as "3d ago". Some
 * values genuinely have no time component — LinkedIn only says "Connected on
 * August 10, 2026" — and rendering those as relative time implies a precision
 * that isn't there.
 */
export function CalendarCell({ value, emptyHint = 'Not captured yet' }) {
  const date = calendarDate(value);
  if (!date) {
    return (
      <span className="text-[var(--ui-text-tertiary)]" title={emptyHint}>
        —
      </span>
    );
  }

  return (
    <span className="text-[var(--ui-text-secondary)] tabular-nums whitespace-nowrap">
      {date}
      <span className="ml-1.5 text-[var(--ui-text-tertiary)]">{calendarAge(value)}</span>
    </span>
  );
}
