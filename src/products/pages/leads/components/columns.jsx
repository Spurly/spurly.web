import { Badge } from 'src/core/primitives';
import {
  TextCell,
  PersonCell,
  LocationCell,
  ActivityCell,
  SoonCell,
  soonLabel,
} from 'src/core/DataTable';

/** 1st / 2nd / 3rd, from the normalised degree the backend stores. */
const DEGREE_LABEL = { 1: '1st', 2: '2nd', 3: '3rd' };

/**
 * Follower counts are BUCKETS, not counts.
 *
 * LinkedIn returned 3000, 21000, 2000 — round numbers because that is what it
 * publishes, the same way a profile reads "3K followers". Rendering "21,000"
 * claims a precision nobody has, and a comma-formatted figure is exactly the
 * kind of number someone quotes in a pitch. "21K" says what we actually know.
 */
export function formatFollowers(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${Math.round(n / 100_000) / 10}M`;
  if (n >= 1_000) {
    const k = n / 1000;
    // 1.5K reads as measured; 21.0K reads as false precision.
    return `${k < 10 ? Math.round(k * 10) / 10 : Math.round(k)}K`;
  }
  return String(n);
}

/**
 * Columns for hub leads.
 *
 * COMPANY AND TITLE, PHASE 6 (1b) — these are populated by the LAZY resolve
 * pass (opening the lead drawer fires `GET /hub/leads/:id/profile`, see
 * LeadDrawer.jsx), not by the search import. A search-only row has neither:
 * there is no `current_positions`/`work_experience` on a search result (only
 * on the full-profile endpoint), which is exactly why this column used to not
 * exist at all — "empty on every row is worse than no column." That reasoning
 * no longer holds now that the fields fill in for real once a row is opened,
 * but it means these two columns are correctly blank for a lead nobody has
 * looked at yet, not broken. There is still deliberately no `industry`
 * column: verified live 2026-09-10 (see [[hub_phase6_kickoff]]) that neither
 * endpoint returns one.
 *
 * The company/title are still legible in the headline
 * ("Head of Sales at Energy One Ltd") for a row that hasn't been resolved —
 * this column is a faster scan once it has been, not a replacement.
 *
 * Close to the Contacts columns but not the same table and not the same data:
 * these people came from a search the user ran, not from a profile they chose
 * to capture, so there is no outreach status yet and no notes. Both arrive with
 * the sending engine; columns for them now would be empty forever.
 *
 * Degree is present here and absent on Connections for the opposite reason —
 * there every row is 1st by definition, here it is the single most useful
 * filter, because a 1st-degree lead cannot be invited and a 3rd may not be
 * reachable at all.
 */
/*
 * v3 (Blue identity) — the Leads v2 table, column for column:
 *
 *   Name (+ headline under it) · Title · Company · Location · Deg ·
 *   Fit · Signal · Status · Enrichment · Last activity
 *
 * Fit and Signal are drawn but not built — no scoring pass exists yet
 * (docs/UI_REDESIGN_DEFERRED_FEATURES.md §1). They render as SOON columns
 * rather than being left out, so the screen reads as designed and nobody
 * mistakes an em dash for a score.
 *
 * Status is DERIVED from real fields, never guessed: a 1st-degree lead is
 * Connected; one with an invitation out is Invited; everyone else is New.
 * Last activity is the invitation if there is one, else when the lead was
 * imported. The LinkedIn link lives on the lead drawer (one click away) —
 * the handoff's table has no link column.
 *
 * Followers dropped off the table (it was never in the handoff). The value
 * is still in the lead drawer's profile block.
 */
const STATUS_VIEW = {
  connected: { label: 'Connected', tone: 'success' },
  invited: { label: 'Invited', tone: 'accent' },
  new: { label: 'New', tone: 'neutral' },
};

export function leadStatus(row = {}) {
  if (row.connectionDegree === 1) return 'connected';
  if (row.pendingInvitationSentAt || row.pendingInvitationId) return 'invited';
  return 'new';
}

function StatusCell({ row }) {
  const view = STATUS_VIEW[leadStatus(row)];
  return (
    <Badge tone={view.tone} dot>
      {view.label}
    </Badge>
  );
}

function activityOf(row = {}) {
  if (row.pendingInvitationSentAt) return { label: 'Invite sent', at: row.pendingInvitationSentAt };
  if (row.createdAt) return { label: 'Imported', at: row.createdAt };
  return { label: null, at: null };
}

export const hubLeadColumns = [
  {
    key: 'name',
    label: 'Name',
    width: 250,
    sortable: true,
    title: (row) => [row.name, row.headline].filter(Boolean).join(' — '),
    render: (value, row) => (
      <PersonCell name={value} avatar={row.profilePictureUrl} profileUrl={row.profileUrl} subtitle={row.headline} />
    ),
  },
  {
    key: 'currentTitle',
    label: 'Title',
    width: 176,
    title: (row) => row.currentTitle,
    // Blank until the lead's full profile has been resolved (open the
    // drawer, or enrich) — correctly empty, not broken.
    render: (value) => <TextCell value={value || null} tone="body" />,
  },
  {
    key: 'companyName',
    label: 'Company',
    width: 158,
    sortable: true,
    title: (row) => row.companyName,
    render: (value) => <TextCell value={value || null} tone="body" />,
  },
  {
    key: 'location',
    label: 'Location',
    width: 150,
    sortable: true,
    render: (value) => <LocationCell value={value} />,
  },
  {
    key: 'connectionDegree',
    label: 'Deg',
    width: 64,
    align: 'center',
    render: (value) => (
      <span className="font-[family-name:var(--ui-font-mono)] text-[length:var(--ui-t-meta)] text-[var(--ui-text-secondary)]">
        {DEGREE_LABEL[value] ?? '—'}
      </span>
    ),
  },
  {
    key: 'fitScore',
    label: soonLabel('Fit'),
    width: 118,
    render: () => <SoonCell meter />,
  },
  {
    key: 'fitReason',
    label: soonLabel('Signal'),
    width: 168,
    render: () => <SoonCell />,
  },
  {
    key: 'leadStatus',
    label: 'Status',
    width: 128,
    render: (_value, row) => <StatusCell row={row} />,
  },
  {
    key: 'enrichmentStatus',
    label: 'Enrichment',
    width: 150,
    render: (value, row) => <EnrichStatusCell value={value} row={row} />,
  },
  {
    key: 'lastActivity',
    label: 'Last activity',
    width: 140,
    render: (_value, row) => {
      const a = activityOf(row);
      return <ActivityCell label={a.label} at={a.at} />;
    },
  },
];

/**
 * Enrichment status, one badge per state — same shape as importedLeads'
 * own EnrichStatusCell (stagingColumns.jsx), reused here rather than shared
 * because the two enums differ ('none'/'failed' carry a `lastEnrichError`
 * here; ImportedLead's is 'pending'/'enrichError').
 */
const ENRICH_STATUS = {
  none:      { label: 'Not enriched', tone: 'neutral', dot: true },
  queued:    { label: 'Queued',       tone: 'warning', dot: true },
  enriching: { label: 'Enriching',    tone: 'info',    dot: true, pulse: true },
  enriched:  { label: 'Enriched',     tone: 'success', dot: true },
  failed:    { label: 'Failed',       tone: 'danger',  dot: true },
};

export function EnrichStatusCell({ value, row = {} }) {
  const s = ENRICH_STATUS[value] || ENRICH_STATUS.none;
  // The failure reason is the most useful thing here, and a tooltip keeps it
  // out of the way until something has actually gone wrong.
  const title = value === 'failed' && row.lastEnrichError ? row.lastEnrichError : undefined;
  return <Badge variant="minimal" tone={s.tone} dot={s.dot} pulse={s.pulse} title={title}>{s.label}</Badge>;
}

/**
 * Columns for the "Needs enrichment" tab — the same table. Enrichment is
 * already a column in v3, so this is the one array under a second name
 * (kept so the page, and anything importing it, stays unchanged).
 */
export const hubLeadEnrichColumns = hubLeadColumns;
