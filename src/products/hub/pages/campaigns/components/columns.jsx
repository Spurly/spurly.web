import { LinkedInIcon } from 'src/ui/icons';
import { TextCell, PersonCell, LinkCell, DateCell } from 'src/platform/DataTable';
import { Badge } from 'src/ui/primitives';

/**
 * Columns for the people in a campaign.
 *
 * Two of these exist to answer questions a bare status cannot. "Skipped" is
 * meaningless without the reason — being already connected is a good outcome,
 * being unreachable is a data problem — and a failure the user cannot read is
 * a failure they cannot act on.
 *
 * There is no column for the invitation id. It is stored on every send and
 * matters enormously to the code (it is what an acceptance will be matched
 * against, and it cannot be backfilled), but it is an opaque number that means
 * nothing to the person reading this table.
 */

const STATUS_VIEW = {
  pending: { label: 'Queued', tone: 'neutral' },
  invited: { label: 'Invited', tone: 'success' },
  skipped: { label: 'Skipped', tone: 'neutral' },
  failed: { label: 'Failed', tone: 'danger' },
  connected: { label: 'Connected', tone: 'success' },
  messaged: { label: 'Messaged', tone: 'info' },
};

/**
 * Skip reasons in the user's language, not the enum's.
 *
 * `already-invited` is the one worth spelling out: it counts sends made from
 * the browser extension too, and someone who does not know that reads it as a
 * bug in the campaign they just built.
 */
const SKIP_REASON = {
  'already-connected': 'Already a connection',
  'already-invited': 'Already invited — including from the extension',
  unresolvable: 'No LinkedIn id to send to',
  self: 'This is you',
};

export const hubMemberColumns = [
  {
    key: 'profileUrl',
    label: <LinkedInIcon size={14} aria-label="LinkedIn" />,
    width: 44,
    align: 'center',
    render: (value) => <LinkCell href={value} icon={<LinkedInIcon size={14} />} label="Open LinkedIn profile" />,
  },
  {
    key: 'name',
    label: 'Name',
    width: 200,
    title: (row) => row.name,
    render: (value, row) => <PersonCell name={value} profileUrl={row.profileUrl} />,
  },
  {
    key: 'headline',
    label: 'Headline',
    width: 260,
    title: (row) => row.headline,
    render: (value) => <TextCell value={value} tone="secondary" />,
  },
  {
    key: 'status',
    label: 'Status',
    width: 120,
    render: (value) => {
      const view = STATUS_VIEW[value] ?? STATUS_VIEW.pending;
      return <Badge tone={view.tone}>{view.label}</Badge>;
    },
  },
  {
    key: 'skipReason',
    label: 'Why',
    width: 260,
    // One column for both explanations: a row is skipped or it failed, never
    // both, and two half-empty columns would read as missing data.
    title: (row) => SKIP_REASON[row.skipReason] || row.lastError || '',
    render: (value, row) => (
      <TextCell value={SKIP_REASON[value] || row.lastError || '—'} tone="secondary" />
    ),
  },
  {
    key: 'sentAt',
    label: 'Sent',
    width: 140,
    render: (value) => (value ? <DateCell value={value} /> : <TextCell value="—" tone="tertiary" />),
  },
];
