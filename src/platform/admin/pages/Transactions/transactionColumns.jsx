import { Badge } from 'src/ui/primitives';
import { TextCell, DateCell } from 'src/platform/DataTable';

/**
 * Any *_DEDUCTION is a debit; credits, bonuses and refunds are positive;
 * manual adjustments are informational.
 */
const isDebit = (type = '') => type.includes('DEDUCTION');

function typeTone(type = '') {
  if (isDebit(type)) return 'danger';
  if (type === 'ADMIN_ADJUSTMENT') return 'info';
  return 'success';
}

export const transactionColumns = [
  { key: 'createdAt', label: 'Date', width: 140, render: (value) => <DateCell value={value} /> },
  {
    key: 'user',
    label: 'User',
    width: 220,
    title: (row) => `${row.userId?.name || 'Unknown'} · ${row.userId?.email || ''}`,
    render: (_v, row) => (
      <span className="flex items-baseline gap-1.5 min-w-0">
        <span className="truncate font-medium text-[var(--ui-text-primary)]">
          {row.userId?.name || 'Unknown'}
        </span>
        <span className="truncate text-[11px] text-[var(--ui-text-tertiary)]">
          {row.userId?.email || ''}
        </span>
      </span>
    ),
  },
  {
    key: 'type',
    label: 'Type',
    width: 190,
    render: (value) => (
      <Badge variant="minimal" tone={typeTone(value)} dot>
        {value}
      </Badge>
    ),
  },
  { key: 'feature', label: 'Feature', width: 160, render: (value) => <TextCell value={value} tone="secondary" /> },
  {
    key: 'amount',
    label: 'Amount',
    width: 110,
    align: 'right',
    render: (value, row) => (
      <span
        className="font-medium tabular-nums"
        style={{ color: isDebit(row.type) ? 'var(--ui-danger-fg)' : 'var(--ui-success-fg)' }}
      >
        {isDebit(row.type) ? '−' : '+'}
        {(value ?? 0).toFixed(1)}
      </span>
    ),
  },
  {
    key: 'balanceBefore',
    label: 'Before',
    width: 110,
    align: 'right',
    render: (value) => (
      <span className="tabular-nums text-[var(--ui-text-tertiary)]">{(value ?? 0).toFixed(1)}</span>
    ),
  },
  {
    key: 'balanceAfter',
    label: 'After',
    width: 110,
    align: 'right',
    render: (value) => (
      <span className="tabular-nums text-[var(--ui-text-secondary)]">{(value ?? 0).toFixed(1)}</span>
    ),
  },
  { key: 'reason', label: 'Reason', width: 220, render: (value) => <TextCell value={value} tone="secondary" /> },
];
