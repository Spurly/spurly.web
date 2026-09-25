import { Badge } from 'src/core/primitives';
import { formatMoney } from 'src/shared/utils/money.js';

const shortDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
    : '—';

/**
 * One row per monthly charge Razorpay made (or failed to make) on a
 * subscription. Status carries its own label, not just a colour.
 */
function StatusCell({ row }) {
  return row.status === 'captured' ? (
    <Badge size="sm" tone="success">Paid</Badge>
  ) : (
    <Badge size="sm" tone="danger">Failed</Badge>
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
          <span className="truncate text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]">
            {row.userId.name}
          </span>
        )}
      </span>
    ),
  },
  {
    key: 'amount',
    label: 'Amount',
    width: 120,
    align: 'right',
    render: (_v, row) => (
      <span className="font-medium tabular-nums text-[var(--ui-text-primary)]">
        {formatMoney(row.amount, row.currency)}
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    width: 100,
    render: (_v, row) => <StatusCell row={row} />,
  },
  {
    key: 'method',
    label: 'Method',
    width: 100,
    render: (value) => (
      <span className="uppercase text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]">{value || '—'}</span>
    ),
  },
  {
    key: 'createdAt',
    label: 'Date',
    width: 120,
    render: (value, row) => (
      <span className="tabular-nums text-[var(--ui-text-secondary)]">{shortDate(row.paidAt || value)}</span>
    ),
  },
  {
    key: 'failureReason',
    label: 'Detail',
    width: 240,
    title: (row) => row.failureReason || row.razorpayPaymentId,
    render: (value, row) => (
      <span className="block truncate text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]">
        {value || `${row.razorpayPaymentId} · ${row.razorpaySubscriptionId || ''}`}
      </span>
    ),
  },
];
