import { Check } from 'lucide-react';

/**
 * Three-step progress for the import wizard. A visible "where am I, how much
 * is left" removes the main source of hesitation in a multi-step flow, and a
 * finished step turning into a ✓ is its own small nudge onward.
 */
export const IMPORT_STEPS = [
  { id: 'upload', label: 'Upload' },
  { id: 'map', label: 'Match columns' },
  { id: 'review', label: 'Review & import' },
];

export function ImportStepper({ step }) {
  const current = IMPORT_STEPS.findIndex((s) => s.id === step);
  return (
    <ol className="flex items-center gap-2 min-w-0" aria-label="Import progress">
      {IMPORT_STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.id} className="flex items-center gap-2 min-w-0" aria-current={active ? 'step' : undefined}>
            {i > 0 && <span aria-hidden="true" className={`w-6 h-px ${done || active ? 'bg-[var(--ui-accent)]' : 'bg-[var(--ui-border)]'}`} />}
            <span
              className={[
                'w-5 h-5 shrink-0 rounded-full grid place-items-center text-[length:var(--ui-t-micro)] font-medium',
                done
                  ? 'bg-[var(--ui-accent)] text-[var(--ui-accent-on)]'
                  : active
                    ? 'bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)] ring-1 ring-[var(--ui-accent)]'
                    : 'bg-[var(--ui-surface-sunken)] text-[var(--ui-text-tertiary)]',
              ].join(' ')}
            >
              {done ? <Check size={11} strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={`hidden sm:inline text-[length:var(--ui-t-label)] whitespace-nowrap ${
                active ? 'font-medium text-[var(--ui-text-primary)]' : 'text-[var(--ui-text-tertiary)]'
              }`}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
