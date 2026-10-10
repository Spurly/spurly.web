import { Badge, Button, EmptyState, Skeleton } from 'src/core/primitives';
import { SCOPE_INFO } from '../constants/constants.js';

const when = (value) => (value ? new Date(value).toLocaleDateString() : 'Never');

export function TokenList({ tokens, loading, onRevoke, onCreate }) {
  if (loading) return <Skeleton className="h-16 w-full" />;
  if (tokens.length === 0) {
    return (
      <EmptyState
        compact
        title="No tokens yet"
        hint="Create one if your assistant asks for a token. Assistants that let you sign in do not need one."
        action={<Button variant="secondary" onClick={onCreate}>Create a token</Button>}
      />
    );
  }
  return (
    <ul className="flex flex-col divide-y divide-[var(--ui-border)]">
      {tokens.map((token) => (
        <li key={token.id} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-[var(--ui-text-primary)]">{token.name}</p>
            <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
              {token.display} · last used {when(token.lastUsedAt)} · {token.expiresAt ? `expires ${when(token.expiresAt)}` : 'never expires'}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {token.scopes.map((scope) => (
                <Badge key={scope} tone={scope === 'act' ? 'warning' : 'neutral'}>{SCOPE_INFO[scope]?.label ?? scope}</Badge>
              ))}
              {token.expired && <Badge tone="danger">Expired</Badge>}
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={() => onRevoke(token)}>Revoke</Button>
        </li>
      ))}
    </ul>
  );
}
