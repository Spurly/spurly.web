import { Badge, Button } from 'src/ui/primitives';
import { TextCell, ActionsCell, CalendarCell } from 'src/platform/DataTable';

/**
 * Admin Users columns. Action handlers are injected so each row can manage
 * credits and plan without the column file knowing about modals.
 */
export function buildUserColumns({ onManageCredits, onManagePlan }) {
  return [
    {
      key: 'email',
      label: 'Email',
      width: 240,
      render: (value) => <span className="font-medium text-[var(--ui-text-primary)]">{value}</span>,
    },
    { key: 'name', label: 'Name', width: 170, render: (value) => <TextCell value={value} tone="secondary" /> },
    {
      key: 'plan',
      label: 'Plan',
      width: 140,
      title: (row) => row.planId?.displayName || 'Default',
      render: (_v, row) => <Badge tone="accent">{row.planId?.displayName || 'Default'}</Badge>,
    },
    {
      key: 'creditBalance',
      label: 'Credits',
      width: 110,
      align: 'right',
      render: (value) => (
        <span className="tabular-nums text-[var(--ui-text-primary)]">{(value ?? 0).toFixed(1)}</span>
      ),
    },
    { key: 'createdAt', label: 'Joined', width: 160, render: (value) => <CalendarCell value={value} /> },
    {
      key: 'actions',
      label: '',
      width: 150,
      align: 'right',
      render: (_v, row) => (
        <ActionsCell>
          <Button size="sm" variant="ghost" onClick={() => onManageCredits(row)}>
            Credits
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onManagePlan(row)}>
            Plan
          </Button>
        </ActionsCell>
      ),
    },
  ];
}
