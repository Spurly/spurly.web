import { Checkbox } from 'src/core/primitives';
import { availableExitRules, exitError } from 'src/products/sequences/treeModel.js';
import { sequencesStrings } from '../strings.js';

const t = sequencesStrings.exit;

/** Sequence-level exit rules (D58). Only rules that mean something for this workspace are listed. */
export function ExitRulesPanel({ exit = {}, onChange, inbox = true, isOrg = false, readOnly = false, bare = false }) {
  const rules = availableExitRules({ inbox, isOrg });
  const error = exitError(exit);
  const set = (patch) => onChange?.({ ...exit, ...patch });
  return (
    <div className={bare ? 'flex flex-col gap-2' : 'flex flex-col gap-2 rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)] px-3.5 py-3'} data-testid="exit-rules">
      {!bare && <p className="ui-micro !text-[var(--ui-text-secondary)]">{t.title}</p>}
      {!inbox && <p className="text-[length:var(--ui-t-micro)] text-[var(--ui-text-tertiary)]">{t.repliesElsewhere}</p>}
      {rules.map((r) => (
        <Checkbox key={r.key} label={r.label} checked={exit[r.key] === true} disabled={readOnly} onChange={(e) => set({ [r.key]: e.target.checked })} />
      ))}
      <label className="flex items-center gap-1.5 text-[length:var(--ui-t-label)] text-[var(--ui-text-secondary)]">
        {t.maxDaysBefore}
        <input
          type="number"
          min={1}
          max={365}
          value={exit.maxDays ?? ''}
          disabled={readOnly}
          aria-label="Maximum days"
          onChange={(e) => set({ maxDays: e.target.value === '' ? undefined : Number(e.target.value) })}
          className="w-16 h-6 text-center text-[length:var(--ui-t-micro)] rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] bg-[var(--ui-surface-card)]"
        />
        {t.maxDaysAfter}
      </label>
      {error && <p className="text-[length:var(--ui-t-micro)] text-[var(--ui-danger-fg)]">{error}</p>}
    </div>
  );
}

export default ExitRulesPanel;
