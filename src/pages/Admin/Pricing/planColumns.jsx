import { Pencil } from 'lucide-react';
import { Badge } from 'src/common/components/Badge';
import { Button } from 'src/common/components/Button';

/**
 * Column definitions for the Subscription Plans DataTable.
 * `onEdit(plan)` is invoked from the row action button so every plan is editable.
 */
export function buildPlanColumns(onEdit) {
  return [
    {
      key: 'displayName',
      label: 'Plan',
      minWidth: '160px',
      render: (value, row) => (
        <span className="inline-flex items-center gap-2">
          <span className="font-semibold text-[var(--text-primary)]">{value}</span>
          {row.isDefault && <Badge tone="primary">Default</Badge>}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Key',
      minWidth: '120px',
      render: (value) => (
        <code className="text-[12px] bg-[var(--surface-sunken)] px-2 py-1 rounded-[6px] text-[var(--text-secondary)]">
          {value}
        </code>
      ),
    },
    {
      key: 'captureCardsPerDay',
      label: 'Captures / day',
      align: 'right',
      minWidth: '120px',
      render: (_v, row) => (
        <span className="tabular-nums text-[var(--text-secondary)]">
          {row.limits?.captureCardsPerDay ?? '—'}
        </span>
      ),
    },
    {
      key: 'sendConnectionsPerDay',
      label: 'Connections / day',
      align: 'right',
      minWidth: '140px',
      render: (_v, row) => (
        <span className="tabular-nums text-[var(--text-secondary)]">
          {row.limits?.sendConnectionsPerDay ?? '—'}
        </span>
      ),
    },
    {
      key: 'sendMessagesPerDay',
      label: 'Messages / day',
      align: 'right',
      minWidth: '130px',
      render: (_v, row) => (
        <span className="tabular-nums text-[var(--text-secondary)]">
          {row.limits?.sendMessagesPerDay ?? '—'}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      minWidth: '100px',
      render: (value) =>
        value !== false ? (
          <Badge tone="success" dot>
            Active
          </Badge>
        ) : (
          <Badge tone="neutral" dot>
            Inactive
          </Badge>
        ),
    },
    {
      key: 'actions',
      label: '',
      width: '96px',
      minWidth: '96px',
      align: 'right',
      render: (_v, row) => (
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<Pencil size={14} />}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(row);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];
}
