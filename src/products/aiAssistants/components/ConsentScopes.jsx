import { SCOPE_INFO, SCOPE_ORDER } from '../constants/constants.js';
import { ScopePicker } from './ScopePicker.jsx';

/**
 * What the asking app wants, in plain words, with the choice to grant less. `act` is never
 * pre-ticked: it starts unticked even when requested, so granting it is a deliberate click.
 */
export function ConsentScopes({ requested, value, onChange, disabled }) {
  const known = SCOPE_ORDER.filter((s) => requested.includes(s));
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
        This app is asking for {known.length === 1 ? 'one permission' : `${known.length} permissions`}. Untick anything you do not want to give it.
      </p>
      <ScopePicker value={value} onChange={onChange} allowed={known} disabled={disabled} />
      {known.includes('act') && (
        <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-tertiary)]">
          {SCOPE_INFO.act.label} also needs “Allow AI assistants to take actions” to be on in your settings. It is off until you turn it on.
        </p>
      )}
    </div>
  );
}
