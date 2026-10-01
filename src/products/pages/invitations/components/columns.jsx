import { PersonCell } from 'src/core/DataTable';
import { Badge, Button } from 'src/core/primitives';
import { relativeTime } from 'src/shared/utils/outreach.js';
import { invitationsStrings } from '../strings.js';

const t = invitationsStrings;
const muted = 'text-[var(--ui-text-secondary)]';

function renderNote(text) {
  if (!text) return <span className={muted}>—</span>;
  return <span className={`${muted} truncate block`} title={text}>{text}</span>;
}

/** Sent: person, how long ago (with a Stale flag), the note, Withdraw. */
export function sentColumns({ busy, onWithdraw, staleAfterDays }) {
  return [
    {
      key: 'invitedName',
      label: t.sent.columns.person,
      width: 300,
      render: (value, row) => (
        <PersonCell
          name={value || 'LinkedIn member'}
          profileUrl={row.invitedPublicId ? `https://www.linkedin.com/in/${row.invitedPublicId}` : undefined}
          subtitle={row.invitedHeadline}
        />
      ),
    },
    {
      key: 'ageDays',
      label: t.sent.columns.sent,
      width: 190,
      render: (value, row) => (
        <span className="inline-flex items-center gap-2">
          <span className={muted}>{t.sent.age(value)}</span>
          {row.stale && <span title={t.sent.staleTitle(staleAfterDays)}><Badge tone="warning">{t.sent.stale}</Badge></span>}
        </span>
      ),
    },
    { key: 'note', label: t.sent.columns.note, width: 280, render: (value) => renderNote(value) },
    {
      key: 'unipileInvitationId',
      label: '',
      width: 110,
      align: 'right',
      render: (value, row) => (
        <Button size="sm" variant="ghost" onClick={() => onWithdraw(row)} loading={busy.has(value)} disabled={busy.has(value)}>
          {t.sent.withdraw}
        </Button>
      ),
    },
  ];
}

/** Received: person, their message, when, Accept / Decline. */
export function receivedColumns({ busy, onRespond }) {
  return [
    {
      key: 'inviterName',
      label: t.received.columns.person,
      width: 300,
      render: (value, row) => (
        <PersonCell name={value || 'LinkedIn member'} avatar={row.inviterPictureUrl} profileUrl={row.inviterProfileUrl || undefined} subtitle={row.inviterHeadline} />
      ),
    },
    { key: 'message', label: t.received.columns.message, width: 280, render: (value) => renderNote(value) },
    {
      key: 'receivedAt',
      label: t.received.columns.received,
      width: 130,
      render: (value) => <span className={muted}>{value ? `${relativeTime(value)}${relativeTime(value) === 'just now' ? '' : ' ago'}` : '—'}</span>,
    },
    {
      key: 'unipileInvitationId',
      label: '',
      width: 190,
      align: 'right',
      render: (value, row) => {
        const working = busy.has(value);
        if (!row.actionable) {
          return <span className={`${muted} text-[length:var(--ui-t-meta)]`} title={t.received.notActionable}>Answer on LinkedIn</span>;
        }
        return (
          <span className="inline-flex items-center gap-1.5">
            <Button size="sm" variant="primary" onClick={() => onRespond(row, 'accept')} loading={working} disabled={working}>{t.received.accept}</Button>
            <Button size="sm" variant="ghost" onClick={() => onRespond(row, 'decline')} disabled={working}>{t.received.decline}</Button>
          </span>
        );
      },
    },
  ];
}
