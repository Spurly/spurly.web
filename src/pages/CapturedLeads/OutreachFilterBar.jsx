import { AlertTriangle, X } from 'lucide-react';
import { OUTREACH_FILTERS } from 'src/common/utils/outreach';

const CHIP_TONES = {
  none: 'var(--text-tertiary)',
  invited: 'var(--amber)',
  connected: 'var(--sky)',
  messaged: 'var(--brand-purple)',
  replied: 'var(--green)',
  failed: 'var(--red)',
};

function Chip({ id, label, count, active, onClick }) {
  const dot = CHIP_TONES[id];
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[999px] text-[12.5px] font-medium whitespace-nowrap transition-colors"
      style={
        active
          ? { background: 'var(--accent-tint)', color: 'var(--brand-purple)', fontWeight: 600 }
          : { color: 'var(--text-secondary)' }
      }
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />}
      {label}
      {typeof count === 'number' && (
        <span className="tabular-nums" style={{ opacity: 0.6 }}>
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * Weekly LinkedIn invite budget.
 *
 * LinkedIn caps invitations per week account-wide, which makes it the binding
 * constraint on the whole product — so it's shown persistently, not buried in a
 * campaign. Counted across every campaign from the outreach event log.
 */
function SendBudget({ budget }) {
  const { weekUsed = 0, weeklyLimit = 0, weeklyRemaining = 0 } = budget || {};
  if (!weeklyLimit) return null;

  const pct = Math.min(100, Math.round((weekUsed / weeklyLimit) * 100));
  const tone =
    weeklyRemaining <= 0 ? 'var(--red)' : pct >= 80 ? 'var(--amber)' : 'var(--text-secondary)';

  return (
    <div
      className="flex items-center gap-2 shrink-0"
      title={`${weekUsed} of ${weeklyLimit} LinkedIn connection requests sent in the last 7 days, across all campaigns.`}
    >
      <span className="text-[12px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
        Invites this week
      </span>
      <div
        className="w-16 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--border-hairline)' }}
      >
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: tone }} />
      </div>
      <span className="text-[12.5px] font-semibold tabular-nums" style={{ color: tone }}>
        {weekUsed}/{weeklyLimit}
      </span>
    </div>
  );
}

/**
 * Filter chips + weekly send budget, sitting between the degree tabs and the
 * People table. "Show me everyone I haven't contacted" is the most common
 * question in this workflow, so it's one click.
 */
export function OutreachFilterBar({ activeFilter, onFilterChange, summary }) {
  const counts = summary?.statusCounts || {};
  const needsAttention = summary?.needsAttention || 0;

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-2 border-b border-[var(--separator)] overflow-x-auto">
      <div className="flex items-center gap-1 min-w-0">
        {OUTREACH_FILTERS.map((filter) => (
          <Chip
            key={filter.id}
            id={filter.id === 'all' ? null : filter.id}
            label={filter.label}
            count={filter.id === 'all' ? summary?.total : counts[filter.id]}
            active={activeFilter === filter.id}
            onClick={() => onFilterChange(filter.id)}
          />
        ))}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {/* Failed sends get a conditional alert rather than a permanent chip
            that reads 0 on a healthy account. Toggles the filter on and off, so
            clicking it can't strand you in a filtered view with no way back. */}
        {needsAttention > 0 && (
          <button
            type="button"
            onClick={() => onFilterChange(activeFilter === 'failed' ? 'all' : 'failed')}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[999px] text-[12.5px] font-semibold whitespace-nowrap transition-colors"
            style={
              activeFilter === 'failed'
                ? { background: 'var(--red-tint)', color: 'var(--red)' }
                : { color: 'var(--red)' }
            }
          >
            <AlertTriangle size={13} />
            {needsAttention} need{needsAttention === 1 ? 's' : ''} attention
            {activeFilter === 'failed' && <X size={12} className="ml-0.5" />}
          </button>
        )}
        <SendBudget budget={summary?.connectionBudget} />
      </div>
    </div>
  );
}
