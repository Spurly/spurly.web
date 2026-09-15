import { Trash2 } from 'lucide-react';
import { IconButton } from 'src/core/primitives';
import { ActionsCell } from 'src/core/DataTable';
import { CountPills } from './CountPills.jsx';
import { ENRICHMENT_STATUS_VIEW as STATUS_VIEW } from './statusView.js';
import { ListStatusCell } from '../../components/ListStatusCell.jsx';

/** Columns for the enrichment campaigns list — same shape as campaigns'
 *  own listColumns.jsx, trimmed to the one row action this feature has. */
export function enrichmentListColumns({ onDelete, busy }) {
  return [
    {
      key: 'name',
      label: 'Campaign',
      width: 260,
      title: (row) => row.name,
      render: (value) => (
        <span className="font-medium text-[var(--ui-text-primary)]">{value || 'Untitled campaign'}</span>
      ),
    },
    {
      key: 'counts',
      label: 'Progress',
      width: 280,
      render: (value) => <CountPills counts={value} />,
    },
    {
      key: 'status',
      label: 'Status',
      width: 150,
      render: (value) => (
        <ListStatusCell view={STATUS_VIEW[value] ?? STATUS_VIEW.done} running={value === 'running'} />
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 60,
      align: 'right',
      render: (_value, row) => (
        <ActionsCell>
          <IconButton
            size="sm"
            variant="ghost"
            label="Remove this campaign"
            icon={<Trash2 size={14} />}
            disabled={busy}
            onClick={() => onDelete(row)}
            className="hover:text-[var(--ui-danger-fg)] hover:bg-[var(--ui-danger-tint)]"
          />
        </ActionsCell>
      ),
    },
  ];
}
