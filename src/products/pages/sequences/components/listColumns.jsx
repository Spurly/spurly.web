import { Pause, Play, Trash2 } from 'lucide-react';
import { IconButton } from 'src/core/primitives';
import { ActionsCell, DateCell } from 'src/core/DataTable';
import { STEP_TYPES } from 'src/products/sequences/stepTypes.js';
import { isLive } from 'src/products/sequences/hooks/useSequencesPage.js';
import { SEQUENCE_STATUS_VIEW as STATUS_VIEW } from './statusView.js';
import { ListStatusCell } from '../../components/ListStatusCell.jsx';

/**
 * Columns for the sequences list — the campaigns list's twin, and deliberately
 * the same shape: name, one reading, status, row actions. See
 * hub/pages/campaigns/components/listColumns.jsx for why these lists became
 * tables.
 */

const STEP_BY_VALUE = Object.fromEntries(STEP_TYPES.map((s) => [s.value, s]));

function StepGlyphs({ steps = [] }) {
  if (!steps?.length) return <span className="text-[var(--ui-text-disabled)]">—</span>;
  return (
    <span className="flex items-center gap-1 min-w-0 overflow-hidden">
      {steps.slice(0, 8).map((step, i) => {
        const type = STEP_BY_VALUE[step.type];
        const Icon = type?.icon;
        return (
          <span key={i} className="flex items-center gap-1 shrink-0">
            {i > 0 && <span className="w-2 h-px bg-[var(--ui-border-strong)]" aria-hidden="true" />}
            <span
              title={type?.label ?? step.type}
              className={`grid place-items-center w-6 h-6 rounded-[var(--ui-radius-xs)] ${
                step.type === 'wait'
                  ? 'bg-[var(--ui-surface-sunken)] text-[var(--ui-text-quaternary)]'
                  : 'bg-[var(--ui-accent-tint)] text-[var(--ui-accent-fg)]'
              }`}
            >
              {Icon ? <Icon size={12} aria-hidden="true" /> : null}
            </span>
          </span>
        );
      })}
      {steps.length > 8 && (
        <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)] ml-1">+{steps.length - 8}</span>
      )}
    </span>
  );
}

export function hubSequenceListColumns({ onStart, onPause, onDelete, busy }) {
  return [
    {
      key: 'name',
      label: 'Sequence',
      width: 300,
      sortable: true,
      title: (row) => row.name,
      render: (value, row) => (
        <span className="flex flex-col min-w-0">
          <span className="truncate text-[length:var(--ui-t-nav)] font-medium text-[var(--ui-text-primary)] leading-[1.3]">
            {value || 'Untitled sequence'}
          </span>
          <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)] leading-[1.35]">
            {row.steps?.length ?? 0} {row.steps?.length === 1 ? 'step' : 'steps'}
          </span>
        </span>
      ),
    },
    {
      key: 'steps',
      label: 'Flow',
      width: 260,
      sortable: true,
      // The steps as their glyphs, in order — the sequence's shape at a
      // glance, the way the builder draws it.
      render: (value) => <StepGlyphs steps={value} />,
    },
    {
      key: 'status',
      label: 'Status',
      width: 200,
      sortable: true,
      render: (_value, row) => (
        <ListStatusCell
          view={STATUS_VIEW[row.status] ?? STATUS_VIEW.draft}
          running={isLive(row)}
          pausedReason={row.pausedReason}
        />
      ),
    },
    {
      key: 'lastRunAt',
      label: 'Last activity',
      width: 140,
      sortable: true,
      render: (value) => <DateCell value={value} />,
    },
    {
      key: 'createdAt',
      label: 'Created',
      width: 120,
      sortable: true,
      render: (value) => <DateCell value={value} />,
    },
    {
      key: 'actions',
      label: '',
      width: 92,
      align: 'right',
      locked: true,
      render: (_value, row) => {
        const running = isLive(row);
        return (
          <ActionsCell>
            {running ? (
              <IconButton
                size="sm"
                variant="ghost"
                label="Stop this sequence"
                icon={<Pause size={14} />}
                disabled={busy}
                onClick={() => onPause(row)}
              />
            ) : (
              <IconButton
                size="sm"
                variant="ghost"
                label={row.status === 'paused' ? 'Resume' : 'Start'}
                icon={<Play size={14} />}
                disabled={busy || row.status === 'done'}
                onClick={() => onStart(row)}
              />
            )}
            <IconButton
              size="sm"
              variant="ghost"
              label="Remove this sequence"
              icon={<Trash2 size={14} />}
              disabled={busy}
              onClick={() => onDelete(row)}
              className="hover:text-[var(--ui-danger-fg)] hover:bg-[var(--ui-danger-tint)]"
            />
          </ActionsCell>
        );
      },
    },
  ];
}
