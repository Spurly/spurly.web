import { STEP_TYPE_MAP } from 'src/products/sequences/stepTypes.js';
import { stepRows } from 'src/products/sequences/journeyModel.js';

/** Per-step "entered → passed" for the right panel: green passed, grey skipped, red failed, blue still here. */
export function JourneyStepList({ steps, flow }) {
  const rows = stepRows(steps, flow);
  return (
    <div>
      <p className="ui-micro !text-[var(--ui-text-secondary)] mb-2">Per step: entered → passed</p>
      <ul className="flex flex-col gap-2.5">
        {rows.map((r) => {
          const part = (n) => `${r.entered ? (n / r.entered) * 100 : 0}%`;
          return (
            <li key={r.id}>
              <div className="flex items-center gap-2 text-[length:var(--ui-t-control)]">
                {r.branch && <span className="shrink-0 grid place-items-center w-4 h-4 rounded-[var(--ui-radius-xs)] bg-[var(--ui-surface-sunken)] text-[length:var(--ui-t-micro)] uppercase text-[var(--ui-text-secondary)]">{r.branch}</span>}
                <span className="flex-1 min-w-0 truncate text-[var(--ui-text-primary)]">{STEP_TYPE_MAP[r.type]?.label ?? r.type}</span>
                <span className="ui-num text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]">
                  {r.entered} → {r.passed}{r.failed > 0 && <span className="text-[var(--ui-danger-fg)]"> · {r.failed} failed</span>}
                </span>
              </div>
              <span className="mt-1 flex h-[var(--ui-meter-h)] rounded-full bg-[var(--ui-meter-track)] overflow-hidden" aria-hidden="true">
                <i className="block h-full bg-[var(--ui-success-dot)]" style={{ width: part(r.passed) }} />
                <i className="block h-full bg-[var(--ui-neutral-400)]" style={{ width: part(r.skipped) }} />
                <i className="block h-full bg-[var(--ui-danger-dot)]" style={{ width: part(r.failed) }} />
                <i className="block h-full bg-[var(--ui-accent-dot)]" style={{ width: part(Math.max(r.here - r.failed, 0)) }} />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default JourneyStepList;
