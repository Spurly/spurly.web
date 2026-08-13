import { Badge } from 'src/ui/primitives';
import { describeOutreach } from 'src/common/utils/outreach';

/**
 * Outreach status for one person.
 *
 * Domain-aware, so it lives with the feature rather than in the shared cell
 * vocabulary — it knows what a connection request is. Rendered `minimal`: a
 * coloured dot and neutral text. Down a hundred rows a column of tinted pills
 * becomes the loudest thing on screen, which is backwards — the names should
 * be. The dot is enough to find the exceptions.
 */
const TONE_MAP = {
  neutral: 'neutral',
  warning: 'warning',
  primary: 'accent',
  success: 'success',
  danger: 'danger',
};

export function OutreachStatusCell({ outreach }) {
  const { label, tone, relative, title } = describeOutreach(outreach);
  const isNone = (outreach?.status || 'none') === 'none';

  return (
    <Badge variant="minimal" tone={TONE_MAP[tone] ?? 'neutral'} dot={!isNone} title={title}>
      <span className={isNone ? 'text-[var(--ui-text-tertiary)]' : undefined}>{label}</span>
      {relative && (
        <span className="ml-1 text-[var(--ui-text-tertiary)] tabular-nums">· {relative}</span>
      )}
    </Badge>
  );
}
