import { Badge } from 'src/core/primitives';

import { shortDate } from './format.js';

/** Status carries its own label, not just a colour. */
export function OrgStatusBadge({ status }) {
  return status === 'suspended' ? (
    <Badge size="sm" tone="danger">Suspended</Badge>
  ) : (
    <Badge size="sm" tone="success">Active</Badge>
  );
}

/**
 * One row per org: who holds it (partner), how many LinkedIn accounts are
 * connected now, and the 30-day peak that the partner is billed from outside
 * the app. Counts only.
 */
export const orgColumns = [
  {
    key: 'org',
    label: 'Organization',
    width: 260,
    render: (_v, row) => (
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-[var(--ui-text-primary)]">{row.name || row.externalId}</span>
        {row.name && (
          <span className="truncate text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]">{row.externalId}</span>
        )}
      </span>
    ),
  },
  {
    key: 'partner',
    label: 'Partner',
    width: 150,
    render: (_v, row) => (
      <span className="truncate text-[var(--ui-text-secondary)]">{row.partner?.name || row.partner?.slug || '—'}</span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    width: 110,
    render: (_v, row) => <OrgStatusBadge status={row.status} />,
  },
  {
    key: 'connected',
    label: 'Connected',
    width: 110,
    align: 'right',
    render: (_v, row) => (
      <span className="font-medium tabular-nums text-[var(--ui-text-primary)]">{row.accounts?.connected ?? 0}</span>
    ),
  },
  {
    key: 'peak',
    label: '30-day peak',
    width: 120,
    align: 'right',
    title: (row) => `${row.usage?.distinct ?? 0} distinct members in the last 30 days`,
    render: (_v, row) => (
      <span className="tabular-nums text-[var(--ui-text-secondary)]">{row.usage?.peak?.count ?? 0}</span>
    ),
  },
  {
    key: 'createdAt',
    label: 'Created',
    width: 110,
    render: (value) => <span className="tabular-nums text-[var(--ui-text-secondary)]">{shortDate(value)}</span>,
  },
];
