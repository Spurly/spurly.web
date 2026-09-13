import { Pause, Play, Trash2 } from 'lucide-react';
import { IconButton } from 'src/ui/primitives';
import { ActionsCell, NumberCell } from 'src/platform/DataTable';
import { isLive } from 'src/products/hub/sequences/hooks/useSequencesPage.js';
import { SEQUENCE_STATUS_VIEW as STATUS_VIEW } from './statusView.js';
import { ListStatusCell } from '../../components/ListStatusCell.jsx';

/**
 * Columns for the sequences list — the campaigns list's twin, and deliberately
 * the same shape: name, one reading, status, row actions. See
 * hub/pages/campaigns/components/listColumns.jsx for why these lists became
 * tables.
 */

export function hubSequenceListColumns({ onStart, onPause, onDelete, busy }) {
  return [
    {
      key: 'name',
      label: 'Sequence',
      width: 280,
      title: (row) => row.name,
      render: (value) => (
        <span className="font-medium text-[var(--ui-text-primary)]">{value || 'Untitled sequence'}</span>
      ),
    },
    {
      key: 'steps',
      label: 'Steps',
      width: 90,
      align: 'right',
      /* The step COUNT, not the steps: what each one does is the detail page's
         job, and a list of four verbs per row would out-shout the names. */
      render: (value) => <NumberCell value={value?.length ?? 0} />,
    },
    {
      key: 'status',
      label: 'Status',
      width: 230,
      render: (_value, row) => (
        <ListStatusCell
          view={STATUS_VIEW[row.status] ?? STATUS_VIEW.draft}
          running={isLive(row)}
          pausedReason={row.pausedReason}
        />
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 92,
      align: 'right',
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
