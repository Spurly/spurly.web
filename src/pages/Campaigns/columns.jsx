import { Trash2, UserPlus, MessageSquare, CircleDashed } from 'lucide-react';
import { timeAgo, STATUS_STYLES, ACTION_LABELS } from './helpers';

function StatusBadge({ value }) {
  const s = STATUS_STYLES[value] || STATUS_STYLES.draft;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function NameCell({ value, row }) {
  const Icon =
    row.actionType === 'message' ? MessageSquare : row.actionType === 'connection' ? UserPlus : CircleDashed;
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span
        className="w-7 h-7 rounded-[8px] grid place-items-center shrink-0"
        style={{ background: 'var(--accent-tint)', color: 'var(--brand-purple)' }}
      >
        <Icon size={14} />
      </span>
      <div className="min-w-0">
        <span className="block text-[13.5px] font-semibold text-[var(--text-primary)] truncate">
          {value || 'Untitled campaign'}
        </span>
        <span className="block text-[11.5px] text-[var(--text-tertiary)] truncate">
          {ACTION_LABELS[row.actionType] || 'No action set'}
        </span>
      </div>
    </div>
  );
}

function ProgressCell({ row }) {
  const total = row.stats?.total ?? 0;
  const completed = row.stats?.completed ?? 0;
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)] tabular-nums">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: completed > 0 ? 'var(--green)' : 'var(--border-default)' }}
      />
      {completed}/{total}
    </span>
  );
}

/**
 * @param {(row) => void} onDelete - called with the campaign row when the trash icon is clicked
 */
export function buildCampaignColumns(onDelete) {
  return [
    {
      key: 'status',
      label: 'Status',
      width: '110px',
      minWidth: '96px',
      render: (value) => <StatusBadge value={value} />,
    },
    {
      key: 'name',
      label: 'Campaign Name',
      width: 'auto',
      minWidth: '240px',
      render: (value, row) => <NameCell value={value} row={row} />,
    },
    {
      key: 'progress',
      label: 'Leads completed',
      width: '150px',
      minWidth: '130px',
      render: (_value, row) => <ProgressCell row={row} />,
    },
    {
      key: 'createdAt',
      label: 'Created at',
      width: '140px',
      minWidth: '120px',
      render: (value) => (
        <span className="text-[13px] text-[var(--text-tertiary)]">{timeAgo(value)}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '56px',
      minWidth: '56px',
      align: 'center',
      render: (_value, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(row);
          }}
          className="w-8 h-8 grid place-items-center rounded-[8px] text-[var(--text-tertiary)] hover:bg-[var(--red-tint)] hover:text-[var(--red)] transition-colors"
          title="Delete campaign"
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ];
}
