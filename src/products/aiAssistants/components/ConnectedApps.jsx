import { Badge, Button, EmptyState, Skeleton } from 'src/core/primitives';
import { SCOPE_INFO } from '../constants/constants.js';

const when = (value) => (value ? new Date(value).toLocaleDateString() : 'Never');

export function ConnectedApps({ apps, loading, onDisconnect }) {
  if (loading) return <Skeleton className="h-16 w-full" />;
  if (apps.length === 0) {
    return <EmptyState compact title="No apps connected" hint="Add Spurly as a connector in Claude and approve it here. It will show up in this list." />;
  }
  return (
    <ul className="flex flex-col divide-y divide-[var(--ui-border)]">
      {apps.map((app) => (
        <li key={app.id} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-[var(--ui-text-primary)]">{app.name}</p>
            <p className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">
              Connected {when(app.connectedAt)} · last used {when(app.lastUsedAt)}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {app.scopes.map((scope) => (
                <Badge key={scope} tone={scope === 'act' ? 'warning' : 'neutral'}>{SCOPE_INFO[scope]?.label ?? scope}</Badge>
              ))}
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={() => onDisconnect(app)}>Disconnect</Button>
        </li>
      ))}
    </ul>
  );
}
