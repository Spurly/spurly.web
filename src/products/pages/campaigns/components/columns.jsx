import { TextCell, PersonCell, ActivityCell } from 'src/core/DataTable';
import { Badge } from 'src/core/primitives';
import { recentContactStrings } from '../../components/recentContactStrings.js';

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
  invited: { label: 'Invited', tone: 'accent' },
  skipped: { label: 'Skipped', tone: 'neutral' },
  failed: { label: 'Failed', tone: 'danger' },
  connected: { label: 'Connected', tone: 'success' },
  messaged: { label: 'Messaged', tone: 'accent' },
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
  'not-connected': 'Not a 1st-degree connection yet',
  unresolvable: 'No LinkedIn id to send to',
  self: 'This is you',
  'sender-removed': 'The account that would send was removed',
  'held-by-other-account': 'Already in another campaign or sequence',
  'degree-unknown': 'Could not tell how your accounts are linked to them',
  'recently-messaged': recentContactStrings.skippedLabel,
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** The row's skip reason in words; a recently-messaged row says how long ago, from the date the server stored. */
const skipText = (row) => {
  if (row.skipReason === 'recently-messaged' && row.lastMessagedAt) {
    return recentContactStrings.skippedChip(Math.max(0, Math.floor((Date.now() - new Date(row.lastMessagedAt).getTime()) / DAY_MS)));
  }
  return SKIP_REASON[row.skipReason] || '';
};

/** Why an account did NOT send to this person, in the user's words (shown next to the account's name). */
const EXCLUDED_REASON = {
  'already-connected': 'already connected',
  'not-connected': 'not connected yet',
  'degree-unknown': 'link unknown',
  'held-by-other-account': 'already in another campaign or sequence',
};

/** "Not sent from Sarthak (already connected)" for the accounts that skipped this person; '' when none. */
export function excludedText(notes = []) {
  const parts = notes.map((n) => `${n.name || 'An account'} (${EXCLUDED_REASON[n.reason] || n.reason})`);
  return parts.length ? `Not sent from ${parts.join(', ')}` : '';
}

const whyText = (row) => [skipText(row) || row.lastError || '', excludedText(row.excludedNotes)].filter(Boolean).join(' · ');

export const hubMemberColumns = [
  {
    key: 'name',
    label: 'Name',
    width: 300,
    title: (row) => [row.name, row.headline].filter(Boolean).join(' — '),
    render: (value, row) => (
      <PersonCell name={value} avatar={row.profilePictureUrl} profileUrl={row.profileUrl} subtitle={row.headline} />
    ),
  },
  {
    key: 'status',
    label: 'Status',
    width: 130,
    render: (value) => {
      const view = STATUS_VIEW[value] ?? STATUS_VIEW.pending;
      return (
        <Badge tone={view.tone} dot>
          {view.label}
        </Badge>
      );
    },
  },
  {
    key: 'skipReason',
    label: 'Why',
    width: 260,
    // One column for both explanations: a row is skipped or it failed, never
    // both, and two half-empty columns would read as missing data.
    title: (row) => skipText(row) || row.lastError || '',
    render: (value, row) => <TextCell value={skipText(row) || row.lastError || null} tone="secondary" />,
  },
  {
    key: 'sentAt',
    label: 'Sent',
    width: 130,
    render: (value) => <ActivityCell label={value ? 'Sent' : null} at={value} />,
  },
];

/** A pool's members also show which account works each person. Solo and single-account tables are unchanged. */
export const hubPoolMemberColumns = [
  hubMemberColumns[0],
  {
    key: 'senderName',
    label: 'Sent from',
    width: 160,
    render: (value, row) => <TextCell value={value || (row.status === 'pending' ? 'Decided when it is sent' : null)} tone="secondary" />,
  },
  hubMemberColumns[1],
  {
    key: 'skipReason',
    label: 'Why',
    width: 320,
    title: (row) => whyText(row),
    render: (value, row) => <TextCell value={whyText(row) || null} tone="secondary" />,
  },
  hubMemberColumns[3],
];
