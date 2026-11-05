import { STEP_TYPE_MAP } from 'src/products/sequences/stepTypes.js';
import { nodeSummary } from 'src/products/sequences/treeModel.js';

/** How many leads went down each side of each branching step (v2). Renders nothing when there are no counts. */
export function BranchCounts({ steps = [], counts = null }) {
  const rows = steps.filter((n) => counts?.[n.id]);
  if (!rows.length) return null;
  return (
    <div data-testid="branch-counts">
      <p className="ui-micro !text-[var(--ui-text-secondary)] mb-1">Branches</p>
      <div className="flex flex-col gap-1.5">
        {rows.map((n) => (
          <div key={n.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)]">
            <span className="min-w-0 text-[length:var(--ui-t-label)] text-[var(--ui-text-body)] truncate" title={nodeSummary(n)}>{STEP_TYPE_MAP[n.type]?.label ?? n.type}</span>
            <span className="shrink-0 ui-num text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">Yes {counts[n.id].yes} · No {counts[n.id].no}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BranchCounts;
