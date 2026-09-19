import { IconButton } from 'src/core/primitives';
import { TrashIcon } from 'src/core/icons';
import { ActionsCell, MeterCell } from 'src/core/DataTable';
import { relativeTime, absoluteTime } from 'src/shared/utils/outreach';
import { ENRICHMENT_STATUS_VIEW as STATUS_VIEW } from './statusView.js';
import { ListStatusCell } from '../../components/ListStatusCell.jsx';

/**
 * Columns for the enrichment batches list (v3 — no mockup of its own; drawn
 * in the Leads v2 / Campaigns register): the batch name over a mono "when",
 * people, progress as the one meter (enriched / total — a real ceiling),
 * failures in red only when there are any, and the minimal status reading.
 */
export function enrichmentListColumns({ onDelete, busy }) {
  return [
    {
      key: 'name',
      label: 'Batch',
      width: 280,
      sortable: true,
      title: (row) => row.name,
      render: (value, row) => (
        <span className="flex flex-col min-w-0">
          <span className="truncate text-[length:var(--ui-t-nav)] font-medium text-[var(--ui-text-primary)] leading-[1.3]">
            {value || 'Untitled batch'}
          </span>
          <span
            className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-micro)] text-[var(--ui-text-quaternary)] leading-[1.35]"
            title={absoluteTime(row.createdAt)}
          >
            created {relativeTime(row.createdAt)} ago
          </span>
        </span>
      ),
    },
    {
      key: 'leadIds',
      label: 'People',
      width: 96,
      align: 'right',
      sortable: true,
      render: (value, row) => (
        <span className="ui-num !font-normal text-[length:var(--ui-t-meta)] text-[var(--ui-text-body)]">
          {(row.counts?.total ?? value?.length ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'counts',
      label: 'Progress',
      width: 220,
      render: (value) => (
        <MeterCell value={value?.enriched ?? 0} max={value?.total ?? 0} label="enriched" tone="success" width={170} />
      ),
    },
    {
      key: 'inFlight',
      label: 'In progress',
      width: 120,
      render: (_v, row) => {
        const n = (row.counts?.queued ?? 0) + (row.counts?.enriching ?? 0);
        return (
          <span className={`ui-num !font-normal text-[length:var(--ui-t-meta)] ${n ? 'text-[var(--ui-accent-fg)]' : 'text-[var(--ui-text-disabled)]'}`}>
            {n ? n.toLocaleString() : '—'}
          </span>
        );
      },
    },
    {
      key: 'failed',
      label: 'Failed',
      width: 96,
      render: (_v, row) => {
        const n = row.counts?.failed ?? 0;
        return (
          <span className={`ui-num !font-normal text-[length:var(--ui-t-meta)] ${n ? 'text-[var(--ui-danger-fg)]' : 'text-[var(--ui-text-disabled)]'}`}>
            {n ? n.toLocaleString() : '—'}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      width: 140,
      sortable: true,
      render: (value) => (
        <ListStatusCell view={STATUS_VIEW[value] ?? STATUS_VIEW.done} running={value === 'running'} />
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 64,
      align: 'right',
      locked: true,
      render: (_value, row) => (
        <ActionsCell>
          <IconButton
            size="sm"
            variant="ghost"
            label="Remove this batch"
            icon={<TrashIcon size={14} />}
            disabled={busy}
            onClick={() => onDelete(row)}
            className="hover:!text-[var(--ui-danger-fg)] hover:!bg-[var(--ui-danger-tint)]"
          />
        </ActionsCell>
      ),
    },
  ];
}
