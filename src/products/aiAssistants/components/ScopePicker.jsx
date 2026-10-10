import { Checkbox } from 'src/core/primitives';
import { SCOPE_INFO, SCOPE_ORDER } from '../constants/constants.js';

/** Tick which permissions to grant. `allowed` limits the choices (the OAuth request may ask for less than all three). */
export function ScopePicker({ value, onChange, allowed = SCOPE_ORDER, disabled = false }) {
  const toggle = (scope) => {
    onChange(value.includes(scope) ? value.filter((s) => s !== scope) : [...value, scope]);
  };
  return (
    <ul className="flex flex-col gap-2.5" aria-label="Permissions">
      {SCOPE_ORDER.filter((s) => allowed.includes(s)).map((scope) => (
        <li key={scope}>
          <Checkbox
            checked={value.includes(scope)}
            onChange={() => toggle(scope)}
            disabled={disabled}
            label={
              <span className="flex flex-col">
                <span className="font-medium text-[var(--ui-text-primary)]">{SCOPE_INFO[scope].label}</span>
                <span className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">{SCOPE_INFO[scope].hint}</span>
              </span>
            }
          />
        </li>
      ))}
    </ul>
  );
}
