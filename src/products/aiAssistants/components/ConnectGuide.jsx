import { MCP_URL } from '../constants/constants.js';

const STEPS = [
  { client: 'Claude (web and desktop)', how: 'Settings → Connectors → Add custom connector. Paste the address below and sign in when asked.' },
  { client: 'Claude Code', how: `Run: claude mcp add --transport http spurly ${MCP_URL}  then sign in with /mcp. Or pass a token with --header "Authorization: Bearer <token>".` },
  { client: 'Cursor and others', how: 'Add a remote MCP server with the address below. If it asks for a token, create one above.' },
];

export function ConnectGuide() {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">Server address</p>
        <code className="block break-all rounded-[var(--ui-radius-sm)] border border-[var(--ui-border)] p-2 text-[length:var(--ui-t-body)]" data-testid="mcp-url">{MCP_URL}</code>
      </div>
      <ul className="flex flex-col gap-2">
        {STEPS.map((step) => (
          <li key={step.client}>
            <p className="font-medium text-[var(--ui-text-primary)]">{step.client}</p>
            <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">{step.how}</p>
          </li>
        ))}
      </ul>
      <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-tertiary)]">
        An assistant reads LinkedIn text such as bios and messages. A hostile bio could try to steer it. That is why sending needs the Act permission, the switch above, and your daily limits, and why your assistant asks before it acts.
      </p>
    </div>
  );
}
