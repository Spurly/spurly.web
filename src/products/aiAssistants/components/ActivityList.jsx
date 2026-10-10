import { Badge, EmptyState, Skeleton } from 'src/core/primitives';

export function ActivityList({ calls, loading }) {
  if (loading) return <Skeleton className="h-16 w-full" />;
  if (calls.length === 0) return <EmptyState compact title="Nothing yet" hint="Calls from your assistants show up here for 30 days. Only the tool name and result are kept, never message text." />;
  return (
    <ul className="flex flex-col divide-y divide-[var(--ui-border)]">
      {calls.map((call) => (
        <li key={call.id} className="flex items-center gap-3 py-2">
          <span className="min-w-0 flex-1 truncate text-[var(--ui-text-primary)]">{call.tool}</span>
          <span className="text-[length:var(--ui-t-body)] text-[var(--ui-text-secondary)]">{call.clientName ?? ''}</span>
          <Badge tone={call.ok ? 'success' : 'danger'}>{call.ok ? 'OK' : call.errorCode ?? 'Failed'}</Badge>
          <span className="w-36 text-right text-[length:var(--ui-t-body)] text-[var(--ui-text-tertiary)]">{call.at ? new Date(call.at).toLocaleString() : ''}</span>
        </li>
      ))}
    </ul>
  );
}
