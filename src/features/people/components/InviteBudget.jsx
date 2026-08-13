import { Tooltip } from 'src/ui/primitives';

/**
 * Weekly LinkedIn invite budget.
 *
 * LinkedIn caps invitations per week account-wide, which makes it the binding
 * constraint on the entire product — so it is shown persistently rather than
 * buried inside a campaign. Counted across every campaign from the outreach
 * event log.
 */
export function InviteBudget({ budget }) {
  const { weekUsed = 0, weeklyLimit = 0, weeklyRemaining = 0 } = budget || {};
  if (!weeklyLimit) return null;

  const pct = Math.min(100, Math.round((weekUsed / weeklyLimit) * 100));
  const tone =
    weeklyRemaining <= 0
      ? 'var(--ui-danger)'
      : pct >= 80
        ? 'var(--ui-warning)'
        : 'var(--ui-text-secondary)';

  return (
    <Tooltip
      content={`${weekUsed} of ${weeklyLimit} connection requests sent in the last 7 days, across all campaigns.`}
      placement="bottom"
    >
      <span className="flex items-center gap-2 shrink-0 cursor-default">
        <span className="text-[12px] text-[var(--ui-text-tertiary)]">Invites this week</span>
        <span
          className="w-14 h-1 rounded-full overflow-hidden bg-[var(--ui-border)]"
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-full transition-[width] duration-[var(--ui-dur-base)]"
            style={{ width: `${pct}%`, background: tone }}
          />
        </span>
        <span className="text-[12px] font-medium tabular-nums" style={{ color: tone }}>
          {weekUsed}/{weeklyLimit}
        </span>
      </span>
    </Tooltip>
  );
}
