import { Trash2, UserPlus, MessageSquare, CircleDashed } from 'lucide-react';
import { IconButton, Badge } from 'src/ui/primitives';
import { ActionsCell, DateCell } from 'src/ui/DataTable';
import { ACTION_LABELS } from './helpers';

const STATUS_TONE = {
  draft: 'neutral',
  running: 'accent',
  paused: 'warning',
  completed: 'success',
  failed: 'danger',
};

const ACTION_ICON = { message: MessageSquare, connection: UserPlus };

function CampaignNameCell({ value, row }) {
  const Icon = ACTION_ICON[row.actionType] || CircleDashed;

  return (
    <span className="flex items-center gap-2 min-w-0">
      <span
        className="grid place-items-center w-5 h-5 shrink-0 rounded-[var(--ui-radius-xs)] bg-[var(--ui-surface-sunken)] text-[var(--ui-text-secondary)]"
        aria-hidden="true"
      >
        <Icon size={12} />
      </span>
      <span className="truncate font-medium text-[var(--ui-text-primary)]">
        {value || 'Untitled campaign'}
      </span>
      <span className="shrink-0 text-[11px] text-[var(--ui-text-tertiary)]">
        {ACTION_LABELS[row.actionType] || 'No action set'}
      </span>
    </span>
  );
}

/**
 * Progress as a bar plus a fraction. A bare "12/50" makes you do the division;
 * the bar answers "how far along" before you read the number.
 */
function ProgressCell({ row }) {
  const total = row.stats?.total ?? 0;
  const completed = row.stats?.completed ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const done = total > 0 && completed >= total;

  return (
    <span className="flex items-center gap-2 min-w-0" title={`${completed} of ${total} complete`}>
      <span className="w-12 h-1 rounded-full overflow-hidden bg-[var(--ui-border)] shrink-0" aria-hidden="true">
        <span
          className="block h-full rounded-full transition-[width] duration-[var(--ui-dur-base)]"
          style={{
            width: `${pct}%`,
            background: done ? 'var(--ui-success-dot)' : 'var(--ui-accent-dot)',
          }}
        />
      </span>
      <span className="tabular-nums text-[var(--ui-text-secondary)]">
        {completed}/{total}
      </span>
    </span>
  );
}

/** @param {(row) => void} onDelete */
export function buildCampaignColumns(onDelete) {
  return [
    {
      key: 'name',
      label: 'Campaign',
      width: 320,
      title: (row) => row.name,
      render: (value, row) => <CampaignNameCell value={value} row={row} />,
    },
    {
      key: 'status',
      label: 'Status',
      width: 120,
      render: (value) => (
        <Badge variant="minimal" tone={STATUS_TONE[value] ?? 'neutral'} dot>
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Draft'}
        </Badge>
      ),
    },
    {
      key: 'progress',
      label: 'Progress',
      width: 150,
      render: (_value, row) => <ProgressCell row={row} />,
    },
    {
      key: 'createdAt',
      label: 'Created',
      width: 130,
      render: (value) => <DateCell value={value} />,
    },
    {
      key: 'actions',
      label: '',
      width: 56,
      align: 'right',
      render: (_value, row) => (
        <ActionsCell>
          <IconButton
            size="sm"
            variant="ghost"
            label="Delete campaign"
            icon={<Trash2 size={14} />}
            onClick={() => onDelete(row)}
            className="hover:text-[var(--ui-danger-fg)] hover:bg-[var(--ui-danger-tint)]"
          />
        </ActionsCell>
      ),
    },
  ];
}
