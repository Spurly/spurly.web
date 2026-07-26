import { describeOutreach } from 'src/common/utils/outreach';

const TONE_STYLES = {
  neutral: { background: 'var(--surface-sunken)', color: 'var(--text-tertiary)', dot: 'var(--text-tertiary)' },
  warning: { background: 'var(--amber-tint)', color: 'var(--amber)', dot: 'var(--amber)' },
  info: { background: 'var(--sky-tint)', color: 'var(--sky)', dot: 'var(--sky)' },
  primary: { background: 'var(--accent-tint)', color: 'var(--brand-purple)', dot: 'var(--brand-purple)' },
  success: { background: 'var(--green-tint)', color: 'var(--green)', dot: 'var(--green)' },
  danger: { background: 'var(--red-tint)', color: 'var(--red)', dot: 'var(--red)' },
};

/**
 * Single outreach status pill for the People table.
 *
 * Replaces the "connection sent date / message sent date" column pair: two raw
 * date columns are mostly empty, can't be scanned, and can't express repeat
 * outreach. One pill carries the state, the recency and the repeat count, with
 * the exact timestamps on hover.
 */
export function OutreachStatusCell({ outreach }) {
  const { label, tone, relative, title } = describeOutreach(outreach);
  const style = TONE_STYLES[tone] || TONE_STYLES.neutral;
  const isNone = (outreach?.status || 'none') === 'none';

  return (
    <span
      title={title}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[999px] text-[12px] font-semibold whitespace-nowrap tracking-[0.01em]"
      style={{ background: style.background, color: style.color }}
    >
      {!isNone && (
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: style.dot }} />
      )}
      {label}
      {relative && (
        <span className="font-medium tabular-nums" style={{ opacity: 0.75 }}>
          · {relative}
        </span>
      )}
    </span>
  );
}
