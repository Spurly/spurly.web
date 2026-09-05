import { Badge } from 'src/ui/primitives';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const shortDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
    : '—';

/**
 * Payment status, encoded in shape and words as well as colour.
 *
 * Every state ships with its own label rather than relying on the badge hue —
 * a reader who can't distinguish the greens from the reds still reads
 * "Failed". The extra "Stuck" and "Expired" states exist because "paid" alone
 * doesn't answer the question an admin is actually asking, which is whether
 * the customer can use the product right now.
 */
function StatusCell({ row }) {
  if (row.status === 'paid') {
    return row.accessLive ? (
      <Badge size="sm" tone="success">Active</Badge>
    ) : (
      <Badge size="sm">Expired</Badge>
    );
  }
  if (row.status === 'failed') {
    return <Badge size="sm" tone="danger">Failed</Badge>;
  }
  // 'created' — still waiting on confirmation. Past an hour that's abnormal
  // and usually means webhooks aren't arriving.
  return row.isStuck ? (
    <Badge size="sm" tone="warning">Stuck</Badge>
  ) : (
    <Badge size="sm" tone="info">Pending</Badge>
  );
}

export const paymentColumns = [
  {
    key: 'account',
    label: 'Account',
    width: 240,
    render: (_v, row) => (
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-[var(--ui-text-primary)]">
          {row.userId?.email || 'deleted account'}
        </span>
        {row.userId?.name && (
          <span className="truncate text-[11px] text-[var(--ui-text-secondary)]">
            {row.userId.name}
          </span>
        )}
      </span>
    ),
  },
  {
    key: 'amount',
    label: 'Charged',
    width: 130,
    align: 'right',
    render: (_v, row) => (
      <span className="flex flex-col items-end tabular-nums">
        <span className="font-medium text-[var(--ui-text-primary)]">{money(row.amount)}</span>
        {row.discount > 0 && (
          <span className="text-[11px] text-[var(--ui-text-secondary)] line-through">
            {money(row.baseAmount)}
          </span>
        )}
      </span>
    ),
  },
  {
    key: 'appliedPromoCode',
    label: 'Promo',
    width: 130,
    render: (value) =>
      value ? (
        <code className="rounded-[var(--ui-radius-xs)] bg-[var(--ui-surface-sunken)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--ui-text-secondary)]">
          {value}
        </code>
      ) : (
        <span className="text-[var(--ui-text-tertiary)]">—</span>
      ),
  },
  {
    key: 'status',
    label: 'Status',
    width: 110,
    render: (_v, row) => <StatusCell row={row} />,
  },
  {
    key: 'periodEnd',
    label: 'Access until',
    width: 130,
    render: (value, row) =>
      row.status === 'paid' ? (
        <span className="tabular-nums text-[var(--ui-text-secondary)]">{shortDate(value)}</span>
      ) : (
        <span className="text-[var(--ui-text-tertiary)]">—</span>
      ),
  },
  {
    key: 'createdAt',
    label: 'Created',
    width: 120,
    render: (value) => (
      <span className="tabular-nums text-[var(--ui-text-secondary)]">{shortDate(value)}</span>
    ),
  },
  {
    key: 'failureReason',
    label: 'Detail',
    width: 220,
    title: (row) => row.failureReason || row.cashfreeOrderId,
    render: (value, row) => (
      <span className="block truncate text-[11px] text-[var(--ui-text-secondary)]">
        {value || row.cashfreeOrderId}
      </span>
    ),
  },
];
