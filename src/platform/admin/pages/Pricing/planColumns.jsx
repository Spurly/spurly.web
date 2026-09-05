import { Pencil } from 'lucide-react';
import { Badge, IconButton } from 'src/ui/primitives';
import { ActionsCell, NumberCell } from 'src/platform/DataTable';

const limit = (row, key) => row.limits?.[key];

/** `onEdit(plan)` is invoked from the row action so every plan stays editable. */
export function buildPlanColumns(onEdit) {
  return [
    {
      key: 'displayName',
      label: 'Plan',
      width: 200,
      title: (row) => row.displayName,
      render: (value, row) => (
        <span className="flex items-center gap-2 min-w-0">
          <span className="truncate font-medium text-[var(--ui-text-primary)]">{value}</span>
          {row.isDefault && <Badge size="sm" tone="accent">Default</Badge>}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Key',
      width: 160,
      render: (value) => (
        <code className="truncate font-mono text-[11px] px-1.5 py-0.5 rounded-[var(--ui-radius-xs)] bg-[var(--ui-surface-sunken)] text-[var(--ui-text-secondary)]">
          {value}
        </code>
      ),
    },
    {
      key: 'captureCardsPerDay',
      label: 'Captures / day',
      width: 140,
      align: 'right',
      render: (_v, row) => <NumberCell value={limit(row, 'captureCardsPerDay')} />,
    },
    {
      key: 'sendConnectionsPerDay',
      label: 'Connections / day',
      width: 160,
      align: 'right',
      render: (_v, row) => <NumberCell value={limit(row, 'sendConnectionsPerDay')} />,
    },
    {
      key: 'sendMessagesPerDay',
      label: 'Messages / day',
      width: 150,
      align: 'right',
      render: (_v, row) => <NumberCell value={limit(row, 'sendMessagesPerDay')} />,
    },
    {
      key: 'isActive',
      label: 'Status',
      width: 120,
      render: (value) => (
        <Badge variant="minimal" tone={value !== false ? 'success' : 'neutral'} dot>
          {value !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 56,
      align: 'right',
      render: (_v, row) => (
        <ActionsCell>
          <IconButton size="sm" variant="ghost" label="Edit plan" icon={<Pencil size={14} />} onClick={() => onEdit(row)} />
        </ActionsCell>
      ),
    },
  ];
}
