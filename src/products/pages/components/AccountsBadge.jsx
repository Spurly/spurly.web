import { Badge } from 'src/core/primitives';

/** `N accounts` for something that sends from several LinkedIn accounts; renders nothing for solo or single-account rows. */
export const isPoolRow = (row) => row?.senderMode === 'pool' && Array.isArray(row.senders) && row.senders.length > 0;

export function AccountsBadge({ row, size = 'sm' }) {
  if (!isPoolRow(row)) return null;
  const n = row.senders.length;
  return (
    <Badge tone="neutral" size={size} title={`Sends from ${n} LinkedIn accounts`}>
      {n} accounts
    </Badge>
  );
}
