/**
 * Plain text. Deliberately does NOT truncate — Cell owns that. If this
 * component clamped as well, two components would be responsible for the same
 * thing and they would eventually disagree, which is exactly how the old table
 * ended up with some columns clamping and others not.
 */
export function TextCell({ value, tone = 'primary' }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-[var(--ui-text-tertiary)]">—</span>;
  }

  const tones = {
    primary: 'text-[var(--ui-text-primary)]',
    secondary: 'text-[var(--ui-text-secondary)]',
    tertiary: 'text-[var(--ui-text-tertiary)]',
  };

  return <span className={tones[tone] ?? tones.primary}>{value}</span>;
}
