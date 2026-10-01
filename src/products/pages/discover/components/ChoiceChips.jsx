import { Button } from 'src/core/primitives';

/**
 * Multi-select chips (company size, work type, job type). Same shape as
 * FilterPills, but several can be on at once, so each is a toggle
 * (`aria-pressed`) rather than a radio.
 */
export function ChoiceChips({ label, options, value, onChange, disabled = false }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="ui-micro !text-[var(--ui-text-secondary)]">{label}</span>
      <div role="group" aria-label={label} className="flex items-center gap-1.5 flex-wrap">
        {options.map((opt) => {
          const on = value.includes(opt.id);
          return (
            <Button
              key={opt.id}
              size="sm"
              variant={on ? 'accent' : 'secondary'}
              aria-pressed={on}
              disabled={disabled}
              onClick={() => toggle(opt.id)}
              className="!h-7 !px-2.5 !rounded-[var(--ui-radius-pill)]"
            >
              {opt.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
