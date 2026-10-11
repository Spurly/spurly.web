/**
 * A cell value drawn as a chip: a small raised object instead of bare text.
 * Use it for values the reader scans or compares down a column (title,
 * seniority, degree). Pass `onClick` to make it a real button (filter by this
 * value, open the company); the chip then lifts on hover and presses on click.
 *
 * Cell owns truncation, so the label sits in its own truncating span and the
 * chip never grows past its column.
 */
export function ChipCell({ value, icon = null, tone = 'neutral', mono = false, dot = false, onClick, title }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-[var(--ui-text-tertiary)]">—</span>;
  }

  const interactive = typeof onClick === 'function';
  const Root = interactive ? 'button' : 'span';

  return (
    <Root
      type={interactive ? 'button' : undefined}
      title={title ?? (typeof value === 'string' ? value : undefined)}
      onClick={
        interactive
          ? (e) => {
              e.stopPropagation();
              onClick(e);
            }
          : undefined
      }
      data-tone={tone === 'neutral' ? undefined : tone}
      data-size="sm"
      data-mono={mono ? '' : undefined}
      data-interactive={interactive ? '' : undefined}
      className="ui-chip"
    >
      {dot && <span className="w-[6px] h-[6px] rounded-full shrink-0 bg-current opacity-70" aria-hidden="true" />}
      {icon}
      <span className="truncate">{value}</span>
    </Root>
  );
}
