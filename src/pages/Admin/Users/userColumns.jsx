import { Badge } from 'src/common/components/Badge';
import { Button } from 'src/common/components/Button';

/**
 * Column definitions for the Admin Users DataTable.
 * Action handlers are injected so each row can manage credits / plan.
 */
export function buildUserColumns({ onManageCredits, onManagePlan }) {
  return [
    {
      key: 'email',
      label: 'Email',
      minWidth: '200px',
      render: (value) => (
        <span className="font-medium text-[var(--text-primary)]">{value}</span>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      minWidth: '140px',
      render: (value) => <span className="text-[var(--text-secondary)]">{value || '—'}</span>,
    },
    {
      key: 'plan',
      label: 'Plan',
      minWidth: '120px',
      render: (_v, row) => <Badge tone="primary">{row.planId?.displayName || 'Default'}</Badge>,
    },
    {
      key: 'creditBalance',
      label: 'Credits',
      align: 'right',
      minWidth: '100px',
      render: (value) => (
        <Badge tone="info">{(value ?? 0).toFixed(1)}</Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      minWidth: '110px',
      render: (value) => (
        <span className="text-[var(--text-tertiary)] text-[12px] tabular-nums">
          {value ? new Date(value).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      minWidth: '230px',
      align: 'right',
      render: (_v, row) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onManageCredits(row);
            }}
          >
            Credits
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onManagePlan(row);
            }}
          >
            Plan
          </Button>
        </div>
      ),
    },
  ];
}
