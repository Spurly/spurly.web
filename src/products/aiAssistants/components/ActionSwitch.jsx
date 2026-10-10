import { SwitchRow } from 'src/core/primitives';

/** The second lock on anything that acts. Off by default. */
export function ActionSwitch({ enabled, loading, saving, onChange }) {
  return (
    <SwitchRow
      title="Allow AI assistants to take actions"
      hint="Lets an assistant with the Act permission start campaigns, send messages and answer invitations, within your usual daily limits. Off, they can only read and draft."
      checked={enabled}
      onChange={onChange}
      disabled={loading || saving}
    />
  );
}
