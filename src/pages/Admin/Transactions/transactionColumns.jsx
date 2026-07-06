import { Badge } from 'src/common/components/Badge';

/**
 * Map a transaction type to a Badge tone.
 * Any *_DEDUCTION is a debit (danger); credits/bonuses/refunds are positive
 * (success); manual adjustments are informational.
 */
function typeTone(type = '') {
  if (type.includes('DEDUCTION')) return 'danger';
  if (type === 'ADMIN_ADJUSTMENT') return 'info';
  return 'success';
}

const isDebit = (type = '') => type.includes('DEDUCTION');

/**
 * Column definitions for the Admin Transactions DataTable (static — no row
 * actions). Data is populated with `userId` -> { name, email }.
 */
export const transactionColumns = [
  {
    key: 'createdAt',
    label: 'Date',
    minWidth: '150px',
    render: (value) => (
      <span className="text-[12px] text-[var(--text-tertiary)] tabular-nums whitespace-nowrap">
        {value
          ? `${new Date(value).toLocaleDateString()} ${new Date(value).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : '—'}
      </span>
    ),
  },
  {
    key: 'user',
    label: 'User',
    minWidth: '190px',
    render: (_v, row) => (
      <div className="leading-tight">
        <p className="text-[13px] font-medium text-[var(--text-primary)]">
          {row.userId?.name || 'Unknown'}
        </p>
        <p className="text-[12px] text-[var(--text-tertiary)]">{row.userId?.email || ''}</p>
      </div>
    ),
  },
  {
    key: 'type',
    label: 'Type',
    minWidth: '150px',
    render: (value) => <Badge tone={typeTone(value)}>{value}</Badge>,
  },
  {
    key: 'feature',
    label: 'Feature',
    minWidth: '150px',
    render: (value) => <Badge tone="neutral">{value || '—'}</Badge>,
  },
  {
    key: 'amount',
    label: 'Amount',
    align: 'right',
    minWidth: '100px',
    render: (value, row) => (
      <span
        className="font-semibold tabular-nums"
        style={{ color: isDebit(row.type) ? 'var(--red)' : 'var(--green)' }}
      >
        {isDebit(row.type) ? '-' : '+'}
        {(value ?? 0).toFixed(1)}
      </span>
    ),
  },
  {
    key: 'balanceBefore',
    label: 'Balance before',
    align: 'right',
    minWidth: '120px',
    render: (value) => (
      <span className="text-[var(--text-secondary)] tabular-nums">{(value ?? 0).toFixed(1)}</span>
    ),
  },
  {
    key: 'balanceAfter',
    label: 'Balance after',
    align: 'right',
    minWidth: '120px',
    render: (value) => (
      <span className="text-[var(--text-secondary)] tabular-nums">{(value ?? 0).toFixed(1)}</span>
    ),
  },
  {
    key: 'reason',
    label: 'Reason',
    minWidth: '180px',
    render: (value) => (
      <span className="text-[13px] text-[var(--text-secondary)]">{value || '—'}</span>
    ),
  },
];
