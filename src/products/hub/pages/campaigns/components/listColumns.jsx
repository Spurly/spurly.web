import { Pause, Play, Trash2 } from 'lucide-react';
import { IconButton } from 'src/ui/primitives';
import { ActionsCell, TextCell } from 'src/platform/DataTable';
import { isLive } from 'src/products/hub/campaigns/hooks/useCampaigns.js';
import { CountPills } from './CountPills.jsx';
import { CAMPAIGN_STATUS_VIEW as STATUS_VIEW } from './statusView.js';
import { ListStatusCell } from '../../components/ListStatusCell.jsx';

/**
 * Columns for the campaigns list.
 *
 * The list was a hand-rolled row inside a card until this file existed. It is
 * a table now for the same reason the members list always was: name, counts
 * and status in fixed columns are scannable down the page, and the table owns
 * the loading, empty and pagination states that each hand-rolled list was
 * re-inventing (badly — the old one's loading state was the word "Loading").
 */

export function hubCampaignListColumns({ onStart, onPause, onDelete, busy }) {
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
      width: 250,
      render: (value) => <CountPills counts={value} />,
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
      key: 'note',
      label: 'Note',
      width: 90,
      /* Whether a campaign personalises its invitation is a yes/no a user
         scans for, not prose — the note itself is on the detail page. */
      render: (value) => <TextCell value={value ? 'Note' : null} tone="secondary" />,
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
                label="Stop sending"
                icon={<Pause size={14} />}
                disabled={busy}
                onClick={() => onPause(row)}
              />
            ) : (
              <IconButton
                size="sm"
                variant="ghost"
                label={row.status === 'paused' ? 'Resume sending' : 'Start sending'}
                icon={<Play size={14} />}
                disabled={busy || row.status === 'done'}
                onClick={() => onStart(row)}
              />
            )}
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
        );
      },
    },
  ];
}
